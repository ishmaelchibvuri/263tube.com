/**
 * Delete all questions and metadata from Premium/Pro exams
 * Keeps only re5-free-exam
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";

// Exams to DELETE (Premium/Pro exams)
const EXAMS_TO_DELETE = [
  "EXAM#re5-premium-exam",
  "EXAM#re5-full-exam",
  "EXAM#re5-pro-exam",
];

async function deletePremiumExamQuestions() {
  console.log("=== Deleting Premium/Pro Exam Questions ===");
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Exams to delete: ${EXAMS_TO_DELETE.map(e => e.replace('EXAM#', '')).join(', ')}\n`);

  try {
    let hasMore = true;
    let lastEvaluatedKey: any = undefined;
    const itemsToDelete: any[] = [];

    console.log("📊 Scanning for Premium/Pro exam items...\n");

    while (hasMore) {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 100,
      });

      const response = await docClient.send(command);
      const items = response.Items || [];

      for (const item of items) {
        const pk = String(item.PK || '');

        // Check if this item belongs to a Premium/Pro exam
        if (EXAMS_TO_DELETE.some(examPK => pk === examPK)) {
          itemsToDelete.push(item);
        }
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
      hasMore = !!lastEvaluatedKey;

      if (itemsToDelete.length % 100 === 0 && itemsToDelete.length > 0) {
        console.log(`Found ${itemsToDelete.length} items so far...`);
      }
    }

    console.log(`\n✓ Scan complete: Found ${itemsToDelete.length} items to delete\n`);

    if (itemsToDelete.length === 0) {
      console.log("ℹ️  No Premium/Pro exam items found to delete");
      return;
    }

    // Group by exam
    const itemsByExam = new Map<string, any[]>();
    for (const item of itemsToDelete) {
      const examPK = item.PK;
      if (!itemsByExam.has(examPK)) {
        itemsByExam.set(examPK, []);
      }
      itemsByExam.get(examPK)!.push(item);
    }

    console.log("Items to delete by exam:");
    for (const [examPK, items] of itemsByExam.entries()) {
      const examId = examPK.replace('EXAM#', '');
      const questionCount = items.filter(i => String(i.SK).startsWith('QUESTION#')).length;
      console.log(`  ${examId}: ${items.length} items (${questionCount} questions)`);
    }

    console.log(`\n🗑️  Starting deletion of ${itemsToDelete.length} items...\n`);

    let deletedCount = 0;
    let failedCount = 0;
    const batchSize = 25;

    for (let i = 0; i < itemsToDelete.length; i += batchSize) {
      const batch = itemsToDelete.slice(i, i + batchSize);

      const deletePromises = batch.map(async (item) => {
        try {
          const deleteCommand = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: item.PK,
              SK: item.SK,
            },
          });

          await docClient.send(deleteCommand);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete ${item.PK}/${item.SK}:`, error);
          failedCount++;
        }
      });

      await Promise.all(deletePromises);

      if ((i + batchSize) % 100 === 0 || (i + batchSize) >= itemsToDelete.length) {
        console.log(`Progress: ${deletedCount}/${itemsToDelete.length} deleted...`);
      }

      if (i + batchSize < itemsToDelete.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log("\n=== DELETION SUMMARY ===");
    console.log(`Total Items Found: ${itemsToDelete.length}`);
    console.log(`Successfully Deleted: ${deletedCount}`);
    console.log(`Failed: ${failedCount}`);

    if (deletedCount > 0) {
      console.log("\n✓ Deletion completed successfully");
    }

  } catch (error) {
    console.error("Error during deletion:", error);
    throw error;
  }
}

deletePremiumExamQuestions()
  .then(() => {
    console.log("\n✓ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
