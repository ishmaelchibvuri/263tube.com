/**
 * Database Cleanup Script
 *
 * This script removes all questions and exam attempts from the database
 * to prepare for importing the complete RE5 question bank.
 *
 * WARNING: This is destructive and cannot be undone!
 *
 * Run with: npm run cleanup-db
 */

import {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env['TABLE_NAME'] || "exam-platform-data-dev";

const client = new DynamoDBClient({ region: process.env['AWS_REGION'] || "af-south-1" });


interface DynamoDBItem {
  PK: { S: string };
  SK: { S: string };
  [key: string]: any;
}

/**
 * Scan and delete all items matching a PK pattern
 */
async function deleteItemsByPattern(pkPrefix: string, description: string): Promise<number> {
  console.log(`\n🔍 Scanning for ${description}...`);

  let deletedCount = 0;
  let lastEvaluatedKey: any = undefined;
  let itemsToDelete: DynamoDBItem[] = [];

  do {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(PK, :prefix)",
      ExpressionAttributeValues: {
        ":prefix": { S: pkPrefix },
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await client.send(scanCommand);

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
          PK: item.PK,
          SK: item.SK,
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
 * Delete question progress entries
 */
async function deleteQuestionProgress(): Promise<number> {
  console.log(`\n🔍 Scanning for question progress entries...`);

  let deletedCount = 0;
  let lastEvaluatedKey: any = undefined;
  let itemsToDelete: DynamoDBItem[] = [];

  do {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":prefix": { S: "QPROGRESS#" },
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await client.send(scanCommand);

    if (response.Items && response.Items.length > 0) {
      itemsToDelete.push(...(response.Items as DynamoDBItem[]));
      console.log(`   Found ${response.Items.length} progress entries in this batch`);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`📊 Total question progress entries found: ${itemsToDelete.length}`);

  if (itemsToDelete.length === 0) {
    console.log(`✅ No question progress to delete`);
    return 0;
  }

  // Delete in batches
  const batchSize = 25;
  for (let i = 0; i < itemsToDelete.length; i += batchSize) {
    const batch = itemsToDelete.slice(i, i + batchSize);

    const deleteRequests = batch.map((item) => ({
      DeleteRequest: {
        Key: {
          PK: item.PK,
          SK: item.SK,
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

  console.log(`✅ Deleted ${deletedCount} question progress entries`);
  return deletedCount;
}

/**
 * Delete exam attempts
 */
async function deleteExamAttempts(): Promise<number> {
  console.log(`\n🔍 Scanning for exam attempts...`);

  let deletedCount = 0;
  let lastEvaluatedKey: any = undefined;
  let itemsToDelete: DynamoDBItem[] = [];

  do {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":prefix": { S: "ATTEMPT#" },
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await client.send(scanCommand);

    if (response.Items && response.Items.length > 0) {
      itemsToDelete.push(...(response.Items as DynamoDBItem[]));
      console.log(`   Found ${response.Items.length} attempts in this batch`);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`📊 Total exam attempts found: ${itemsToDelete.length}`);

  if (itemsToDelete.length === 0) {
    console.log(`✅ No exam attempts to delete`);
    return 0;
  }

  // Delete in batches
  const batchSize = 25;
  for (let i = 0; i < itemsToDelete.length; i += batchSize) {
    const batch = itemsToDelete.slice(i, i + batchSize);

    const deleteRequests = batch.map((item) => ({
      DeleteRequest: {
        Key: {
          PK: item.PK,
          SK: item.SK,
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

  console.log(`✅ Deleted ${deletedCount} exam attempts`);
  return deletedCount;
}

/**
 * Delete leaderboard entries
 */
async function deleteLeaderboards(): Promise<number> {
  return await deleteItemsByPattern("LEADERBOARD#", "leaderboard entries");
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  RE5 Database Cleanup Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Table: ${TABLE_NAME}`);
  console.log(`  Region: ${process.env['AWS_REGION'] || "af-south-1"}`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("⚠️  WARNING: This will permanently delete:");
  console.log("   - All questions");
  console.log("   - All exam attempts");
  console.log("   - All question progress tracking");
  console.log("   - All leaderboard entries");
  console.log("");
  console.log("   User accounts and subscriptions will NOT be deleted.");
  console.log("");

  // Wait 3 seconds to allow cancellation
  console.log("⏳ Starting in 3 seconds... (Ctrl+C to cancel)");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("\n🚀 Starting cleanup...\n");

  const startTime = Date.now();

  try {
    // 1. Delete all exams
    const examsDeleted = await deleteItemsByPattern("EXAM#", "exams");

    // 2. Delete all question progress
    const progressDeleted = await deleteQuestionProgress();

    // 3. Delete all exam attempts
    const attemptsDeleted = await deleteExamAttempts();

    // 4. Delete leaderboards
    const leaderboardsDeleted = await deleteLeaderboards();

    // 5. Delete static exam config
    const configDeleted = await deleteItemsByPattern("CONFIG#STATIC_EXAM", "static exam configs");

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  Cleanup Summary");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  ✅ Exams deleted: ${examsDeleted}`);
    console.log(`  ✅ Question progress deleted: ${progressDeleted}`);
    console.log(`  ✅ Exam attempts deleted: ${attemptsDeleted}`);
    console.log(`  ✅ Leaderboard entries deleted: ${leaderboardsDeleted}`);
    console.log(`  ✅ Static configs deleted: ${configDeleted}`);
    console.log(`  ⏱️  Duration: ${duration}s`);
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\n✅ Database cleanup completed successfully!");
    console.log("📝 You can now import the new question bank.\n");
  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
    process.exit(1);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { cleanup };
