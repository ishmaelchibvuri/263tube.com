/**
 * Copy all data from 263tube-dev DynamoDB table to 263tube-qa
 *
 * Usage: node scripts/copy-dev-to-qa.mjs
 *
 * Prerequisites: AWS credentials configured with access to both tables
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const SOURCE_TABLE = "263tube-qa";
const TARGET_TABLE = "263tube-prod";
const REGION = "af-south-1";
const BATCH_SIZE = 25; // DynamoDB BatchWrite max

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

async function scanAll() {
  const items = [];
  let lastKey = undefined;

  console.log(`Scanning all items from ${SOURCE_TABLE}...`);

  do {
    const command = new ScanCommand({
      TableName: SOURCE_TABLE,
      ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
    });

    const response = await docClient.send(command);

    if (response.Items) {
      items.push(...response.Items);
    }

    lastKey = response.LastEvaluatedKey;
    process.stdout.write(`\r  Scanned ${items.length} items so far...`);
  } while (lastKey);

  console.log(`\n  Total items scanned: ${items.length}`);
  return items;
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function batchWriteWithRetry(items, maxRetries = 3) {
  const batches = chunk(items, BATCH_SIZE);
  let totalWritten = 0;

  console.log(
    `Writing ${items.length} items to ${TARGET_TABLE} in ${batches.length} batches...`,
  );

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    let unprocessed = batch.map((item) => ({
      PutRequest: { Item: item },
    }));

    let attempt = 0;

    while (unprocessed.length > 0 && attempt < maxRetries) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TARGET_TABLE]: unprocessed,
        },
      });

      const response = await docClient.send(command);

      const failed = response.UnprocessedItems?.[TARGET_TABLE] || [];

      if (failed.length > 0) {
        attempt++;
        console.warn(
          `  Batch ${i + 1}: ${
            failed.length
          } unprocessed items, retrying (attempt ${attempt})...`,
        );
        unprocessed = failed;
        // Exponential backoff
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      } else {
        unprocessed = [];
      }
    }

    if (unprocessed.length > 0) {
      console.error(
        `  Batch ${i + 1}: Failed to write ${
          unprocessed.length
        } items after ${maxRetries} retries`,
      );
    }

    totalWritten += batch.length - (unprocessed.length || 0);
    process.stdout.write(
      `\r  Progress: ${totalWritten}/${items.length} items written`,
    );
  }

  console.log(`\n  Done! ${totalWritten} items written to ${TARGET_TABLE}`);
  return totalWritten;
}

async function main() {
  console.log("=== Copy DynamoDB: dev -> qa ===\n");
  console.log(`Source: ${SOURCE_TABLE}`);
  console.log(`Target: ${TARGET_TABLE}`);
  console.log(`Region: ${REGION}\n`);

  // Step 1: Scan all items from dev
  const items = await scanAll();

  if (items.length === 0) {
    console.log("No items found in source table. Nothing to copy.");
    return;
  }

  // Step 2: Write all items to qa
  console.log();
  const written = await batchWriteWithRetry(items);

  console.log(`\n=== Complete ===`);
  console.log(
    `Copied ${written} items from ${SOURCE_TABLE} to ${TARGET_TABLE}`,
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
