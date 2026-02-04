import { DatabaseHelpers } from "./database";
import { QuizMode, SubscriptionTier } from "./types";
import { TaskCategory, TASK_CATEGORY_WEIGHTS } from "./enhanced-types";
import { ABTesting, EXPERIMENTS } from "./ab-testing";
import { Analytics } from "./analytics";

/**
 * Question Selection Engine
 * Handles logic for selecting questions based on different modes and criteria
 */

export interface Question {
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionType: "single" | "multiple" | "truefalse";
  options: Array<{ 
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
  points: number;
  timeLimit?: number;
  categories: string[]; // Multiple categories per question
  difficulty: string;
  examId: string;
}

export interface QuestionSelectionOptions {
  examId: string;
  numberOfQuestions: number;
  selectedCategories?: string[];
  quizMode?: QuizMode;
  userId?: string;
  userTier?: SubscriptionTier; // For tier-based question restrictions
  useBalancedSelection?: boolean; // Enable T1-T8 balanced selection
  useAdaptiveDifficulty?: boolean; // Enable global analytics-based difficulty weighting
}

export class QuestionSelector {
  /**
   * Select questions based on the provided options
   */
  static async selectQuestions(
    options: QuestionSelectionOptions
  ): Promise<Question[]> {
    const { examId, numberOfQuestions, selectedCategories, quizMode, userId, userTier, useBalancedSelection, useAdaptiveDifficulty } =
      options;

    let selectedQuestions: Question[] = [];

    // A/B Testing: Check if user is in balanced exam experiment
    let useBalanced = useBalancedSelection || false;
    if (userId && !useBalanced) {
      const variant = await ABTesting.assignUserToExperiment(userId, EXPERIMENTS.BALANCED_EXAM);
      if (variant === "variant_a") {
        useBalanced = true;
        console.log(`User ${userId} assigned to balanced exam variant`);
      }
    }

    // Handle different quiz modes
    switch (quizMode) {
      case "weak_areas":
        if (!userId) {
          throw new Error("userId is required for weak_areas mode");
        }
        selectedQuestions = await this.selectWeakQuestions(
          userId,
          numberOfQuestions,
          selectedCategories,
          userTier
        );
        break;

      case "bookmarked":
        if (!userId) {
          throw new Error("userId is required for bookmarked mode");
        }
        selectedQuestions = await this.selectBookmarkedQuestions(
          userId,
          numberOfQuestions,
          selectedCategories,
          userTier
        );
        break;

      case "all":
      default:
        // Use balanced selection if enabled (T1-T8 distribution)
        if (useBalanced && numberOfQuestions === 50) {
          console.log("Using balanced T1-T8 exam selection");
          selectedQuestions = await this.selectBalancedExam(examId, userId);
        }
        // Use smart selection if userId is provided (Premium/Pro users)
        else if (userId) {
          selectedQuestions = await this.selectSmartQuestions(
            userId,
            examId,
            numberOfQuestions,
            selectedCategories,
            userTier,
            useAdaptiveDifficulty
          );
        } else {
          // Fall back to random selection for non-logged-in users
          selectedQuestions = await this.selectRandomQuestions(
            examId,
            numberOfQuestions,
            selectedCategories,
            userTier
          );
        }
        break;
    }

    return selectedQuestions;
  }

  /**
   * Generate a balanced RE5 exam with T1-T8 strategic weighting
   *
   * Distribution for 50-question exam:
   * - T1: 8 questions (16%)
   * - T2: 8 questions (16%)
   * - T3: 7 questions (14%)
   * - T4: 6 questions (12%)
   * - T5: 7 questions (14%)
   * - T6: 5 questions (10%)
   * - T7: 5 questions (10%)
   * - T8: 4 questions (8%)
   *
   * @param examId - The exam ID to select questions from
   * @param userId - Optional user ID for personalized selection
   * @returns Array of 50 strategically weighted questions
   */
  static async selectBalancedExam(
    examId: string,
    userId?: string
  ): Promise<Question[]> {
    console.log(
      `Generating T1-T8 balanced exam from ${examId}${userId ? ` for user ${userId}` : ""}`
    );

    // Get all questions from the exam
    const allQuestions = await DatabaseHelpers.getExamQuestions(examId);

    console.log(`Total questions available: ${allQuestions.length}`);

    // Get user progress if userId provided (for smart selection)
    let progressMap = new Map();
    if (userId) {
      const userProgress = await DatabaseHelpers.getUserQuestionProgress(userId);
      userProgress.forEach((p: any) => {
      progressMap.set(p["questionId"], p);
      });
      console.log(`User has progress on ${userProgress.length} questions`);
    }

    // Group questions by task category
    const questionsByTask: Record<TaskCategory, any[]> = {
      T1: [],
      T2: [],
      T3: [],
      T4: [],
      T5: [],
      T6: [],
      T7: [],
      T8: [],
    };

    allQuestions.forEach((q) => {
      const task = q.taskCategory as TaskCategory;
      if (task && questionsByTask[task]) {
        questionsByTask[task].push(q);
      } else {
        console.warn(`Question ${q.questionId} has invalid or missing taskCategory: ${q.taskCategory}`);
      }
    });

    // Log distribution
    console.log("\nAvailable questions by task:");
    Object.keys(questionsByTask).forEach((task) => {
      console.log(`  ${task}: ${questionsByTask[task as TaskCategory].length} questions`);
    });

    const selectedQuestions: any[] = [];

    // Select questions from each task category according to weights
    for (const [task, targetCount] of Object.entries(TASK_CATEGORY_WEIGHTS)) {
      const taskCategory = task as TaskCategory;
      const availableQuestions = questionsByTask[taskCategory];

      if (availableQuestions.length === 0) {
        console.warn(`No questions available for ${taskCategory}`);
        continue;
      }

      console.log(`\nSelecting ${targetCount} questions from ${taskCategory} (${availableQuestions.length} available)...`);

      let taskQuestions: any[] = [];

      if (userId) {
        // Smart selection: prioritize unseen, then weak areas (if bank exhausted)
        const weakQuestions: any[] = [];
        const unseenQuestions: any[] = [];
        const seenCorrectQuestions: any[] = [];

        availableQuestions.forEach((q) => {
          const progress = progressMap.get(q.questionId);

          if (!progress) {
            unseenQuestions.push(q);
          } else if (progress.incorrectAttempts > 0 || progress.accuracy < 100) {
            weakQuestions.push({
              question: q,
              accuracy: progress.accuracy,
            });
          } else {
            seenCorrectQuestions.push(q);
          }
        });

        // Sort weak questions by accuracy (lowest first)
        weakQuestions.sort((a, b) => a["accuracy"] - b["accuracy"]);

        // Check if bank exhausted for this task category
        const bankExhaustedForTask = unseenQuestions.length === 0;

        console.log(`  - Unseen: ${unseenQuestions.length}, Weak: ${weakQuestions.length}, Correct: ${seenCorrectQuestions.length}, Bank exhausted: ${bankExhaustedForTask}`);

        if (!bankExhaustedForTask) {
          // Bank NOT exhausted: Only select unseen questions
          const shuffledUnseen = this.shuffleArray(unseenQuestions);
          for (const q of shuffledUnseen) {
            if (taskQuestions.length >= targetCount) break;
            taskQuestions.push(q);
          }

          // If we can't meet target with unseen only, that's acceptable
          // We won't repeat questions until bank is exhausted
          if (taskQuestions.length < targetCount) {
            console.log(`  - Only ${taskQuestions.length} unseen available (need ${targetCount}), avoiding repetition`);
          }
        } else {
          // Bank exhausted: Prioritize weak areas, then all questions
          // Priority 1: Weak questions
          for (const item of weakQuestions) {
            if (taskQuestions.length >= targetCount) break;
            taskQuestions.push(item.question);
          }

          // Priority 2: Correct questions
          if (taskQuestions.length < targetCount) {
            const shuffledCorrect = this.shuffleArray(seenCorrectQuestions);
            for (const q of shuffledCorrect) {
              if (taskQuestions.length >= targetCount) break;
              taskQuestions.push(q);
            }
          }

          // Priority 3: Cycle through all if still needed
          if (taskQuestions.length < targetCount) {
            const shuffledAll = this.shuffleArray(availableQuestions);
            for (const q of shuffledAll) {
              if (taskQuestions.length >= targetCount) break;
              if (!taskQuestions.some(tq => tq["questionId"] === q["questionId"])) {
                taskQuestions.push(q);
              }
            }
          }
        }
      } else {
        // Random selection for non-authenticated users
        const shuffled = this.shuffleArray(availableQuestions);
        taskQuestions = shuffled.slice(0, Math.min(targetCount, shuffled.length));
      }

      console.log(`  Selected ${taskQuestions.length} questions from ${taskCategory}`);
      selectedQuestions.push(...taskQuestions);
    }

    console.log(`\nTotal questions selected: ${selectedQuestions.length}`);

    // Shuffle the final selection so tasks are mixed
    const shuffledFinal = this.shuffleArray(selectedQuestions);

    // Transform and number the questions
    return shuffledFinal.map((q, index) => this.transformQuestion(q, index + 1));
  }

  /**
   * Filter questions to first 50 for Free tier users
   */
  private static filterForFreeTier(questions: any[], userTier?: string): any[] {
    if (userTier === "free") {
      // Sort by questionNumber to get first 50 in sequential order
      const sorted = [...questions].sort((a, b) => a["questionNumber"] - b["questionNumber"]);
      const first50 = sorted.slice(0, 50);
      console.log(`Free tier restriction: Limited to first 50 questions (from ${questions.length} total)`);
      return first50;
    }
    return questions;
  }

  /**
   * Smart question selection algorithm for Premium/Pro users
   *
   * REQUIREMENTS:
   * - Always select exactly 50 questions per exam
   * - Questions are randomly selected from pools (unseen, incorrect, all)
   * - Every question has a chance of being selected
   * - Questions not answered correctly go back into the pool
   * - No repetition until all questions exhausted
   * - Optimized for performance (no bottlenecks)
   *
   * Priority:
   * 1) Unseen questions (never attempted) - randomly select 50
   * 2) Incorrect questions (when bank exhausted) - randomly select 50, prioritizing lower accuracy
   * 3) All questions (when all seen) - randomly select 50
   */
  private static async selectSmartQuestions(
    userId: string,
    examId: string,
    numberOfQuestions: number,
    selectedCategories?: string[],
    userTier?: string,
    useAdaptiveDifficulty?: boolean
  ): Promise<Question[]> {
    console.log(
      `Smart selection: ${numberOfQuestions} questions for user ${userId} from exam ${examId} (tier: ${userTier || 'unknown'})`
    );

    // For Premium/Pro users, always use QUESTIONBANK for better performance
    const isPremiumOrPro = userTier === 'premium' || userTier === 'pro';

    // Get all available questions
    let allQuestions: any[];

    if (isPremiumOrPro) {
      // Premium/Pro: Get from QUESTIONBANK (all 747 questions)
      console.log('Premium/Pro user: Loading questions from QUESTIONBANK');
      allQuestions = await DatabaseHelpers.getQuestionBankQuestions();
    } else {
      // Free tier: Get from exam (first 50 questions)
      console.log('Free tier user: Loading questions from exam');
      allQuestions = await DatabaseHelpers.getExamQuestions(examId);
      allQuestions = this.filterForFreeTier(allQuestions, userTier);
    }

    console.log(`Loaded ${allQuestions.length} total questions`);

    // Filter by categories if specified
    let filteredQuestions = allQuestions;
    if (selectedCategories && selectedCategories.length > 0) {
      filteredQuestions = allQuestions.filter((q) => {
        // Check taskCategory first (T1-T8), then fall back to categories array
        if (q.taskCategory && selectedCategories.includes(q.taskCategory)) {
          return true;
        }
        const questionCategories = Array.isArray(q.categories)
          ? q.categories
          : (q.category ? [q.category] : []);
        return selectedCategories.some(cat => questionCategories.includes(cat));
      });
      console.log(`Filtered to ${filteredQuestions.length} questions by categories: ${selectedCategories.join(', ')}`);
    }

    if (filteredQuestions.length === 0) {
      throw new Error("No questions found matching the criteria");
    }

    // Get user's question progress
    const userProgress = await DatabaseHelpers.getUserQuestionProgress(userId);

    // Create a map of questionId -> progress for quick lookup (O(1) lookups)
    const progressMap = new Map();
    userProgress.forEach((p: any) => {
      progressMap.set(p.questionId, p);
    });

    // Categorize questions into three pools
    const unseenQuestions: any[] = [];
    const incorrectQuestions: any[] = [];
    const correctQuestions: any[] = [];

    filteredQuestions.forEach((question) => {
      const progress = progressMap.get(question["questionId"]);

      if (!progress) {
        // Never attempted - UNSEEN POOL
        unseenQuestions.push(question);
      } else if (progress["incorrectAttempts"] > 0 || progress["accuracy"] < 100) {
        // Has incorrect attempts or not 100% accuracy - INCORRECT POOL
        incorrectQuestions.push({
          question,
          accuracy: progress["accuracy"],
          incorrectAttempts: progress["incorrectAttempts"],
          lastAttemptedAt: progress["lastAttemptedAt"],
        });
      } else {
        // Always answered correctly - CORRECT POOL
        correctQuestions.push(question);
      }
    });

    console.log(`Question pool breakdown:
      - Unseen (never attempted): ${unseenQuestions.length}
      - Incorrect (needs practice): ${incorrectQuestions.length}
      - Correct (mastered): ${correctQuestions.length}
      - Total available: ${filteredQuestions.length}
    `);

    // Determine selection strategy based on pool sizes
    const bankExhausted = unseenQuestions.length === 0;
    const selectedQuestions: any[] = [];

    if (!bankExhausted) {
      // STRATEGY 1: Unseen questions available
      // Randomly select from unseen pool only (no repetition until exhausted)
      console.log(`Strategy: Selecting from ${unseenQuestions.length} unseen questions (bank not exhausted)`);

      const shuffledUnseen = this.shuffleArray(unseenQuestions);
      const numToSelect = Math.min(numberOfQuestions, unseenQuestions.length);

      selectedQuestions.push(...shuffledUnseen.slice(0, numToSelect));

      if (selectedQuestions.length < numberOfQuestions) {
        console.log(
          `Only ${selectedQuestions.length} unseen questions available (requested ${numberOfQuestions}). ` +
          `Returning available unseen to avoid repetition.`
        );
      }
    } else {
      // STRATEGY 2: All questions seen at least once
      // Build weighted pool: incorrect questions + correct questions
      console.log("Strategy: Bank exhausted - building weighted pool from incorrect and correct questions");

      // Get global analytics for adaptive difficulty (if enabled)
      let globalAnalyticsMap = new Map<string, any>();
      if (useAdaptiveDifficulty) {
        console.log("Adaptive difficulty enabled - fetching global analytics");
        const strugglingQuestions = await Analytics.getStrugglingQuestions(200);
        strugglingQuestions.forEach(qa => {
          globalAnalyticsMap.set(qa.questionId, qa);
        });
        console.log(`Loaded ${globalAnalyticsMap.size} globally struggling questions`);
      }

      // Create a pool where incorrect questions appear more frequently based on accuracy
      const weightedPool: any[] = [];

      // Add incorrect questions with weights (lower accuracy = higher weight)
      incorrectQuestions.forEach((item) => {
        const question = item.question;

        // Base weight from user's personal accuracy
        let baseWeight = Math.max(1, Math.ceil((100 - item.accuracy) / 20));

        // Adaptive difficulty: boost weight if question is globally difficult
        if (useAdaptiveDifficulty) {
          const globalData = globalAnalyticsMap.get(question.questionId);
          if (globalData && globalData.difficultyRating === "very_hard") {
            baseWeight = Math.ceil(baseWeight * 1.5); // 50% boost for very hard questions
            console.log(`Boosted weight for globally difficult question ${question.questionId}: ${baseWeight}x`);
          } else if (globalData && globalData.difficultyRating === "hard") {
            baseWeight = Math.ceil(baseWeight * 1.25); // 25% boost for hard questions
          }
        }

        // Add question multiple times based on weight
        for (let i = 0; i < baseWeight; i++) {
          weightedPool.push(question);
        }
      });

      // Add correct questions once each (lowest weight)
      correctQuestions.forEach((question) => {
        weightedPool.push(question);
      });

      console.log(
        `Weighted pool created: ${weightedPool.length} entries ` +
        `(${incorrectQuestions.length} incorrect, ${correctQuestions.length} correct)`
      );

      // Randomly select from weighted pool
      const shuffledWeighted = this.shuffleArray(weightedPool);

      // Use Set to ensure unique questions (weighted pool has duplicates)
      const uniqueQuestions = new Set<string>();

      for (const question of shuffledWeighted) {
        if (selectedQuestions.length >= numberOfQuestions) break;

        const qid = question["questionId"];
        if (!uniqueQuestions.has(qid)) {
          uniqueQuestions.add(qid);
          selectedQuestions.push(question);
        }
      }

      // If still need more (edge case), add remaining from all questions
      if (selectedQuestions.length < numberOfQuestions) {
        const remainingNeeded = numberOfQuestions - selectedQuestions.length;
        const shuffledAll = this.shuffleArray(filteredQuestions);

        for (const question of shuffledAll) {
          if (selectedQuestions.length >= numberOfQuestions) break;

          const qid = question["questionId"];
          if (!uniqueQuestions.has(qid)) {
            uniqueQuestions.add(qid);
            selectedQuestions.push(question);
          }
        }
      }
    }

    console.log(`Selection complete: ${selectedQuestions.length} questions selected`);

    // Final shuffle to ensure random order every time
    const shuffledFinal = this.shuffleArray(selectedQuestions);

    return shuffledFinal.map((q, index) => this.transformQuestion(q, index + 1));
  }

  /**
   * Select random questions from the question bank
   */
  private static async selectRandomQuestions(
    examId: string,
    numberOfQuestions: number,
    selectedCategories?: string[],
    userTier?: string
  ): Promise<Question[]> {
    console.log(
      `Selecting ${numberOfQuestions} random questions from exam ${examId} (tier: ${userTier || 'unknown'})`
    );

    // Get all questions for the exam
    let allQuestions = await DatabaseHelpers.getExamQuestions(examId);

    // Apply Free tier restriction (first 50 questions only)
    allQuestions = this.filterForFreeTier(allQuestions, userTier);

    // Filter by categories if specified
    let filteredQuestions = allQuestions;

    if (selectedCategories && selectedCategories.length > 0) {
      filteredQuestions = allQuestions.filter((q) => {
        // Check taskCategory first (T1-T8), then fall back to categories array
        if (q["taskCategory"] && selectedCategories.includes(q["taskCategory"])) {
          return true;
        }
        const questionCategories = Array.isArray(q["categories"])
          ? q["categories"]
          : (q["category"] ? [q["category"]] : []);
        return selectedCategories.some(cat => questionCategories.includes(cat));
      });
      console.log(`Random selection: Filtered to ${filteredQuestions.length} questions by categories: ${selectedCategories.join(', ')}`);
    }

    if (filteredQuestions.length === 0) {
      throw new Error("No questions found matching the criteria");
    }

    // Shuffle and select requested number of questions
    const shuffled = this.shuffleArray([...filteredQuestions]);
    const selected = shuffled.slice(0, Math.min(numberOfQuestions, shuffled.length));

    return selected.map((q, index) => this.transformQuestion(q, index + 1));
  }

  /**
   * Select questions based on user's weakest areas
   * Prioritizes unseen questions in weak areas first, then seen weak questions
   */
  private static async selectWeakQuestions(
    userId: string,
    numberOfQuestions: number,
    selectedCategories?: string[],
    userTier?: string
  ): Promise<Question[]> {
    console.log(
      `Selecting ${numberOfQuestions} weak questions for user ${userId} (focusing on areas of weakness)`
    );

    // Get user's question progress to identify weak areas
    const userProgress = await DatabaseHelpers.getUserQuestionProgress(userId);

    if (userProgress.length === 0) {
      // No progress data yet, fall back to random selection
      console.log(
        "No question progress found, falling back to random selection"
      );
      // Get examId from first attempt or use a default
      const attempts = await DatabaseHelpers.getUserAttempts(userId, 1);
      const examId = attempts[0]?.examId || "re5-premium-exam";
      return this.selectRandomQuestions(
        examId,
        numberOfQuestions,
        selectedCategories,
        userTier
      );
    }

    // Create a map of questionId -> progress for quick lookup
    const progressMap = new Map();
    userProgress.forEach((p: any) => {
      progressMap.set(p.questionId, p);
    });

    // Identify weak categories based on user performance
    const categoryPerformance = new Map<string, { correct: number; total: number; accuracy: number }>();

    userProgress.forEach((p: any) => {
      const categories = Array.isArray(p.categories) ? p.categories : [p.category || "General"];
      categories.forEach((cat: string) => {
        if (!categoryPerformance.has(cat)) {
          categoryPerformance.set(cat, { correct: 0, total: 0, accuracy: 0 });
        }
        const perf = categoryPerformance.get(cat)!;
        perf.total += p.totalAttempts || 1;
        perf.correct += p.correctAttempts || 0;
        perf.accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
      });
    });

    // Identify weakest categories (accuracy < 70%)
    const weakCategories = Array.from(categoryPerformance.entries())
      .filter(([_, perf]) => perf.accuracy < 70)
      .sort((a, b) => a[1].accuracy - b[1].accuracy)
      .map(([cat, _]) => cat);

    // If user selected specific categories, use those; otherwise use weak categories
    const targetCategories = selectedCategories && selectedCategories.length > 0
      ? selectedCategories
      : weakCategories.length > 0
        ? weakCategories.slice(0, 5) // Top 5 weakest categories
        : undefined;

    console.log(`Focusing on categories: ${targetCategories?.join(", ") || "all categories"}`);

    // Get all questions from the exam
    const examId = userProgress[0]?.examId || "re5-premium-exam";
    let allQuestions = await DatabaseHelpers.getExamQuestions(examId);

    // Apply Free tier restriction if needed
    allQuestions = this.filterForFreeTier(allQuestions, userTier);

    // Filter questions by target categories
    const relevantQuestions = targetCategories
      ? allQuestions.filter((q) => {
          // Check taskCategory first (T1-T8), then fall back to categories array
          if (q.taskCategory && targetCategories.includes(q.taskCategory)) {
            return true;
          }
          const questionCategories = Array.isArray(q.categories)
            ? q.categories
            : (q.category ? [q.category] : []);
          return targetCategories.some(cat => questionCategories.includes(cat));
        })
      : allQuestions;

    // Categorize questions: unseen in weak areas, seen weak, seen correct in weak areas
    const unseenWeakQuestions: any[] = [];
    const seenWeakQuestions: any[] = [];
    const seenCorrectWeakQuestions: any[] = [];

    relevantQuestions.forEach((question) => {
      const progress = progressMap.get(question["questionId"]);

      if (!progress) {
        // Unseen question in weak area - TOP PRIORITY
        unseenWeakQuestions.push(question);
      } else if (progress["incorrectAttempts"] > 0 || progress["accuracy"] < 100) {
        // Seen but weak - good for reinforcement
        seenWeakQuestions.push({
          question,
          accuracy: progress["accuracy"],
        });
      } else {
        // Seen and correct in weak area - lowest priority
        seenCorrectWeakQuestions.push(question);
      }
    });

    // Sort seen weak questions by accuracy (lowest first)
    seenWeakQuestions.sort((a, b) => a["accuracy"] - b["accuracy"]);

    console.log(`Weak area question pool:
      - Unseen in weak areas: ${unseenWeakQuestions.length}
      - Seen weak: ${seenWeakQuestions.length}
      - Seen correct in weak areas: ${seenCorrectWeakQuestions.length}
    `);

    // Build selection with priority: unseen weak, then seen weak, then seen correct
    const selectedQuestions: any[] = [];

    // Priority 1: Unseen questions in weak areas (new content in areas needing improvement)
    const shuffledUnseen = this.shuffleArray(unseenWeakQuestions);
    for (const question of shuffledUnseen) {
      if (selectedQuestions.length >= numberOfQuestions) break;
      selectedQuestions.push(question);
    }

    // Priority 2: Seen weak questions (reinforcement of difficult material)
    if (selectedQuestions.length < numberOfQuestions) {
      for (const item of seenWeakQuestions) {
        if (selectedQuestions.length >= numberOfQuestions) break;
        selectedQuestions.push(item.question);
      }
    }

    // Priority 3: Seen correct questions in weak areas (full coverage)
    if (selectedQuestions.length < numberOfQuestions) {
      const shuffledCorrect = this.shuffleArray(seenCorrectWeakQuestions);
      for (const question of shuffledCorrect) {
        if (selectedQuestions.length >= numberOfQuestions) break;
        selectedQuestions.push(question);
      }
    }

    console.log(`Weak area selection complete: ${selectedQuestions.length} questions selected`);

    // Shuffle final selection for variety
    const shuffledFinal = this.shuffleArray(selectedQuestions);

    return shuffledFinal.map((q, index) => this.transformQuestion(q, index + 1));
  }

  /**
   * Select bookmarked questions
   */
  private static async selectBookmarkedQuestions(
    userId: string,
    numberOfQuestions: number,
    selectedCategories?: string[],
    userTier?: string
  ): Promise<Question[]> {
    console.log(
      `Selecting ${numberOfQuestions} bookmarked questions for user ${userId}`
    );

    let bookmarks;

    if (selectedCategories && selectedCategories.length > 0) {
      // Get bookmarks for specific categories
      const allBookmarks = [];
      for (const category of selectedCategories) {
        const categoryBookmarks = await DatabaseHelpers.getBookmarksByCategory(
          userId,
          category
        );
        allBookmarks.push(...categoryBookmarks);
      }
      bookmarks = allBookmarks;
    } else {
      // Get all bookmarks
      bookmarks = await DatabaseHelpers.getUserBookmarks(userId);
    }

    if (bookmarks.length === 0) {
      throw new Error("No bookmarked questions found");
    }

    // Limit to requested number
    const selectedBookmarks = bookmarks.slice(0, numberOfQuestions);

    // Get full question details
    const questions: Question[] = [];

    for (const bookmark of selectedBookmarks) {
      const allQuestions = await DatabaseHelpers.getExamQuestions(
        bookmark.examId
      );
      const question = allQuestions.find(
        (q) => q.questionId === bookmark.questionId
      );

      if (question) {
        questions.push(this.transformQuestion(question, questions.length + 1));
      }
    }

    return questions;
  }

  /**
   * Transform database question to Question type
   */
  private static transformQuestion(dbQuestion: any, questionNumber: number): Question {
    const categories = Array.isArray(dbQuestion.categories)
      ? dbQuestion.categories
      : (dbQuestion.category ? [dbQuestion.category] : ["General"]);

    return {
      questionId: dbQuestion.questionId,
      questionNumber,
      questionText: dbQuestion.questionText,
      questionType: dbQuestion.questionType,
      options: dbQuestion.options || [],
      explanation: dbQuestion.explanation,
      points: dbQuestion.points || 1,
      timeLimit: dbQuestion.timeLimit,
      categories,
      difficulty: dbQuestion.difficulty,
      examId: dbQuestion.PK.replace("EXAM#", ""),
    };
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  }

  /**
   * Get static exam configuration for free users
   */
  static async getStaticExam(): Promise<{
    questions: Question[];
    config: any;
  }> {
    const config = await DatabaseHelpers.getStaticExamConfig();

    if (!config) {
      throw new Error("Static exam not configured");
    }

    // Get the specified questions
    const allQuestions = await DatabaseHelpers.getExamQuestions(config.examId);

    // Filter to only the configured question IDs
    const selectedQuestions = allQuestions.filter((q) =>
      config.questionIds.includes(q.questionId)
    );

    // Sort by the order in questionIds array
    selectedQuestions.sort((a, b) => {
      return (
        config.questionIds.indexOf(a.questionId) -
        config.questionIds.indexOf(b.questionId)
      );
    });

    return {
      questions: selectedQuestions.map((q, i) =>
        this.transformQuestion(q, i + 1)
      ),
      config,
    };
  }
}