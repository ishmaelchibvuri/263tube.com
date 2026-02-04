/**
 * Analytics Tracking for Question Difficulty and User Struggles
 *
 * AWS Free Tier Compatible:
 * - Uses existing DynamoDB table
 * - Aggregates data to minimize writes
 * - Batch operations where possible
 *
 * Tracks:
 * - Global question difficulty (accuracy across all users)
 * - Question attempt distribution
 * - Time-to-answer patterns
 * - Category performance
 */

import { DatabaseService, DatabaseHelpers, DynamoDBItem } from "./database";

export interface QuestionAnalytics {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  globalAccuracy: number; // Overall accuracy across all users
  averageTimeSeconds: number;
  difficultyRating: "easy" | "medium" | "hard" | "very_hard";
  category: string;
  taskCategory?: string;
  lastUpdated: string;
}

export interface CategoryAnalytics {
  category: string;
  totalAttempts: number;
  averageAccuracy: number;
  questionsCount: number;
  strugglingQuestions: string[]; // Question IDs with < 50% accuracy
}

export class Analytics {
  /**
   * Update global question analytics after each attempt
   * Uses atomic counters to prevent race conditions
   */
  static async trackQuestionAttempt(
    questionId: string,
    isCorrect: boolean,
    timeSpentSeconds: number,
    questionData: any
  ): Promise<void> {
    try {
      const pk = `ANALYTICS#QUESTION#${questionId}`;
      const sk = "GLOBAL";

      // Use DynamoDB atomic counters for concurrent updates
      const updateExpression =
        "ADD totalAttempts :one, " +
        (isCorrect ? "correctAttempts :one" : "incorrectAttempts :one") +
        ", totalTimeSeconds :time " +
        "SET #category = :category, #taskCategory = :taskCategory, lastUpdated = :now";

      const expressionAttributeNames = {
        "#category": "category",
        "#taskCategory": "taskCategory",
      };

      const expressionAttributeValues = {
        ":one": 1,
        ":time": timeSpentSeconds,
        ":category": questionData.category || "General",
        ":taskCategory": questionData.taskCategory || null,
        ":now": new Date().toISOString(),
      };

      await DatabaseService.updateItem(
        pk,
        sk,
        updateExpression,
        expressionAttributeValues,
        expressionAttributeNames
      );

      console.log(`Analytics tracked for question ${questionId}: ${isCorrect ? 'correct' : 'incorrect'}`);
    } catch (error) {
      // Analytics failures shouldn't break the main flow
      console.error(`Error tracking question analytics for ${questionId}:`, error);
    }
  }

  /**
   * Get global analytics for a specific question
   */
  static async getQuestionAnalytics(questionId: string): Promise<QuestionAnalytics | null> {
    try {
      const pk = `ANALYTICS#QUESTION#${questionId}`;
      const sk = "GLOBAL";

      const item = await DatabaseService.getItem(pk, sk);

      if (!item) {
        return null;
      }

      const totalAttempts = item.totalAttempts || 0;
      const correctAttempts = item.correctAttempts || 0;
      const incorrectAttempts = item.incorrectAttempts || 0;
      const globalAccuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
      const totalTimeSeconds = item.totalTimeSeconds || 0;
      const averageTimeSeconds = totalAttempts > 0 ? totalTimeSeconds / totalAttempts : 0;

      // Determine difficulty rating based on global accuracy
      let difficultyRating: "easy" | "medium" | "hard" | "very_hard";
      if (globalAccuracy >= 80) {
        difficultyRating = "easy";
      } else if (globalAccuracy >= 60) {
        difficultyRating = "medium";
      } else if (globalAccuracy >= 40) {
        difficultyRating = "hard";
      } else {
        difficultyRating = "very_hard";
      }

      return {
        questionId,
        totalAttempts,
        correctAttempts,
        incorrectAttempts,
        globalAccuracy: Math.round(globalAccuracy * 100) / 100,
        averageTimeSeconds: Math.round(averageTimeSeconds * 100) / 100,
        difficultyRating,
        category: item.category || "General",
        taskCategory: item.taskCategory,
        lastUpdated: item.lastUpdated || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error getting question analytics for ${questionId}:`, error);
      return null;
    }
  }

  /**
   * Get analytics for all questions (for admin dashboard)
   */
  static async getAllQuestionAnalytics(): Promise<QuestionAnalytics[]> {
    try {
      const items = await DatabaseService.queryItems(
        "begins_with(PK, :prefix) AND SK = :sk",
        {
          ":prefix": "ANALYTICS#QUESTION#",
          ":sk": "GLOBAL",
        }
      );

      const analytics: QuestionAnalytics[] = [];

      for (const item of items) {
        const questionId = item.PK?.toString().replace("ANALYTICS#QUESTION#", "") || "";
        const totalAttempts = item.totalAttempts || 0;
        const correctAttempts = item.correctAttempts || 0;
        const incorrectAttempts = item.incorrectAttempts || 0;
        const globalAccuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
        const totalTimeSeconds = item.totalTimeSeconds || 0;
        const averageTimeSeconds = totalAttempts > 0 ? totalTimeSeconds / totalAttempts : 0;

        let difficultyRating: "easy" | "medium" | "hard" | "very_hard";
        if (globalAccuracy >= 80) {
          difficultyRating = "easy";
        } else if (globalAccuracy >= 60) {
          difficultyRating = "medium";
        } else if (globalAccuracy >= 40) {
          difficultyRating = "hard";
        } else {
          difficultyRating = "very_hard";
        }

        analytics.push({
          questionId,
          totalAttempts,
          correctAttempts,
          incorrectAttempts,
          globalAccuracy: Math.round(globalAccuracy * 100) / 100,
          averageTimeSeconds: Math.round(averageTimeSeconds * 100) / 100,
          difficultyRating,
          category: item.category || "General",
          taskCategory: item.taskCategory,
          lastUpdated: item.lastUpdated || new Date().toISOString(),
        });
      }

      return analytics;
    } catch (error) {
      console.error("Error getting all question analytics:", error);
      return [];
    }
  }

  /**
   * Get struggling questions (global accuracy < 50%)
   */
  static async getStrugglingQuestions(limit: number = 50): Promise<QuestionAnalytics[]> {
    try {
      const allAnalytics = await this.getAllQuestionAnalytics();

      // Filter and sort by accuracy (lowest first)
      const struggling = allAnalytics
        .filter(a => a.globalAccuracy < 50 && a.totalAttempts >= 10) // Min 10 attempts for statistical significance
        .sort((a, b) => a.globalAccuracy - b.globalAccuracy)
        .slice(0, limit);

      console.log(`Found ${struggling.length} struggling questions with < 50% accuracy`);
      return struggling;
    } catch (error) {
      console.error("Error getting struggling questions:", error);
      return [];
    }
  }

  /**
   * Get category-level analytics
   */
  static async getCategoryAnalytics(): Promise<CategoryAnalytics[]> {
    try {
      const allAnalytics = await this.getAllQuestionAnalytics();

      // Group by category
      const categoryMap = new Map<string, {
        totalAttempts: number;
        correctAttempts: number;
        questions: Set<string>;
        strugglingQuestions: Set<string>;
      }>();

      for (const qa of allAnalytics) {
        if (!categoryMap.has(qa.category)) {
          categoryMap.set(qa.category, {
            totalAttempts: 0,
            correctAttempts: 0,
            questions: new Set(),
            strugglingQuestions: new Set(),
          });
        }

        const cat = categoryMap.get(qa.category)!;
        cat.totalAttempts += qa.totalAttempts;
        cat.correctAttempts += qa.correctAttempts;
        cat.questions.add(qa.questionId);

        if (qa.globalAccuracy < 50) {
          cat.strugglingQuestions.add(qa.questionId);
        }
      }

      // Convert to analytics format
      const categoryAnalytics: CategoryAnalytics[] = [];

      for (const [category, data] of categoryMap.entries()) {
        const averageAccuracy = data.totalAttempts > 0
          ? (data.correctAttempts / data.totalAttempts) * 100
          : 0;

        categoryAnalytics.push({
          category,
          totalAttempts: data.totalAttempts,
          averageAccuracy: Math.round(averageAccuracy * 100) / 100,
          questionsCount: data.questions.size,
          strugglingQuestions: Array.from(data.strugglingQuestions),
        });
      }

      // Sort by accuracy (lowest first - struggling categories)
      categoryAnalytics.sort((a, b) => a.averageAccuracy - b.averageAccuracy);

      return categoryAnalytics;
    } catch (error) {
      console.error("Error getting category analytics:", error);
      return [];
    }
  }

  /**
   * Get difficulty distribution across all questions
   */
  static async getDifficultyDistribution(): Promise<{
    easy: number;
    medium: number;
    hard: number;
    very_hard: number;
  }> {
    try {
      const allAnalytics = await this.getAllQuestionAnalytics();

      const distribution = {
        easy: 0,
        medium: 0,
        hard: 0,
        very_hard: 0,
      };

      for (const qa of allAnalytics) {
        distribution[qa.difficultyRating]++;
      }

      console.log("Difficulty distribution:", distribution);
      return distribution;
    } catch (error) {
      console.error("Error getting difficulty distribution:", error);
      return { easy: 0, medium: 0, hard: 0, very_hard: 0 };
    }
  }
}
