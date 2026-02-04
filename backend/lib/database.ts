import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
  DeleteCommand,
  BatchGetCommand,
  BatchWriteCommand,
  marshallOptions,
  unmarshallOptions,
} from "@aws-sdk/lib-dynamodb";
import { HybridCache } from "./distributed-cache";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    // Convert empty strings, null, and undefined to null
    convertEmptyValues: false,
    // Remove undefined values
    removeUndefinedValues: true,
    // Convert class instances to plain objects
    convertClassInstanceToMap: false,
  },
});

export const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data";

export interface DynamoDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  GSI3PK?: string;
  GSI3SK?: string;
  TTL?: number;
  [key: string]: any;
}

export class DatabaseService {
  static async getItem(pk: string, sk: string): Promise<DynamoDBItem | null> {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
      });

      const result = await docClient.send(command);
      return (result.Item as DynamoDBItem) || null;
    } catch (error) {
      console.error("Error getting item:", error);
      throw error;
    }
  }

  static async putItem(item: DynamoDBItem): Promise<void> {
    try {
      console.log("DatabaseService.putItem called with:", {
        tableName: TABLE_NAME,
        pk: item.PK,
        sk: item.SK,
        entityType: item.entityType,
      });

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      });

      console.log("Sending PutCommand to DynamoDB...");
      const result = await docClient.send(command);
      console.log("PutCommand successful:", result);
    } catch (error) {
      console.error("Error putting item:", error);
      throw error;
    }
  }

  static async updateItem(
    pk: string,
    sk: string,
    updateExpression: string,
    expressionAttributeValues: Record<string, any>,
    expressionAttributeNames?: Record<string, string>
  ): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
      });

      await docClient.send(command);
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  static async queryItems(
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    indexName?: string,
    limit?: number,
    scanIndexForward: boolean = true
  ): Promise<DynamoDBItem[]> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: limit,
        ScanIndexForward: scanIndexForward,
      });

      const result = await docClient.send(command);
      return (result.Items as DynamoDBItem[]) || [];
    } catch (error) {
      console.error("Error querying items:", error);
      throw error;
    }
  }

  static async scanItems(
    filterExpression?: string,
    expressionAttributeValues?: Record<string, any>,
    limit?: number
  ): Promise<DynamoDBItem[]> {
    try {
      console.log("DatabaseService.scanItems called:", {
        tableName: TABLE_NAME,
        filterExpression,
        expressionAttributeValues,
        limit,
      });

      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: limit,
      });

      const result = await docClient.send(command);
      console.log("Scan result:", {
        count: result.Count,
        scannedCount: result.ScannedCount,
        itemCount: result.Items?.length || 0,
      });

      return (result.Items as DynamoDBItem[]) || [];
    } catch (error) {
      console.error("Error scanning items:", error);
      throw error;
    }
  }

  static async deleteItem(pk: string, sk: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
      });

      await docClient.send(command);
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static async batchDeleteItems(items: DynamoDBItem[]): Promise<void> {
    if (items.length === 0) return;

    // DynamoDB BatchWrite can handle 25 items at a time
    const chunks = this.chunkArray(items, 25);

    for (const chunk of chunks) {
      const deleteRequests = chunk.map((item) => ({
        DeleteRequest: {
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        },
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: deleteRequests,
        },
      });

      await docClient.send(command);
    }
  }
}

// Helper functions for common access patterns
export const DatabaseHelpers = {
  // User operations
  async getUserProfile(userId: string): Promise<DynamoDBItem | null> {
    console.log(`Getting user profile for: ${userId}`);
    return DatabaseService.getItem(`USER#${userId}`, "PROFILE");
  },

  async getUserByEmail(email: string): Promise<DynamoDBItem | null> {
    console.log(`Getting user by email: ${email}`);
    const results = await DatabaseService.queryItems(
      "GSI1PK = :pk AND GSI1SK = :sk",
      {
        ":pk": "USER",
        ":sk": email,
      },
      "GSI1",
      1
    );
    return results.length > 0 ? results[0]! : null;
  },

  async createUserProfile(userData: any): Promise<void> {
    const item: DynamoDBItem = {
      PK: `USER#${userData.userId}`,
      SK: "PROFILE",
      GSI1PK: "USER",
      GSI1SK: userData.email,
      ...userData,
      createdAt: new Date().toISOString(),
    };
    await DatabaseService.putItem(item);
  },

  async updateUserProfile(userId: string, updateData: any): Promise<void> {
    const updateExpression =
      "SET " +
      Object.keys(updateData)
        .map((key) => `#${key} = :${key}`)
        .join(", ");

    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    for (const [key, value] of Object.entries(updateData)) {
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }

    await DatabaseService.updateItem(
      `USER#${userId}`,
      "PROFILE",
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames
    );
  },

  // Referral operations
  async createReferral(referralData: {
    referrerId: string;
    referredEmail: string;
    referralCode: string;
  }): Promise<void> {
    const referralId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const item: DynamoDBItem = {
      PK: `REFERRAL#${referralId}`,
      SK: "METADATA",
      GSI1PK: `REFERRER#${referralData.referrerId}`,
      GSI1SK: timestamp,
      GSI2PK: `CODE#${referralData.referralCode}`,
      GSI2SK: timestamp,
      referralId,
      referrerId: referralData.referrerId,
      referredEmail: referralData.referredEmail,
      referralCode: referralData.referralCode,
      status: "signed_up", // signed_up, converted_to_pro
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await DatabaseService.putItem(item);
  },

  async getReferralsByReferrer(referrerId: string): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "GSI1PK = :pk",
      { ":pk": `REFERRER#${referrerId}` },
      "GSI1",
      undefined,
      false // Most recent first
    );
  },

  async getReferralByCode(referralCode: string): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "GSI2PK = :pk",
      { ":pk": `CODE#${referralCode}` },
      "GSI2"
    );
  },

  async updateReferralStatus(
    referralId: string,
    status: string
  ): Promise<void> {
    await DatabaseService.updateItem(
      `REFERRAL#${referralId}`,
      "METADATA",
      "SET #status = :status, updatedAt = :updatedAt",
      {
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      },
      {
        "#status": "status",
      }
    );
  },

  // Exam operations
  async getExam(examId: string): Promise<DynamoDBItem | null> {
    console.log(`Getting exam: ${examId}`);
    const exam = await DatabaseService.getItem(`EXAM#${examId}`, "METADATA");
    console.log(`Exam result:`, exam ? `Found: ${exam.title}` : "Not found");
    return exam;
  },

  async getExamQuestions(examId: string): Promise<DynamoDBItem[]> {
    console.log(`Getting questions for exam: ${examId}`);
    const questions = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `EXAM#${examId}`,
        ":sk": "QUESTION#",
      }
    );
    console.log(`Found ${questions.length} questions for exam ${examId}`);
    return questions;
  },

  async getQuestionsByIds(questionIds: string[]): Promise<DynamoDBItem[]> {
    console.log(`Getting ${questionIds.length} questions by IDs from QUESTIONBANK`);
    console.log(`Sample questionIds:`, questionIds.slice(0, 5));

    if (questionIds.length === 0) {
      return [];
    }

    const questions: DynamoDBItem[] = [];

    // Batch get questions from QUESTIONBANK
    // DynamoDB BatchGetItem has a limit of 100 items, so we need to batch
    for (let i = 0; i < questionIds.length; i += 100) {
      const batch = questionIds.slice(i, i + 100);
      const keys = batch.map(qid => ({
        PK: "QUESTIONBANK",
        SK: `QUESTION#${qid}`
      }));

      console.log(`Batch ${Math.floor(i / 100) + 1}: Requesting ${batch.length} questions`);
      console.log(`First key in batch:`, keys[0]);

      const command = new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: keys,
          },
        },
      });

      const result = await docClient.send(command);
      const items = result.Responses?.[TABLE_NAME] || [];
      console.log(`Batch ${Math.floor(i / 100) + 1}: Retrieved ${items.length} items`);

      if (items.length > 0) {
        const firstItem = items[0] as any;
        console.log(`First item structure:`, {
          PK: firstItem.PK,
          SK: firstItem.SK,
          questionId: firstItem.questionId,
          questionNumber: firstItem.questionNumber,
          hasOptions: !!firstItem.options
        });
      }

      questions.push(...items as DynamoDBItem[]);
    }

    console.log(`Retrieved ${questions.length} questions from QUESTIONBANK out of ${questionIds.length} requested`);
    if (questions.length !== questionIds.length) {
      console.warn(`Mismatch: requested ${questionIds.length} but got ${questions.length}`);
    }
    return questions;
  },

  async getQuestionBankQuestions(): Promise<DynamoDBItem[]> {
    console.log('Getting all questions from all exam pools (with hybrid caching)');

    // Use hybrid cache (in-memory + DynamoDB) with 10 minute TTL
    // QUESTIONBANK is relatively stable, so longer TTL is acceptable
    return HybridCache.getOrFetch(
      'questionbank:all-questions',
      async () => {
        try {
          // First try the QUESTIONBANK partition
          let questions = await DatabaseService.queryItems(
            "PK = :pk AND begins_with(SK, :sk)",
            {
              ":pk": "QUESTIONBANK",
              ":sk": "QUESTION#",
            }
          );

          // If QUESTIONBANK is empty, fetch from all exam pools
          if (questions.length === 0) {
            console.log('QUESTIONBANK empty, fetching from all exam pools...');
            const allExams = await this.getAllExams();
            console.log(`Found ${allExams.length} active exams`);

            // Collect all questions from all exam pools
            const allQuestions: DynamoDBItem[] = [];
            const seenQuestionIds = new Set<string>();

            for (const exam of allExams) {
              const examId = exam.examId || exam.PK?.replace('EXAM#', '');
              if (examId) {
                const examQuestions = await this.getExamQuestions(examId);
                // Deduplicate questions by questionId
                for (const q of examQuestions) {
                  if (!seenQuestionIds.has(q.questionId)) {
                    seenQuestionIds.add(q.questionId);
                    allQuestions.push(q);
                  }
                }
              }
            }
            questions = allQuestions;
            console.log(`Fetched ${questions.length} unique questions from ${allExams.length} exam pools`);
          } else {
            console.log(`Fetched ${questions.length} questions from QUESTIONBANK (uncached)`);
          }

          return questions;
        } catch (error) {
          console.error('Error getting QUESTIONBANK questions:', error);
          return [];
        }
      },
      600 // 10 minutes TTL in seconds
    );
  },

  async queryAllQuestionsWithLegislativeAnchors(): Promise<DynamoDBItem[]> {
    console.log('Querying all questions with legislative anchors');
    try {
      // Scan the table for all items where legislativeAnchor exists
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'attribute_exists(legislativeAnchor) AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':sk': 'QUESTION#',
        },
      });

      const result = await docClient.send(command);
      const questions = (result.Items as DynamoDBItem[]) || [];
      console.log(`Found ${questions.length} questions with legislative anchors`);
      return questions;
    } catch (error) {
      console.error('Error querying questions with legislative anchors:', error);
      return [];
    }
  },

  async createExam(examData: any): Promise<void> {
    const item: DynamoDBItem = {
      PK: `EXAM#${examData.examId}`,
      SK: "METADATA",
      GSI1PK: "EXAM#ACTIVE",
      GSI1SK: `${examData.category}#${examData.createdAt}`,
      GSI3PK: `EXAM#CATEGORY#${examData.category}`,
      GSI3SK: `${examData.difficulty}#${examData.examId}`,
      ...examData,
    };
    await DatabaseService.putItem(item);
  },

  async updateExam(examId: string, updateData: any): Promise<void> {
    const updateExpression =
      "SET " +
      Object.keys(updateData)
        .map((key) => `#${key} = :${key}`)
        .join(", ");

    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    for (const [key, value] of Object.entries(updateData)) {
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }

    await DatabaseService.updateItem(
      `EXAM#${examId}`,
      "METADATA",
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames
    );
  },

  async deleteExam(examId: string): Promise<void> {
    // Delete exam metadata
    await DatabaseService.deleteItem(`EXAM#${examId}`, "METADATA");

    // Delete all questions for this exam
    const questions = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `EXAM#${examId}`,
        ":sk": "QUESTION#",
      }
    );

    for (const question of questions) {
      await DatabaseService.deleteItem(question.PK, question.SK);
    }
  },

  async getAllExams(): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "GSI1PK = :pk",
      { ":pk": "EXAM#ACTIVE" },
      "GSI1",
      undefined,
      true
    );
  },

  // Attempt operations
  async createExamAttempt(attemptData: any): Promise<void> {
    const timestamp = attemptData.submittedAt || new Date().toISOString();
    const dateKey = attemptData.date || timestamp.split("T")[0];

    const item: DynamoDBItem = {
      PK: `USER#${attemptData.userId}`,
      SK: `ATTEMPT#${timestamp}#${attemptData.examId}`,
      GSI1PK: `EXAM#${attemptData.examId}#LEADERBOARD`,
      GSI1SK: `${String(
        10000 - Math.round(attemptData.percentage * 100)
      ).padStart(8, "0")}#${timestamp}`,
      GSI2PK: `DATE#${dateKey}`,
      GSI2SK: `${String(
        10000 - Math.round(attemptData.percentage * 100)
      ).padStart(8, "0")}#${attemptData.userId}`,
      ...attemptData,
      timestamp,
      entityType: "EXAM_ATTEMPT",
      createdAt: timestamp,
    };

    console.log("Creating exam attempt:", {
      PK: item.PK,
      SK: item.SK,
      attemptId: attemptData.attemptId,
      score: attemptData.score,
    });

    await DatabaseService.putItem(item);

    // Also create a record that can be easily retrieved by attemptId
    const attemptLookupItem: DynamoDBItem = {
      PK: `ATTEMPT#${attemptData.attemptId}`,
      SK: "METADATA",
      ...attemptData,
      timestamp,
      entityType: "EXAM_ATTEMPT",
      createdAt: timestamp,
    };

    console.log("Creating attempt lookup record:", {
      PK: attemptLookupItem.PK,
      SK: attemptLookupItem.SK,
    });

    await DatabaseService.putItem(attemptLookupItem);
  },

  async getUserAttempts(
    userId: string,
    limit?: number
  ): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${userId}`,
        ":sk": "ATTEMPT#",
      },
      undefined,
      limit,
      false
    );
  },

  async getUserExamAttempts(
    userId: string,
    examId: string
  ): Promise<DynamoDBItem[]> {
    const attempts = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${userId}`,
        ":sk": "ATTEMPT#",
      },
      undefined,
      undefined,
      false
    );

    return attempts.filter((attempt) => attempt.examId === examId);
  },

  async getExamAttempt(attemptId: string): Promise<DynamoDBItem | null> {
    console.log(`Getting exam attempt: ${attemptId}`);

    // Use the lookup record for fast retrieval
    const attempt = await DatabaseService.getItem(
      `ATTEMPT#${attemptId}`,
      "METADATA"
    );

    console.log(
      `Attempt ${attemptId}: ${attempt ? "Found" : "Not found"}`
    );
    return attempt;
  },

  async getExamAttempts(examId: string): Promise<DynamoDBItem[]> {
    const attempts = await DatabaseService.scanItems(
      "examId = :examId AND begins_with(SK, :sk)",
      {
        ":examId": examId,
        ":sk": "ATTEMPT#",
      }
    );
    return attempts;
  },

  async getAllAttempts(): Promise<DynamoDBItem[]> {
    return DatabaseService.scanItems("begins_with(SK, :sk)", {
      ":sk": "ATTEMPT#",
    });
  },

  async getAttemptAnswers(attemptId: string): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `ATTEMPT#${attemptId}`,
        ":sk": "ANSWER#",
      },
      undefined,
      undefined,
      true
    );
  },

  // User stats operations
  async getUserStats(userId: string): Promise<DynamoDBItem | null> {
    return DatabaseService.getItem(`USER#${userId}`, "STATS");
  },

  async updateUserStats(userId: string, statsData: any): Promise<void> {
    console.log(`Updating user stats for: ${userId}`, statsData);

    const existingStats = await DatabaseService.getItem(
      `USER#${userId}`,
      "STATS"
    );

    if (existingStats) {
      // Update existing stats
      const updateData = {
        totalAttempts:
          (existingStats.totalAttempts || 0) + (statsData.totalAttempts || 0),
        averageScore: statsData.averageScore || existingStats.averageScore,
        highestScore: Math.max(
          existingStats.highestScore || 0,
          statsData.highestScore || 0
        ),
        totalTimePracticed:
          (existingStats.totalTimePracticed || 0) +
          (statsData.totalTimePracticed || 0),
        currentStreak: statsData.currentStreak !== undefined ? statsData.currentStreak : existingStats.currentStreak || 0,
        longestStreak: statsData.longestStreak !== undefined ? statsData.longestStreak : existingStats.longestStreak || 0,
        lastAttemptDate:
          statsData.lastAttemptDate || existingStats.lastAttemptDate,
        updatedAt: new Date().toISOString(),
      };

      await DatabaseService.updateItem(
        `USER#${userId}`,
        "STATS",
        "SET totalAttempts = :totalAttempts, averageScore = :averageScore, highestScore = :highestScore, totalTimePracticed = :totalTimePracticed, currentStreak = :currentStreak, longestStreak = :longestStreak, lastAttemptDate = :lastAttemptDate, updatedAt = :updatedAt",
        {
          ":totalAttempts": updateData.totalAttempts,
          ":averageScore": updateData.averageScore,
          ":highestScore": updateData.highestScore,
          ":totalTimePracticed": updateData.totalTimePracticed,
          ":currentStreak": updateData.currentStreak,
          ":longestStreak": updateData.longestStreak,
          ":lastAttemptDate": updateData.lastAttemptDate,
          ":updatedAt": updateData.updatedAt,
        }
      );
    } else {
      // Create new stats
      const statsItem: DynamoDBItem = {
        PK: `USER#${userId}`,
        SK: "STATS",
        totalAttempts: statsData.totalAttempts || 0,
        averageScore: statsData.averageScore || 0,
        highestScore: statsData.highestScore || 0,
        totalTimePracticed: statsData.totalTimePracticed || 0,
        currentStreak: statsData.currentStreak || 0,
        longestStreak: statsData.longestStreak || 0,
        lastAttemptDate: statsData.lastAttemptDate || "",
        categoryStats: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityType: "USER_STATS",
      };

      await DatabaseService.putItem(statsItem);
    }
  },

  // Leaderboard operations
  async getDailyLeaderboard(
    date: string,
    limit: number = 20
  ): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "GSI2PK = :pk",
      { ":pk": `DATE#${date}` },
      "GSI2",
      limit,
      true
    );
  },

  async getWeeklyLeaderboard(
    week: string,
    limit: number = 50
  ): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "PK = :pk",
      { ":pk": `LEADERBOARD#WEEKLY#${week}` },
      undefined,
      limit,
      false
    );
  },

  async getMonthlyLeaderboard(
    month: string,
    limit: number = 100
  ): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "PK = :pk",
      { ":pk": `LEADERBOARD#MONTHLY#${month}` },
      undefined,
      limit,
      false
    );
  },

  async getAllTimeLeaderboard(
    examId: string,
    limit: number = 100
  ): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "GSI1PK = :pk",
      { ":pk": `EXAM#${examId}#LEADERBOARD` },
      "GSI1",
      limit,
      true
    );
  },

  async updateLeaderboardEntry(leaderboardData: any): Promise<void> {
    await DatabaseService.putItem(leaderboardData);
  },

  // Session operations
  async createExamSession(sessionData: any): Promise<void> {
    const item: DynamoDBItem = {
      PK: `SESSION#${sessionData.attemptId}`,
      SK: "METADATA",
      ...sessionData,
      TTL: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // 2 hours TTL
    };
    await DatabaseService.putItem(item);
  },

  async getExamSession(attemptId: string): Promise<DynamoDBItem | null> {
    return DatabaseService.getItem(`SESSION#${attemptId}`, "METADATA");
  },

  async updateExamSession(attemptId: string, updateData: any): Promise<void> {
    const updateExpression =
      "SET " +
      Object.keys(updateData)
        .map((key) => `#${key} = :${key}`)
        .join(", ");

    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    for (const [key, value] of Object.entries(updateData)) {
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }

    await DatabaseService.updateItem(
      `SESSION#${attemptId}`,
      "METADATA",
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames
    );
  },

  // Admin operations
  async getAllUsers(): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "GSI1PK = :pk",
      { ":pk": "USER" },
      "GSI1",
      undefined,
      true
    );
  },

  // Generic get item
  async getItem(pk: string, sk: string): Promise<DynamoDBItem | null> {
    return DatabaseService.getItem(pk, sk);
  },

  // Generic put item
  async putItem(item: DynamoDBItem): Promise<void> {
    await DatabaseService.putItem(item);
  },

  // Generic delete item
  async deleteItem(pk: string, sk: string): Promise<void> {
    await DatabaseService.deleteItem(pk, sk);
  },

  // Question Progress operations
  async getQuestionProgress(
    userId: string,
    questionId: string
  ): Promise<DynamoDBItem | null> {
    return DatabaseService.getItem(
      `USER#${userId}`,
      `QPROGRESS#${questionId}`
    );
  },

  async getUserQuestionProgress(userId: string): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${userId}`,
        ":sk": "QPROGRESS#",
      }
    );
  },

  async getWeakQuestions(
    userId: string,
    limit: number = 50
  ): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "GSI1PK = :pk",
      { ":pk": `USER#${userId}#WEAK` },
      "GSI1",
      limit,
      true // Ascending order (lowest accuracy first)
    );
  },

  async getWeakQuestionsByCategory(
    userId: string,
    category: string,
    limit: number = 50
  ): Promise<DynamoDBItem[]> {
    // Get all weak questions, then filter by category in app code
    const allWeak = await DatabaseService.queryItems(
      "GSI1PK = :pk",
      { ":pk": `USER#${userId}#WEAK` },
      "GSI1",
      undefined,
      true
    );

    // Filter questions that have this category
    const filtered = allWeak.filter(
      (q) => Array.isArray(q.categories) && q.categories.includes(category)
    );

    return filtered.slice(0, limit);
  },

  async updateQuestionProgress(
    userId: string,
    questionId: string,
    questionData: any,
    isCorrect: boolean
  ): Promise<void> {
    const categories = Array.isArray(questionData.categories)
      ? questionData.categories
      : (questionData.category ? [questionData.category] : ["General"]);

    // Extract topic and taskCategory for performance analytics
    const topic = questionData.topic || questionData.Topic || questionData.taskCategory || null;
    const taskCategory = questionData.taskCategory || null;

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const existing = await DatabaseHelpers.getQuestionProgress(
          userId,
          questionId
        );

        if (existing) {
          // Update existing progress with optimistic locking
          const totalAttempts = existing.totalAttempts + 1;
          const correctAttempts = existing.correctAttempts + (isCorrect ? 1 : 0);
          const incorrectAttempts = existing.incorrectAttempts + (isCorrect ? 0 : 1);
          const accuracy = (correctAttempts / totalAttempts) * 100;
          const paddedAccuracy = String(Math.round(accuracy * 100)).padStart(6, "0");
          const now = new Date().toISOString();

          // Use conditional update to prevent race conditions
          // Only update if updatedAt hasn't changed since we read it
          const updateCommand = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: `USER#${userId}`,
              SK: `QPROGRESS#${questionId}`,
            },
            UpdateExpression:
              "SET totalAttempts = :totalAttempts, " +
              "correctAttempts = :correctAttempts, " +
              "incorrectAttempts = :incorrectAttempts, " +
              "lastAttemptedAt = :lastAttemptedAt, " +
              "lastWasCorrect = :lastWasCorrect, " +
              "accuracy = :accuracy, " +
              "categories = :categories, " +
              (topic ? "topic = :topic, " : "") +
              (taskCategory ? "taskCategory = :taskCategory, " : "") +
              "updatedAt = :updatedAt, " +
              "GSI1PK = :gsi1pk, " +
              "GSI1SK = :gsi1sk",
            ConditionExpression: "updatedAt = :expectedUpdatedAt OR attribute_not_exists(updatedAt)",
            ExpressionAttributeValues: {
              ":totalAttempts": totalAttempts,
              ":correctAttempts": correctAttempts,
              ":incorrectAttempts": incorrectAttempts,
              ":lastAttemptedAt": now,
              ":lastWasCorrect": isCorrect,
              ":accuracy": accuracy,
              ":categories": categories,
              ...(topic && { ":topic": topic }),
              ...(taskCategory && { ":taskCategory": taskCategory }),
              ":updatedAt": now,
              ":gsi1pk": `USER#${userId}#WEAK`,
              ":gsi1sk": `${paddedAccuracy}#${questionId}`,
              ":expectedUpdatedAt": existing.updatedAt,
            },
          });

          await docClient.send(updateCommand);
          console.log(`Question progress updated successfully for user ${userId}, question ${questionId}`);
          return; // Success - exit
        } else {
          // Create new progress record with conditional check
          const accuracy = isCorrect ? 100 : 0;
          const paddedAccuracy = String(Math.round(accuracy * 100)).padStart(6, "0");
          const now = new Date().toISOString();

          const item: DynamoDBItem = {
            PK: `USER#${userId}`,
            SK: `QPROGRESS#${questionId}`,
            GSI1PK: `USER#${userId}#WEAK`,
            GSI1SK: `${paddedAccuracy}#${questionId}`,
            questionId,
            examId: questionData.examId,
            categories,
            ...(topic && { topic }),
            ...(taskCategory && { taskCategory }),
            totalAttempts: 1,
            correctAttempts: isCorrect ? 1 : 0,
            incorrectAttempts: isCorrect ? 0 : 1,
            lastAttemptedAt: now,
            lastWasCorrect: isCorrect,
            accuracy,
            createdAt: now,
            updatedAt: now,
            entityType: "QUESTION_PROGRESS",
          };

          // Use PutCommand with conditional expression to prevent overwrite
          const putCommand = new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression: "attribute_not_exists(PK)",
          });

          await docClient.send(putCommand);
          console.log(`Question progress created for user ${userId}, question ${questionId}`);
          return; // Success - exit
        }
      } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
          // Race condition detected - retry
          retryCount++;
          console.log(`Optimistic lock failed for question progress (attempt ${retryCount}/${maxRetries}). Retrying...`);

          if (retryCount >= maxRetries) {
            console.error(`Failed to update question progress after ${maxRetries} retries due to concurrent updates`);
            throw new Error("Failed to update question progress due to concurrent modifications");
          }

          // Exponential backoff before retry
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount - 1)));
        } else {
          // Other error - throw immediately
          console.error("Error updating question progress:", error);
          throw error;
        }
      }
    }
  },

  // Bookmark operations
  async getBookmark(
    userId: string,
    questionId: string
  ): Promise<DynamoDBItem | null> {
    return DatabaseService.getItem(`USER#${userId}`, `BOOKMARK#${questionId}`);
  },

  async getUserBookmarks(userId: string): Promise<DynamoDBItem[]> {
    return DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${userId}`,
        ":sk": "BOOKMARK#",
      },
      undefined,
      undefined,
      false // Most recent first
    );
  },

  async getBookmarksByCategory(
    userId: string,
    category: string
  ): Promise<DynamoDBItem[]> {
    // Get all bookmarks, then filter by category in app code
    const allBookmarks = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${userId}`,
        ":sk": "BOOKMARK#",
      },
      undefined,
      undefined,
      false
    );

    // Filter bookmarks that have this category
    return allBookmarks.filter(
      (b) => Array.isArray(b.categories) && b.categories.includes(category)
    );
  },

  async createBookmark(userId: string, bookmarkData: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const categories = Array.isArray(bookmarkData.categories)
      ? bookmarkData.categories
      : (bookmarkData.category ? [bookmarkData.category] : ["General"]);

    const item: DynamoDBItem = {
      PK: `USER#${userId}`,
      SK: `BOOKMARK#${bookmarkData.questionId}`,
      questionId: bookmarkData.questionId,
      examId: bookmarkData.examId,
      questionNumber: bookmarkData.questionNumber,
      questionText: bookmarkData.questionText,
      categories,
      difficulty: bookmarkData.difficulty,
      notes: bookmarkData.notes || "",
      bookmarkedAt: timestamp,
      entityType: "QUESTION_BOOKMARK",
    };

    await DatabaseService.putItem(item);
  },

  async deleteBookmark(userId: string, questionId: string): Promise<void> {
    await DatabaseService.deleteItem(`USER#${userId}`, `BOOKMARK#${questionId}`);
  },

  // Static exam configuration
  async getStaticExamConfig(): Promise<DynamoDBItem | null> {
    return DatabaseService.getItem("CONFIG#STATIC_EXAM", "FREE_TIER");
  },

  async setStaticExamConfig(configData: any): Promise<void> {
    const item: DynamoDBItem = {
      PK: "CONFIG#STATIC_EXAM",
      SK: "FREE_TIER",
      examId: configData.examId,
      questionIds: configData.questionIds,
      totalQuestions: configData.totalQuestions,
      totalTime: configData.totalTime,
      passingScore: configData.passingScore,
      description: configData.description,
      createdAt: configData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: configData.createdBy,
      entityType: "STATIC_EXAM_CONFIG",
    };

    await DatabaseService.putItem(item);
  },

  // Email verification operations
  async storeVerificationCode(
    userId: string,
    email: string,
    code: string,
    expiresAt: string
  ): Promise<void> {
    const item: DynamoDBItem = {
      PK: `USER#${userId}`,
      SK: "VERIFICATION_CODE",
      email,
      code,
      expiresAt,
      verified: false,
      createdAt: new Date().toISOString(),
      entityType: "EMAIL_VERIFICATION",
      // TTL for automatic cleanup (expires + 7 days for records)
      TTL: Math.floor(new Date(expiresAt).getTime() / 1000) + (7 * 24 * 60 * 60),
    };

    await DatabaseService.putItem(item);
  },

  async getVerificationCode(userId: string): Promise<DynamoDBItem | null> {
    return DatabaseService.getItem(`USER#${userId}`, "VERIFICATION_CODE");
  },

  async markEmailAsVerified(userId: string): Promise<void> {
    const timestamp = new Date().toISOString();

    await DatabaseService.updateItem(
      `USER#${userId}`,
      "VERIFICATION_CODE",
      "SET verified = :verified, verifiedAt = :verifiedAt",
      {
        ":verified": true,
        ":verifiedAt": timestamp,
      }
    );
  },

  // ============================================================================
  // EMAIL TEMPLATE OPERATIONS
  // ============================================================================

  /**
   * Get an email template by ID
   */
  async getEmailTemplate(templateId: string): Promise<DynamoDBItem | null> {
    return DatabaseService.getItem("EMAIL_TEMPLATE", `TEMPLATE#${templateId}`);
  },

  /**
   * Get all email templates
   */
  async getAllEmailTemplates(): Promise<DynamoDBItem[]> {
    const result = await DatabaseService.queryItems(
      "PK = :pk",
      { ":pk": "EMAIL_TEMPLATE", ":prefix": "TEMPLATE#" }
    );
    return result;
  },

  /**
   * Create or update an email template
   */
  async saveEmailTemplate(template: {
    templateId: string;
    templateName: string;
    description?: string;
    subject: string;
    htmlBody: string;
    textBody: string;
    variables: string[];
    isActive: boolean;
    lastModifiedBy: string;
  }): Promise<void> {
    const now = new Date().toISOString();

    // Get existing template to preserve createdAt
    const existing = await this.getEmailTemplate(template.templateId);

    const item: DynamoDBItem = {
      PK: "EMAIL_TEMPLATE",
      SK: `TEMPLATE#${template.templateId}`,
      templateId: template.templateId,
      templateName: template.templateName,
      description: template.description || "",
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      variables: template.variables,
      isActive: template.isActive,
      lastModifiedBy: template.lastModifiedBy,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
      entityType: "EMAIL_TEMPLATE",
    };

    await DatabaseService.putItem(item);
  },

  /**
   * Delete an email template
   */
  async deleteEmailTemplate(templateId: string): Promise<void> {
    await DatabaseService.deleteItem("EMAIL_TEMPLATE", `TEMPLATE#${templateId}`);
  },

  /**
   * Get active email template (for sending emails)
   */
  async getActiveEmailTemplate(templateId: string): Promise<DynamoDBItem | null> {
    const template = await this.getEmailTemplate(templateId);
    if (template && template.isActive) {
      return template;
    }
    return null;
  },

  // ============================================================================
  // USER DELETION OPERATIONS
  // ============================================================================

  /**
   * Get all items associated with a user
   * This includes: profile, stats, attempts, progress, bookmarks, sessions, verification codes
   */
  async getAllUserItems(userId: string): Promise<DynamoDBItem[]> {
    console.log(`Getting all items for user: ${userId}`);

    // Get all items with PK = USER#{userId}
    const userItems = await DatabaseService.queryItems(
      "PK = :pk",
      { ":pk": `USER#${userId}` }
    );

    console.log(`Found ${userItems.length} items with PK USER#${userId}`);

    // Also get attempt lookup records (ATTEMPT#{attemptId})
    const attemptItems: DynamoDBItem[] = [];
    for (const item of userItems) {
      if (item.SK.startsWith("ATTEMPT#") && item.attemptId) {
        const attemptLookup = await DatabaseService.getItem(
          `ATTEMPT#${item.attemptId}`,
          "METADATA"
        );
        if (attemptLookup) {
          attemptItems.push(attemptLookup);
        }

        // Also get session records
        const session = await DatabaseService.getItem(
          `SESSION#${item.attemptId}`,
          "METADATA"
        );
        if (session) {
          attemptItems.push(session);
        }

        // Get answer records for this attempt
        const answers = await DatabaseService.queryItems(
          "PK = :pk AND begins_with(SK, :sk)",
          {
            ":pk": `ATTEMPT#${item.attemptId}`,
            ":sk": "ANSWER#",
          }
        );
        attemptItems.push(...answers);
      }
    }

    console.log(`Found ${attemptItems.length} additional attempt/session/answer items`);

    const allItems = [...userItems, ...attemptItems];
    console.log(`Total items to delete: ${allItems.length}`);

    return allItems;
  },

  /**
   * Delete a user and all their associated data
   * This is a destructive operation that cannot be undone
   */
  async deleteUserAndAllData(userId: string): Promise<void> {
    console.log(`Starting deletion process for user: ${userId}`);

    // Get all items to delete
    const items = await this.getAllUserItems(userId);

    if (items.length === 0) {
      console.log(`No items found for user ${userId}`);
      return;
    }

    // Delete all items in batches
    console.log(`Deleting ${items.length} items for user ${userId}`);
    await DatabaseService.batchDeleteItems(items);

    console.log(`Successfully deleted all data for user ${userId}`);
  },
};
