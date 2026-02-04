/**
 * Clear Exam History Script
 *
 * This script removes ALL exam attempts, answers, question progress, and leaderboards
 * from the database while keeping users, subscriptions, and questions intact.
 *
 * WARNING: This is destructive and cannot be undone!
 *
 * This will delete:
 * - All exam attempts (ATTEMPT#)
 * - All user answers (ANSWER#)
 * - All question progress (QPROGRESS#)
 * - All leaderboard entries (LEADERBOARD#)
 * - All attempt metadata (ATTEMPT_META#)
 *
 * Run with: tsx backend/scripts/clear-exam-history.ts
 */

import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

interface DynamoDBItem {
  PK: string;
  SK: string;
  [key: string]: any;
}

/**
 * Scan and delete all items matching an SK pattern
 */
async function deleteItemsBySKPattern(skPrefix: string, description: string): Promise<number> {
  console.log(`\n🔍 Scanning for ${description}...`);

  let deletedCount = 0;
  let lastEvaluatedKey: any = undefined;
  let itemsToDelete: DynamoDBItem[] = [];

  do {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":prefix": skPrefix,
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await docClient.send(scanCommand);

    if (response.Items && response.Items.length > 0) {
      itemsToDelete.push(...(response.Items as DynamoDBItem[]));
      console.log(`   Found ${response.Items.length} items in this batch`);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`📊 Total ${description} found: ${itemsToDelete.length}`);

  if (itemsToDelete.length === 0) {
    console.log(`✅ No ${description} to delete`);
    return 0;
  }

  // Delete in batches of 25 (DynamoDB limit)
  const batchSize = 25;
  for (let i = 0; i < itemsToDelete.length; i += batchSize) {
    const batch = itemsToDelete.slice(i, i + batchSize);

    const deleteRequests = batch.map((item) => ({
      DeleteRequest: {
        Key: {
          PK: { S: item.PK },
          SK: { S: item.SK },
        },
      },
    }));

    const batchWriteCommand = new BatchWriteItemCommand({
      RequestItems: {
        [TABLE_NAME]: deleteRequests,
      },
    });

    await client.send(batchWriteCommand);
    deletedCount += batch.length;
    console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`);
  }

  console.log(`✅ Deleted ${deletedCount} ${description}`);
  return deletedCount;
}

/**
 * Scan and delete all items matching a PK pattern
 */
async function deleteItemsByPKPattern(pkPrefix: string, description: string): Promise<number> {
  console.log(`\n🔍 Scanning for ${description}...`);

  let deletedCount = 0;
  let lastEvaluatedKey: any = undefined;
  let itemsToDelete: DynamoDBItem[] = [];

  do {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(PK, :prefix)",
      ExpressionAttributeValues: {
        ":prefix": pkPrefix,
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await docClient.send(scanCommand);

    if (response.Items && response.Items.length > 0) {
      itemsToDelete.push(...(response.Items as DynamoDBItem[]));
      console.log(`   Found ${response.Items.length} items in this batch`);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`📊 Total ${description} found: ${itemsToDelete.length}`);

  if (itemsToDelete.length === 0) {
    console.log(`✅ No ${description} to delete`);
    return 0;
  }

  // Delete in batches of 25 (DynamoDB limit)
  const batchSize = 25;
  for (let i = 0; i < itemsToDelete.length; i += batchSize) {
    const batch = itemsToDelete.slice(i, i + batchSize);

    const deleteRequests = batch.map((item) => ({
      DeleteRequest: {
        Key: {
          PK: { S: item.PK },
          SK: { S: item.SK },
        },
      },
    }));

    const batchWriteCommand = new BatchWriteItemCommand({
      RequestItems: {
        [TABLE_NAME]: deleteRequests,
      },
    });

    await client.send(batchWriteCommand);
    deletedCount += batch.length;
    console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`);
  }

  console.log(`✅ Deleted ${deletedCount} ${description}`);
  return deletedCount;
}

/**
 * Main cleanup function
 */
async function clearExamHistory() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Clear ALL Exam History Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Table: ${TABLE_NAME}`);
  console.log(`  Region: ${process.env.AWS_REGION || "af-south-1"}`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("⚠️  WARNING: This will permanently delete:");
  console.log("   - ALL exam attempts (ATTEMPT#)");
  console.log("   - ALL user answers (ANSWER#)");
  console.log("   - ALL question progress tracking (QPROGRESS#)");
  console.log("   - ALL leaderboard entries (LEADERBOARD#)");
  console.log("   - ALL attempt metadata (ATTEMPT_META#)");
  console.log("");
  console.log("✅ This will NOT delete:");
  console.log("   - User accounts and profiles");
  console.log("   - Subscriptions");
  console.log("   - Questions and exams");
  console.log("   - Bookmarks");
  console.log("");

  // Wait 5 seconds to allow cancellation
  console.log("⏳ Starting in 5 seconds... (Ctrl+C to cancel)");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("\n🚀 Starting cleanup...\n");

  const startTime = Date.now();

  try {
    // 1. Delete all exam attempts (stored under USER#userId with SK=ATTEMPT#)
    const attemptsDeleted = await deleteItemsBySKPattern("ATTEMPT#", "exam attempts");

    // 2. Delete all question progress (stored under USER#userId with SK=QPROGRESS#)
    const progressDeleted = await deleteItemsBySKPattern("QPROGRESS#", "question progress entries");

    // 3. Delete all answers (stored under ANSWER#attemptId)
    const answersDeleted = await deleteItemsByPKPattern("ANSWER#", "answer records");

    // 4. Delete leaderboard entries
    const leaderboardsDeleted = await deleteItemsByPKPattern("LEADERBOARD#", "leaderboard entries");

    // 5. Delete attempt metadata (ATTEMPT_META# entries that allow lookup by attemptId)
    const attemptMetaDeleted = await deleteItemsByPKPattern("ATTEMPT_META#", "attempt metadata");

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  Cleanup Summary");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  ✅ Exam attempts deleted: ${attemptsDeleted}`);
    console.log(`  ✅ Question progress deleted: ${progressDeleted}`);
    console.log(`  ✅ Answer records deleted: ${answersDeleted}`);
    console.log(`  ✅ Leaderboard entries deleted: ${leaderboardsDeleted}`);
    console.log(`  ✅ Attempt metadata deleted: ${attemptMetaDeleted}`);
    console.log(`  ⏱️  Duration: ${duration}s`);
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\n✅ Exam history cleared successfully!");
    console.log("📝 Users can now start fresh with their exams.\n");
  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
    process.exit(1);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  clearExamHistory()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { clearExamHistory };
