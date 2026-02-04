/**
 * A/B Testing Framework for Question Selection Algorithms
 *
 * AWS Free Tier Compatible:
 * - Uses existing DynamoDB table
 * - Minimal data storage
 * - Hash-based variant assignment (consistent per user)
 *
 * Features:
 * - Multiple experiment support
 * - Deterministic variant assignment based on userId
 * - Performance metrics tracking
 * - Easy activation/deactivation
 */

import { DatabaseService, DynamoDBItem } from "./database";

export type ExperimentVariant = "control" | "variant_a" | "variant_b" | "variant_c";

export interface Experiment {
  experimentId: string;
  name: string;
  description: string;
  isActive: boolean;
  variants: ExperimentVariant[];
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAssignment {
  userId: string;
  experimentId: string;
  variant: ExperimentVariant;
  assignedAt: string;
}

export interface ExperimentMetrics {
  experimentId: string;
  variant: ExperimentVariant;
  totalUsers: number;
  totalExams: number;
  averageScore: number;
  averageTime: number;
  completionRate: number;
  lastUpdated: string;
}

export class ABTesting {
  /**
   * Get or assign user to experiment variant
   * Uses consistent hashing to ensure same user always gets same variant
   */
  static async assignUserToExperiment(
    userId: string,
    experimentId: string
  ): Promise<ExperimentVariant> {
    // Check if user already has assignment
    const existing = await this.getUserAssignment(userId, experimentId);

    if (existing) {
      console.log(`User ${userId} already assigned to ${experimentId}: ${existing.variant}`);
      return existing.variant;
    }

    // Get experiment configuration
    const experiment = await this.getExperiment(experimentId);

    if (!experiment || !experiment.isActive) {
      console.log(`Experiment ${experimentId} not active, using control`);
      return "control";
    }

    // Assign variant using hash-based distribution
    const variant = this.hashToVariant(userId, experimentId, experiment.variants);

    // Save assignment
    await this.saveUserAssignment(userId, experimentId, variant);

    console.log(`User ${userId} newly assigned to ${experimentId}: ${variant}`);
    return variant;
  }

  /**
   * Get user's assignment for an experiment
   */
  static async getUserAssignment(
    userId: string,
    experimentId: string
  ): Promise<UserAssignment | null> {
    try {
      const pk = `USER#${userId}`;
      const sk = `EXPERIMENT#${experimentId}`;

      const item = await DatabaseService.getItem(pk, sk);

      if (!item) {
        return null;
      }

      return {
        userId,
        experimentId,
        variant: item.variant as ExperimentVariant,
        assignedAt: item.assignedAt,
      };
    } catch (error) {
      console.error(`Error getting user assignment:`, error);
      return null;
    }
  }

  /**
   * Save user assignment
   */
  private static async saveUserAssignment(
    userId: string,
    experimentId: string,
    variant: ExperimentVariant
  ): Promise<void> {
    try {
      const item: DynamoDBItem = {
        PK: `USER#${userId}`,
        SK: `EXPERIMENT#${experimentId}`,
        userId,
        experimentId,
        variant,
        assignedAt: new Date().toISOString(),
        entityType: "EXPERIMENT_ASSIGNMENT",
      };

      await DatabaseService.putItem(item);
    } catch (error) {
      console.error(`Error saving user assignment:`, error);
    }
  }

  /**
   * Get experiment configuration
   */
  static async getExperiment(experimentId: string): Promise<Experiment | null> {
    try {
      const pk = `EXPERIMENT#${experimentId}`;
      const sk = "CONFIG";

      const item = await DatabaseService.getItem(pk, sk);

      if (!item) {
        return null;
      }

      return {
        experimentId,
        name: item.name,
        description: item.description,
        isActive: item.isActive,
        variants: item.variants,
        startDate: item.startDate,
        endDate: item.endDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    } catch (error) {
      console.error(`Error getting experiment:`, error);
      return null;
    }
  }

  /**
   * Create or update experiment
   */
  static async saveExperiment(experiment: Experiment): Promise<void> {
    try {
      const item: DynamoDBItem = {
        PK: `EXPERIMENT#${experiment.experimentId}`,
        SK: "CONFIG",
        ...experiment,
        updatedAt: new Date().toISOString(),
        entityType: "EXPERIMENT_CONFIG",
      };

      await DatabaseService.putItem(item);
      console.log(`Experiment ${experiment.experimentId} saved`);
    } catch (error) {
      console.error(`Error saving experiment:`, error);
    }
  }

  /**
   * Hash-based variant assignment (consistent per user)
   * Uses simple hash function to deterministically assign variant
   */
  private static hashToVariant(
    userId: string,
    experimentId: string,
    variants: ExperimentVariant[]
  ): ExperimentVariant {
    // Create deterministic hash from userId + experimentId
    const input = `${userId}:${experimentId}`;
    let hash = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Convert hash to positive number
    const positiveHash = Math.abs(hash);

    // Distribute evenly across variants
    const index = positiveHash % variants.length;
    return variants[index] || "control";
  }

  /**
   * Track experiment result (exam completion)
   */
  static async trackExperimentResult(
    userId: string,
    experimentId: string,
    metrics: {
      score: number;
      timeTaken: number;
      completed: boolean;
    }
  ): Promise<void> {
    try {
      // Get user's variant
      const assignment = await this.getUserAssignment(userId, experimentId);

      if (!assignment) {
        return; // User not in experiment
      }

      const pk = `EXPERIMENT#${experimentId}#${assignment.variant}`;
      const sk = "METRICS";

      // Use atomic counters to aggregate metrics
      const updateExpression =
        "ADD totalUsers :one, totalExams :one, " +
        "totalScore :score, totalTime :time, " +
        (metrics.completed ? "completedExams :one" : "incompletedExams :one") +
        " SET lastUpdated = :now";

      const expressionAttributeValues = {
        ":one": 1,
        ":score": metrics.score,
        ":time": metrics.timeTaken,
        ":now": new Date().toISOString(),
      };

      await DatabaseService.updateItem(
        pk,
        sk,
        updateExpression,
        expressionAttributeValues
      );

      console.log(`Experiment result tracked: ${experimentId} ${assignment.variant}`);
    } catch (error) {
      console.error(`Error tracking experiment result:`, error);
    }
  }

  /**
   * Get experiment metrics for analysis
   */
  static async getExperimentMetrics(
    experimentId: string
  ): Promise<ExperimentMetrics[]> {
    try {
      const items = await DatabaseService.queryItems(
        "begins_with(PK, :prefix) AND SK = :sk",
        {
          ":prefix": `EXPERIMENT#${experimentId}#`,
          ":sk": "METRICS",
        }
      );

      const metrics: ExperimentMetrics[] = [];

      for (const item of items) {
        const variant = item.PK?.toString().split("#")[2] as ExperimentVariant || "control";
        const totalExams = item.totalExams || 0;
        const totalScore = item.totalScore || 0;
        const totalTime = item.totalTime || 0;
        const completedExams = item.completedExams || 0;

        metrics.push({
          experimentId,
          variant,
          totalUsers: item.totalUsers || 0,
          totalExams,
          averageScore: totalExams > 0 ? totalScore / totalExams : 0,
          averageTime: totalExams > 0 ? totalTime / totalExams : 0,
          completionRate: totalExams > 0 ? (completedExams / totalExams) * 100 : 0,
          lastUpdated: item.lastUpdated || new Date().toISOString(),
        });
      }

      return metrics;
    } catch (error) {
      console.error(`Error getting experiment metrics:`, error);
      return [];
    }
  }
}

/**
 * Pre-configured experiments
 */

export const EXPERIMENTS = {
  /**
   * Test weighted vs pure random question selection
   */
  QUESTION_SELECTION: "question-selection-v1",

  /**
   * Test T1-T8 balanced selection vs smart selection
   */
  BALANCED_EXAM: "balanced-exam-v1",

  /**
   * Test different weighting formulas for incorrect questions
   */
  DIFFICULTY_WEIGHTING: "difficulty-weighting-v1",
};

/**
 * Initialize default experiments
 */
export async function initializeExperiments(): Promise<void> {
  // Question Selection Experiment
  await ABTesting.saveExperiment({
    experimentId: EXPERIMENTS.QUESTION_SELECTION,
    name: "Question Selection Algorithm",
    description: "Compare weighted selection vs pure random for incorrect questions",
    isActive: true,
    variants: ["control", "variant_a"], // control=weighted, variant_a=pure_random
    startDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Balanced Exam Experiment
  await ABTesting.saveExperiment({
    experimentId: EXPERIMENTS.BALANCED_EXAM,
    name: "Balanced T1-T8 Exam",
    description: "Test T1-T8 balanced selection vs smart selection",
    isActive: false, // Disabled by default
    variants: ["control", "variant_a"], // control=smart, variant_a=balanced
    startDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log("Default experiments initialized");
}
