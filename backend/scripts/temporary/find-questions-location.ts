/**
 * Find where questions are stored in DynamoDB
 *
 * This script helps identify the PK patterns used for storing questions
 * Run with: TABLE_NAME=exam-platform-data-dev node dist/scripts/find-questions-location.js
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";

async function findQuestionsLocation() {
  console.log("=== Finding Question Storage Locations ===");
  console.log(`Table: ${TABLE_NAME}\n`);

  try {
    let hasMore = true;
    let lastEvaluatedKey: any = undefined;
    const pkPatterns = new Map<string, number>();
    const skPatterns = new Map<string, number>();
    let totalItems = 0;
    let questionItems = 0;

    console.log("Scanning database...\n");

    while (hasMore) {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 100,
      });

      const response = await docClient.send(command);
      const items = response.Items || [];

      for (const item of items) {
        totalItems++;

        // Track PK patterns
        const pk = item.PK as string;
        const pkPrefix = pk?.split('#')[0] || 'UNKNOWN';
        pkPatterns.set(pkPrefix, (pkPatterns.get(pkPrefix) || 0) + 1);

        // Track SK patterns
        const sk = item.SK as string;
        const skPrefix = sk?.split('#')[0] || 'UNKNOWN';
        skPatterns.set(skPrefix, (skPatterns.get(skPrefix) || 0) + 1);

        // Count question-related items
        if (sk?.includes('QUESTION') || item.questionText) {
          questionItems++;

          // Show first few examples
          if (questionItems <= 5) {
            console.log(`Example ${questionItems}:`);
            console.log(`  PK: ${pk}`);
            console.log(`  SK: ${sk}`);
            console.log(`  Has questionText: ${!!item.questionText}`);
            console.log(`  Has explanation: ${!!item.explanation}`);
            if (item.explanation) {
              console.log(`  Explanation preview: ${(item.explanation as string).substring(0, 80)}...`);
            }
            console.log("");
          }
        }
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
      hasMore = !!lastEvaluatedKey;

      if (totalItems % 100 === 0) {
        console.log(`Scanned ${totalItems} items...`);
      }
    }

    console.log("\n=== SUMMARY ===");
    console.log(`Total Items: ${totalItems}`);
    console.log(`Question Items: ${questionItems}\n`);

    console.log("PK Patterns:");
    const sortedPK = Array.from(pkPatterns.entries()).sort((a, b) => b[1] - a[1]);
    sortedPK.forEach(([pattern, count]) => {
      console.log(`  ${pattern}#: ${count} items`);
    });

    console.log("\nSK Patterns:");
    const sortedSK = Array.from(skPatterns.entries()).sort((a, b) => b[1] - a[1]);
    sortedSK.forEach(([pattern, count]) => {
      console.log(`  ${pattern}#: ${count} items`);
    });

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

findQuestionsLocation()
  .then(() => {
    console.log("\n✓ Scan completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Scan failed:", error);
    process.exit(1);
  });
