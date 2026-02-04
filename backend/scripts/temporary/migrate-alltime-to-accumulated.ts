/**
 * Migration Script: Migrate AllTime Leaderboard to Accumulated Points
 *
 * This script:
 * 1. Deletes old per-exam AllTime leaderboard entries
 * 2. Recalculates AllTime leaderboard based on accumulated points across ALL exams
 * 3. Creates new unified AllTime entries with total accumulated points
 *
 * Run this ONCE after deploying the new AllTime leaderboard code
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";
const POINTS_PER_CORRECT_ANSWER = 10;

interface UserAttempt {
  userId: string;
  correctAnswers?: number;
  score?: number;
  [key: string]: any;
}

interface UserProfile {
  userId: string;
  firstName: string;
  lastName?: string;
  profilePicture?: string;
  showOnLeaderboard?: boolean;
}

function padScore(score: number): string {
  const invertedScore = 10000000 - Math.round(score);
  return invertedScore.toString().padStart(8, "0");
}

async function deleteOldAllTimeEntries(): Promise<number> {
  console.log("\n=== Deleting Old AllTime Leaderboard Entries ===");
  let deletedCount = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": "LEADERBOARD#ALLTIME",
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (response.Items && response.Items.length > 0) {
      for (const item of response.Items) {
        // Only delete old per-exam entries, not the new unified ones
        if (item.PK !== "LEADERBOARD#ALLTIME") {
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
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Deleted ${deletedCount} old AllTime entries`);
  return deletedCount;
}

async function getUserAttempts(userId: string): Promise<UserAttempt[]> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "ATTEMPT#",
      },
    })
  );

  return (response.Items || []) as UserAttempt[];
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

async function getAllUserIds(): Promise<string[]> {
  console.log("\n=== Finding All Users with Attempts ===");
  const userIds = new Set<string>();
  let lastEvaluatedKey: any = undefined;

  do {
    const response = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :userPrefix) AND begins_with(SK, :attemptPrefix)",
        ExpressionAttributeValues: {
          ":userPrefix": "USER#",
          ":attemptPrefix": "ATTEMPT#",
        },
        ProjectionExpression: "PK",
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (response.Items) {
      for (const item of response.Items) {
        const userId = item.PK.replace("USER#", "");
        userIds.add(userId);
      }
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Found ${userIds.size} users with attempts`);
  return Array.from(userIds);
}

async function createUnifiedAllTimeLeaderboard(): Promise<number> {
  console.log("\n=== Creating Unified AllTime Leaderboard ===");

  const userIds = await getAllUserIds();
  let createdCount = 0;
  let skippedCount = 0;

  for (const userId of userIds) {
    // Get user profile
    const profile = await getUserProfile(userId);
    if (!profile) {
      console.log(`Skipping user ${userId} - no profile found`);
      skippedCount++;
      continue;
    }

    // Skip if user opted out
    if (profile.showOnLeaderboard === false) {
      console.log(`Skipping user ${userId} - opted out of leaderboard`);
      skippedCount++;
      continue;
    }

    // Get all attempts
    const attempts = await getUserAttempts(userId);
    if (attempts.length === 0) {
      console.log(`Skipping user ${userId} - no attempts found`);
      skippedCount++;
      continue;
    }

    // Calculate total points
    const totalPoints = attempts.reduce((sum, attempt) => {
      const correctAnswers = attempt.correctAnswers || attempt.score || 0;
      return sum + (correctAnswers * POINTS_PER_CORRECT_ANSWER);
    }, 0);

    if (totalPoints === 0) {
      console.log(`Skipping user ${userId} - no points earned`);
      skippedCount++;
      continue;
    }

    // Create unified AllTime entry
    const paddedScore = padScore(totalPoints);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: "LEADERBOARD#ALLTIME",
          SK: `SCORE#${paddedScore}#${userId}`,
          GSI1PK: "LEADERBOARD#ALLTIME",
          GSI1SK: `SCORE#${paddedScore}#${userId}`,
          userId,
          firstName: profile!.firstName,
          lastName: profile!.lastName,
          profilePicture: profile!.profilePicture,
          totalPoints,
          score: totalPoints,
          allScores: attempts.map(a => (a.correctAnswers || a.score || 0) * POINTS_PER_CORRECT_ANSWER),
          attemptCount: attempts.length,
        },
      })
    );

    createdCount++;
    if (createdCount % 10 === 0) {
      console.log(`Created ${createdCount} unified entries so far...`);
    }
  }

  console.log(`✓ Created ${createdCount} unified AllTime entries`);
  console.log(`✓ Skipped ${skippedCount} users`);
  return createdCount;
}

async function main() {
  console.log("Starting AllTime leaderboard migration to accumulated points...");
  console.log(`Target table: ${TABLE_NAME}`);

  try {
    // Step 1: Delete old per-exam entries
    await deleteOldAllTimeEntries();

    // Step 2: Create new unified entries
    await createUnifiedAllTimeLeaderboard();

    console.log("\n✅ Migration completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Verify the AllTime leaderboard displays correctly");
    console.log("2. Check that points accumulate across all exams");
    console.log("3. Test with new exam submissions");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
