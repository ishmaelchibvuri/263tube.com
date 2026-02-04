/**
 * Delete all Premium/Pro questions from QUESTIONBANK
 *
 * WARNING: This is a DESTRUCTIVE operation that will delete all questions
 * in the QUESTIONBANK table (Premium/Pro questions).
 *
 * Run with: TABLE_NAME=exam-platform-data-dev node dist/scripts/delete-questionbank-questions.js
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";

interface QuestionItem {
  PK: string;
  SK: string;
  questionId?: string;
  questionText?: string;
}

async function deleteQuestionBankQuestions() {
  console.log("=== DELETING QUESTIONBANK QUESTIONS ===");
  console.log(`Table: ${TABLE_NAME}`);
  console.log("⚠️  WARNING: This will delete ALL Premium/Pro questions from QUESTIONBANK\n");

  try {
    // First, scan to find all QUESTIONBANK questions
    let hasMore = true;
    let lastEvaluatedKey: any = undefined;
    const questionsToDelete: QuestionItem[] = [];

    console.log("📊 Scanning for QUESTIONBANK questions...\n");

    while (hasMore) {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 100,
      });

      const response = await docClient.send(command);
      const allItems = (response.Items || []) as QuestionItem[];

      // Filter for items with SK starting with QUESTION# (these are question records)
      const questionItems = allItems.filter(item => {
        const sk = String(item.SK || '');
        return sk.startsWith("QUESTION#");
      });

      // Debug: show first few question items with their PKs
      if (questionsToDelete.length === 0 && questionItems.length > 0) {
        console.log("\nFound QUESTION# items! Sample PK/SK pairs:");
        questionItems.slice(0, 10).forEach(item => {
          console.log(`  PK: "${item.PK}", SK: "${item.SK}"`);
        });
      }

      // Filter for QUESTIONBANK items (PK === "QUESTIONBANK" exactly)
      const items = questionItems.filter(item => {
        const pk = String(item.PK || '');
        return pk === "QUESTIONBANK";
      });

      console.log(`Batch scan returned ${allItems.length} total items, ${items.length} QUESTIONBANK# items`);
      if (items.length > 0 && items[0]) {
        console.log(`Sample QUESTIONBANK item: PK=${items[0].PK}, SK=${items[0].SK}`);
      }

      questionsToDelete.push(...items);

      lastEvaluatedKey = response.LastEvaluatedKey;
      hasMore = !!lastEvaluatedKey;

      if (questionsToDelete.length % 100 === 0 && questionsToDelete.length > 0) {
        console.log(`Found ${questionsToDelete.length} questions so far...`);
      }
    }

    console.log(`\n✓ Scan complete: Found ${questionsToDelete.length} questions to delete\n`);

    if (questionsToDelete.length === 0) {
      console.log("ℹ️  No questions found to delete");
      return;
    }

    // Show sample of what will be deleted
    console.log("Sample questions to be deleted:");
    questionsToDelete.slice(0, 5).forEach((q, index) => {
      console.log(`${index + 1}. ${q.PK} / ${q.SK}`);
      console.log(`   Question: ${q.questionText?.substring(0, 60)}...`);
    });

    console.log(`\n🗑️  Starting deletion of ${questionsToDelete.length} questions...\n`);

    let deletedCount = 0;
    let failedCount = 0;
    const batchSize = 25; // Process in batches to avoid rate limiting

    for (let i = 0; i < questionsToDelete.length; i += batchSize) {
      const batch = questionsToDelete.slice(i, i + batchSize);

      // Delete items in parallel within batch
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

      // Progress update
      if ((i + batchSize) % 100 === 0 || (i + batchSize) >= questionsToDelete.length) {
        console.log(`Progress: ${deletedCount}/${questionsToDelete.length} deleted...`);
      }

      // Small delay between batches to avoid throttling
      if (i + batchSize < questionsToDelete.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log("\n=== DELETION SUMMARY ===");
    console.log(`Total Questions Found: ${questionsToDelete.length}`);
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

deleteQuestionBankQuestions()
  .then(() => {
    console.log("\n✓ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
