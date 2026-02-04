/**
 * Rebuild Time-Based Leaderboards Script
 *
 * This script rebuilds Daily/Weekly/Monthly leaderboards from user attempts
 * with the correct field structure and TTLs, matching what the leaderboard
 * calculator creates.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";
const POINTS_PER_CORRECT_ANSWER = 10;

function padScore(score: number): string {
  const invertedScore = 10000000 - Math.round(score);
  return invertedScore.toString().padStart(8, "0");
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

interface UserAttempt {
  userId: string;
  correctAnswers?: number;
  score?: number;
  date: string;
  week: string;
  month: string;
  [key: string]: any;
}

interface UserProfile {
  userId: string;
  firstName: string;
  lastName?: string;
  profilePicture?: string;
  showOnLeaderboard?: boolean;
}

async function getAllUserAttempts(): Promise<Map<string, UserAttempt[]>> {
  console.log("\n=== Fetching All User Attempts ===");
  const userAttemptsMap = new Map<string, UserAttempt[]>();
  let lastEvaluatedKey: any = undefined;
  let totalAttempts = 0;

  do {
    const response = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :userPrefix) AND begins_with(SK, :attemptPrefix)",
        ExpressionAttributeValues: {
          ":userPrefix": "USER#",
          ":attemptPrefix": "ATTEMPT#",
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (response.Items) {
      for (const attempt of response.Items as UserAttempt[]) {
        const userId = attempt.PK?.replace("USER#", "");
        if (!userId) continue;

        if (!userAttemptsMap.has(userId)) {
          userAttemptsMap.set(userId, []);
        }
        userAttemptsMap.get(userId)!.push(attempt);
        totalAttempts++;
      }
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Found ${totalAttempts} attempts for ${userAttemptsMap.size} users`);
  return userAttemptsMap;
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "PROFILE",
      },
    })
  );

  if (!response.Items || response.Items.length === 0) {
    return null;
  }

  const profile: any = response.Items[0]!;
  return {
    userId,
    firstName: profile.firstName || "Anonymous",
    lastName: profile.lastName,
    profilePicture: profile.profilePicture,
    showOnLeaderboard: profile.showOnLeaderboard,
  };
}

async function deleteOldLeaderboardEntries(type: "DAILY" | "WEEKLY" | "MONTHLY"): Promise<number> {
  console.log(`\n=== Deleting Old ${type} Entries ===`);
  let deletedCount = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": `LEADERBOARD#${type}`,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (response.Items && response.Items.length > 0) {
      for (const item of response.Items) {
        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: item.PK,
              SK: item.SK,
            },
          })
        );
        deletedCount++;
      }
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Deleted ${deletedCount} old ${type} entries`);
  return deletedCount;
}

async function rebuildDailyLeaderboards(userAttemptsMap: Map<string, UserAttempt[]>): Promise<number> {
  console.log("\n=== Rebuilding DAILY Leaderboards ===");

  // Delete old entries first
  await deleteOldLeaderboardEntries("DAILY");

  // Group attempts by date and user
  const dailyData = new Map<string, Map<string, { attempts: UserAttempt[], profile: UserProfile | null }>>();

  for (const [userId, attempts] of userAttemptsMap.entries()) {
    const profile = await getUserProfile(userId);

    if (!profile || profile.showOnLeaderboard === false) {
      continue;
    }

    for (const attempt of attempts) {
      if (!attempt.date) continue;

      if (!dailyData.has(attempt.date)) {
        dailyData.set(attempt.date, new Map());
      }

      if (!dailyData.get(attempt.date)!.has(userId)) {
        dailyData.get(attempt.date)!.set(userId, { attempts: [], profile });
      }

      dailyData.get(attempt.date)!.get(userId)!.attempts.push(attempt);
    }
  }

  // Create daily entries
  let createdCount = 0;
  for (const [date, userMap] of dailyData.entries()) {
    for (const [userId, { attempts, profile }] of userMap.entries()) {
      const totalPoints = attempts.reduce((sum, attempt) => {
        const correctAnswers = attempt.correctAnswers || attempt.score || 0;
        return sum + (correctAnswers * POINTS_PER_CORRECT_ANSWER);
      }, 0);

      if (totalPoints === 0) continue;

      const paddedScore = padScore(totalPoints);
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `LEADERBOARD#DAILY#${date}`,
            SK: `SCORE#${paddedScore}#${userId}`,
            GSI1PK: `LEADERBOARD#DAILY`,
            GSI1SK: `${date}#${paddedScore}#${userId}`,
            userId,
            firstName: profile!.firstName,
            lastName: profile!.lastName,
            profilePicture: profile!.profilePicture,
            totalPoints,
            score: totalPoints,
            percentage: 0,
            allScores: attempts.map(a => (a.correctAnswers || a.score || 0) * POINTS_PER_CORRECT_ANSWER),
            attemptCount: attempts.length,
            TTL: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
          },
        })
      );
      createdCount++;
    }
  }

  console.log(`✓ Created ${createdCount} DAILY entries`);
  return createdCount;
}

async function rebuildWeeklyLeaderboards(userAttemptsMap: Map<string, UserAttempt[]>): Promise<number> {
  console.log("\n=== Rebuilding WEEKLY Leaderboards ===");

  await deleteOldLeaderboardEntries("WEEKLY");

  const weeklyData = new Map<string, Map<string, { attempts: UserAttempt[], profile: UserProfile | null }>>();

  for (const [userId, attempts] of userAttemptsMap.entries()) {
    const profile = await getUserProfile(userId);

    if (!profile || profile.showOnLeaderboard === false) {
      continue;
    }

    for (const attempt of attempts) {
      if (!attempt.week) continue;

      if (!weeklyData.has(attempt.week)) {
        weeklyData.set(attempt.week, new Map());
      }

      if (!weeklyData.get(attempt.week)!.has(userId)) {
        weeklyData.get(attempt.week)!.set(userId, { attempts: [], profile });
      }

      weeklyData.get(attempt.week)!.get(userId)!.attempts.push(attempt);
    }
  }

  let createdCount = 0;
  for (const [week, userMap] of weeklyData.entries()) {
    for (const [userId, { attempts, profile }] of userMap.entries()) {
      const totalPoints = attempts.reduce((sum, attempt) => {
        const correctAnswers = attempt.correctAnswers || attempt.score || 0;
        return sum + (correctAnswers * POINTS_PER_CORRECT_ANSWER);
      }, 0);

      if (totalPoints === 0) continue;

      const paddedScore = padScore(totalPoints);
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `LEADERBOARD#WEEKLY#${week}`,
            SK: `SCORE#${paddedScore}#${userId}`,
            GSI1PK: `LEADERBOARD#WEEKLY`,
            GSI1SK: `${week}#${paddedScore}#${userId}`,
            userId,
            firstName: profile!.firstName,
            lastName: profile!.lastName,
            profilePicture: profile!.profilePicture,
            totalPoints,
            score: totalPoints,
            percentage: 0,
            allScores: attempts.map(a => (a.correctAnswers || a.score || 0) * POINTS_PER_CORRECT_ANSWER),
            attemptCount: attempts.length,
            TTL: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60, // 60 days
          },
        })
      );
      createdCount++;
    }
  }

  console.log(`✓ Created ${createdCount} WEEKLY entries`);
  return createdCount;
}

async function rebuildMonthlyLeaderboards(userAttemptsMap: Map<string, UserAttempt[]>): Promise<number> {
  console.log("\n=== Rebuilding MONTHLY Leaderboards ===");

  await deleteOldLeaderboardEntries("MONTHLY");

  const monthlyData = new Map<string, Map<string, { attempts: UserAttempt[], profile: UserProfile | null }>>();

  for (const [userId, attempts] of userAttemptsMap.entries()) {
    const profile = await getUserProfile(userId);

    if (!profile || profile.showOnLeaderboard === false) {
      continue;
    }

    for (const attempt of attempts) {
      if (!attempt.month) continue;

      if (!monthlyData.has(attempt.month)) {
        monthlyData.set(attempt.month, new Map());
      }

      if (!monthlyData.get(attempt.month)!.has(userId)) {
        monthlyData.get(attempt.month)!.set(userId, { attempts: [], profile });
      }

      monthlyData.get(attempt.month)!.get(userId)!.attempts.push(attempt);
    }
  }

  let createdCount = 0;
  for (const [month, userMap] of monthlyData.entries()) {
    for (const [userId, { attempts, profile }] of userMap.entries()) {
      const totalPoints = attempts.reduce((sum, attempt) => {
        const correctAnswers = attempt.correctAnswers || attempt.score || 0;
        return sum + (correctAnswers * POINTS_PER_CORRECT_ANSWER);
      }, 0);

      if (totalPoints === 0) continue;

      const paddedScore = padScore(totalPoints);
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `LEADERBOARD#MONTHLY#${month}`,
            SK: `SCORE#${paddedScore}#${userId}`,
            GSI1PK: `LEADERBOARD#MONTHLY`,
            GSI1SK: `${month}#${paddedScore}#${userId}`,
            userId,
            firstName: profile!.firstName,
            lastName: profile!.lastName,
            profilePicture: profile!.profilePicture,
            totalPoints,
            score: totalPoints,
            percentage: 0,
            allScores: attempts.map(a => (a.correctAnswers || a.score || 0) * POINTS_PER_CORRECT_ANSWER),
            attemptCount: attempts.length,
            TTL: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days
          },
        })
      );
      createdCount++;
    }
  }

  console.log(`✓ Created ${createdCount} MONTHLY entries`);
  return createdCount;
}

async function main() {
  console.log("Rebuilding time-based leaderboards from user attempts...");
  console.log(`Target table: ${TABLE_NAME}`);
  console.log(`Current date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`Current week: ${getISOWeek(new Date())}`);
  console.log(`Current month: ${new Date().toISOString().substring(0, 7)}`);

  try {
    const userAttemptsMap = await getAllUserAttempts();

    await rebuildDailyLeaderboards(userAttemptsMap);
    await rebuildWeeklyLeaderboards(userAttemptsMap);
    await rebuildMonthlyLeaderboards(userAttemptsMap);

    console.log("\n✅ Rebuild completed successfully!");
    console.log("\nNote: AllTime leaderboard was not affected by this rebuild.");
  } catch (error) {
    console.error("\n❌ Rebuild failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
