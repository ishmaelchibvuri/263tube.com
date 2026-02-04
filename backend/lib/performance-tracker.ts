/**
 * Performance Tracking Service
 *
 * Handles creation and updates of:
 * - TaskPerformance entities (USER# + PERFORMANCE#TASK#T1)
 * - QCPerformance entities (USER# + PERFORMANCE#QC#T1.1.1)
 *
 * Called after exam submission to track user progress
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  TaskCategory,
  TaskPerformance,
  QCPerformance,
  calculateWeaknessScore,
} from "./enhanced-types";

const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

export class PerformanceTracker {
  /**
   * Update task-level performance for a user
   *
   * @param userId - User ID
   * @param taskCategory - Task category (T1-T8)
   * @param questionResults - Array of {isCorrect, timeTaken, cognitiveLevel}
   */
  static async updateTaskPerformance(
    userId: string,
    taskCategory: TaskCategory,
    questionResults: Array<{
      isCorrect: boolean;
      timeTaken: number;
      cognitiveLevel?: string;
    }>
  ): Promise<void> {
    const pk = `USER#${userId}`;
    const sk = `PERFORMANCE#TASK#${taskCategory}`;

    // Get existing performance
    const existing = await this.getTaskPerformance(userId, taskCategory);

    // Calculate new stats
    const newAttempts = questionResults.length;
    const newCorrect = questionResults.filter((q) => q.isCorrect).length;
    const newTotalTime = questionResults.reduce((sum, q) => sum + q.timeTaken, 0);

    const totalAttempts = (existing?.totalAttempts || 0) + newAttempts;
    const correctAttempts = (existing?.correctAttempts || 0) + newCorrect;
    const accuracyRate = (correctAttempts / totalAttempts) * 100;

    const totalTime = (existing?.avgTimeSeconds || 0) * (existing?.totalAttempts || 0) + newTotalTime;
    const avgTimeSeconds = totalTime / totalAttempts;

    // Calculate breakdown by cognitive level
    const cognitiveBreakdown: Record<string, { attempts: number; correct: number }> = {};

    questionResults.forEach((q) => {
      const level = q.cognitiveLevel || "Unknown";
      if (!cognitiveBreakdown[level]) {
        cognitiveBreakdown[level] = { attempts: 0, correct: 0 };
      }
      cognitiveBreakdown[level].attempts++;
      if (q.isCorrect) {
        cognitiveBreakdown[level].correct++;
      }
    });

    // Calculate accuracy by cognitive level
    const knowledgeLevelAccuracy = cognitiveBreakdown["Knowledge (Level 1)"]
      ? (cognitiveBreakdown["Knowledge (Level 1)"].correct / cognitiveBreakdown["Knowledge (Level 1)"].attempts) * 100
      : existing?.knowledgeLevelAccuracy;

    const comprehensionLevelAccuracy = cognitiveBreakdown["Comprehension (Level 2)"]
      ? (cognitiveBreakdown["Comprehension (Level 2)"].correct / cognitiveBreakdown["Comprehension (Level 2)"].attempts) * 100
      : existing?.comprehensionLevelAccuracy;

    const applicationLevelAccuracy = cognitiveBreakdown["Application (Level 3)"]
      ? (cognitiveBreakdown["Application (Level 3)"].correct / cognitiveBreakdown["Application (Level 3)"].attempts) * 100
      : existing?.applicationLevelAccuracy;

    const analysisLevelAccuracy = cognitiveBreakdown["Analysis (Level 4)"]
      ? (cognitiveBreakdown["Analysis (Level 4)"].correct / cognitiveBreakdown["Analysis (Level 4)"].attempts) * 100
      : existing?.analysisLevelAccuracy;

    // Calculate weakness score
    const daysSinceLastAttempt = existing?.lastAttemptDate
      ? Math.floor((Date.now() - new Date(existing.lastAttemptDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const weaknessScore = calculateWeaknessScore(accuracyRate, daysSinceLastAttempt, totalAttempts);

    // Calculate target practice count based on accuracy
    const targetPracticeCount = accuracyRate < 66 ? 20 : accuracyRate < 75 ? 10 : accuracyRate < 85 ? 5 : 0;

    const now = new Date().toISOString();

    const taskPerformance: TaskPerformance = {
      PK: pk,
      SK: sk,
      GSI1PK: `PERFORMANCE#USER#${userId}`,
      GSI1SK: `WEAKNESS#${String(Math.round(weaknessScore)).padStart(5, "0")}`,

      userId,
      taskCategory,
      totalAttempts,
      correctAttempts,
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      avgTimeSeconds: Math.round(avgTimeSeconds * 100) / 100,
      lastAttemptDate: now,

      knowledgeLevelAccuracy: knowledgeLevelAccuracy ? Math.round(knowledgeLevelAccuracy * 100) / 100 : undefined,
      comprehensionLevelAccuracy: comprehensionLevelAccuracy ? Math.round(comprehensionLevelAccuracy * 100) / 100 : undefined,
      applicationLevelAccuracy: applicationLevelAccuracy ? Math.round(applicationLevelAccuracy * 100) / 100 : undefined,
      analysisLevelAccuracy: analysisLevelAccuracy ? Math.round(analysisLevelAccuracy * 100) / 100 : undefined,

      weaknessScore: Math.round(weaknessScore * 100) / 100,
      targetPracticeCount,

      updatedAt: now,
      entityType: "TASK_PERFORMANCE",
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: taskPerformance,
      })
    );

    console.log(`Updated task performance for ${userId} on ${taskCategory}: ${accuracyRate.toFixed(1)}% accuracy`);
  }

  /**
   * Get task performance for a user
   */
  static async getTaskPerformance(
    userId: string,
    taskCategory?: TaskCategory
  ): Promise<TaskPerformance | null> {
    if (!taskCategory) {
      return null;
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `PERFORMANCE#TASK#${taskCategory}`,
        },
      })
    );

    return result.Item as TaskPerformance | null;
  }

  /**
   * Get all task performance for a user
   */
  static async getAllTaskPerformance(userId: string): Promise<TaskPerformance[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "PERFORMANCE#TASK#",
        },
      })
    );

    return (result.Items || []) as TaskPerformance[];
  }

  /**
   * Get weakest tasks for a user (sorted by weakness score)
   */
  static async getWeakestTasks(userId: string, limit: number = 3): Promise<TaskPerformance[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `PERFORMANCE#USER#${userId}`,
        },
        ScanIndexForward: false, // Descending order (highest weakness score first)
        Limit: limit,
      })
    );

    return (result.Items || []) as TaskPerformance[];
  }

  /**
   * Update QC-level performance for a user
   *
   * @param userId - User ID
   * @param qcId - Qualifying criteria ID (e.g., T1.1.1)
   * @param taskCategory - Task category (T1-T8)
   * @param questionResults - Array of {isCorrect, timeTaken}
   */
  static async updateQCPerformance(
    userId: string,
    qcId: string,
    taskCategory: TaskCategory,
    questionResults: Array<{
      isCorrect: boolean;
      timeTaken: number;
    }>
  ): Promise<void> {
    const pk = `USER#${userId}`;
    const sk = `PERFORMANCE#QC#${qcId}`;

    // Get existing performance
    const existing = await this.getQCPerformance(userId, qcId);

    // Calculate new stats
    const newAttempts = questionResults.length;
    const newCorrect = questionResults.filter((q) => q.isCorrect).length;
    const newTotalTime = questionResults.reduce((sum, q) => sum + q.timeTaken, 0);

    const totalAttempts = (existing?.totalAttempts || 0) + newAttempts;
    const correctAttempts = (existing?.correctAttempts || 0) + newCorrect;
    const accuracyRate = (correctAttempts / totalAttempts) * 100;

    const totalTime = (existing?.avgTimeSeconds || 0) * (existing?.totalAttempts || 0) + newTotalTime;
    const avgTimeSeconds = totalTime / totalAttempts;

    // Calculate weakness score
    const daysSinceLastAttempt = existing?.lastAttemptDate
      ? Math.floor((Date.now() - new Date(existing.lastAttemptDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const weaknessScore = calculateWeaknessScore(accuracyRate, daysSinceLastAttempt, totalAttempts);

    const now = new Date().toISOString();

    const qcPerformance: QCPerformance = {
      PK: pk,
      SK: sk,

      userId,
      taskCategory,
      qcId,
      totalAttempts,
      correctAttempts,
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      avgTimeSeconds: Math.round(avgTimeSeconds * 100) / 100,
      lastAttemptDate: now,
      weaknessScore: Math.round(weaknessScore * 100) / 100,

      updatedAt: now,
      entityType: "QC_PERFORMANCE",
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: qcPerformance,
      })
    );

    console.log(`Updated QC performance for ${userId} on ${qcId}: ${accuracyRate.toFixed(1)}% accuracy`);
  }

  /**
   * Get QC performance for a user
   */
  static async getQCPerformance(userId: string, qcId?: string): Promise<QCPerformance | null> {
    if (!qcId) {
      return null;
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `PERFORMANCE#QC#${qcId}`,
        },
      })
    );

    return result.Item as QCPerformance | null;
  }

  /**
   * Get all QC performance for a user
   */
  static async getAllQCPerformance(userId: string): Promise<QCPerformance[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "PERFORMANCE#QC#",
        },
      })
    );

    return (result.Items || []) as QCPerformance[];
  }

  /**
   * Get QC heatmap data (all QCs with performance status)
   */
  static async getQCHeatmap(userId: string): Promise<{
    qcPerformance: Array<{
      qcId: string;
      taskCategory: string;
      accuracyRate: number;
      attempts: number;
      status: "critical" | "needs_work" | "good" | "mastery";
    }>;
    summary: {
      criticalCount: number;
      needsWorkCount: number;
      goodCount: number;
      masteryCount: number;
    };
  }> {
    const allQCPerformance = await this.getAllQCPerformance(userId);

    const qcPerformance = allQCPerformance.map((qc) => {
      let status: "critical" | "needs_work" | "good" | "mastery";
      if (qc.accuracyRate < 66) {
        status = "critical";
      } else if (qc.accuracyRate < 75) {
        status = "needs_work";
      } else if (qc.accuracyRate < 85) {
        status = "good";
      } else {
        status = "mastery";
      }

      return {
        qcId: qc.qcId,
        taskCategory: qc.taskCategory,
        accuracyRate: qc.accuracyRate,
        attempts: qc.totalAttempts,
        status,
      };
    });

    const summary = {
      criticalCount: qcPerformance.filter((q) => q.status === "critical").length,
      needsWorkCount: qcPerformance.filter((q) => q.status === "needs_work").length,
      goodCount: qcPerformance.filter((q) => q.status === "good").length,
      masteryCount: qcPerformance.filter((q) => q.status === "mastery").length,
    };

    return {
      qcPerformance,
      summary,
    };
  }
}
