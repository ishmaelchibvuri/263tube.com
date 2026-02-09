/**
 * Copy all data from one 263tube DynamoDB table to another.
 * Clears the destination table first, then copies all items from source.
 *
 * Usage:
 *   node scripts/replicate-database-dev-to-qa.mjs <source> <destination>
 *
 * Examples:
 *   node scripts/replicate-database-dev-to-qa-to-prod.mjs dev qa
 *   node scripts/replicate-database-dev-to-qa-to-prod.mjs qa prod
 *
 * Prerequisites: AWS credentials configured with access to both tables
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    "Usage: node scripts/replicate-database-dev-to-qa.mjs <source> <destination>",
  );
  console.error(
    "Example: node scripts/replicate-database-dev-to-qa.mjs dev prod",
  );
  process.exit(1);
}

const sourceEnv = args[0];
const destEnv = args[1];

const SOURCE_TABLE = `263tube-${sourceEnv}`;
const TARGET_TABLE = `263tube-${destEnv}`;
const REGION = "af-south-1";
const BATCH_SIZE = 25; // DynamoDB BatchWrite max

// ---------------------------------------------------------------------------
// DynamoDB client
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function scanAll(tableName) {
  const items = [];
  let lastKey = undefined;

  console.log(`Scanning all items from ${tableName}...`);

  do {
    const command = new ScanCommand({
      TableName: tableName,
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

// ---------------------------------------------------------------------------
// Clear destination table
// ---------------------------------------------------------------------------

async function clearTable(tableName) {
  console.log(`Clearing all items from ${tableName}...`);

  // Scan to get all keys
  const items = [];
  let lastKey = undefined;

  do {
    const command = new ScanCommand({
      TableName: tableName,
      ProjectionExpression: "pk, sk",
      ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
    });

    const response = await docClient.send(command);

    if (response.Items) {
      items.push(...response.Items);
    }

    lastKey = response.LastEvaluatedKey;
    process.stdout.write(`\r  Found ${items.length} items to delete...`);
  } while (lastKey);

  if (items.length === 0) {
    console.log("\n  Destination table is already empty.");
    return 0;
  }

  console.log(`\n  Deleting ${items.length} items...`);

  const batches = chunk(items, BATCH_SIZE);
  let totalDeleted = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    let unprocessed = batch.map((item) => ({
      DeleteRequest: { Key: { pk: item.pk, sk: item.sk } },
    }));

    let attempt = 0;
    const maxRetries = 3;

    while (unprocessed.length > 0 && attempt < maxRetries) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [tableName]: unprocessed,
        },
      });

      const response = await docClient.send(command);
      const failed = response.UnprocessedItems?.[tableName] || [];

      if (failed.length > 0) {
        attempt++;
        console.warn(
          `  Delete batch ${i + 1}: ${
            failed.length
          } unprocessed, retrying (attempt ${attempt})...`,
        );
        unprocessed = failed;
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      } else {
        unprocessed = [];
      }
    }

    if (unprocessed.length > 0) {
      console.error(
        `  Delete batch ${i + 1}: Failed to delete ${
          unprocessed.length
        } items after ${maxRetries} retries`,
      );
    }

    totalDeleted += batch.length - (unprocessed.length || 0);
    process.stdout.write(
      `\r  Progress: ${totalDeleted}/${items.length} items deleted`,
    );
  }

  console.log(`\n  Cleared ${totalDeleted} items from ${tableName}`);
  return totalDeleted;
}

// ---------------------------------------------------------------------------
// Write to destination table
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`=== Copy DynamoDB: ${sourceEnv} -> ${destEnv} ===\n`);
  console.log(`Source: ${SOURCE_TABLE}`);
  console.log(`Target: ${TARGET_TABLE}`);
  console.log(`Region: ${REGION}\n`);

  // Step 1: Clear destination table
  await clearTable(TARGET_TABLE);

  // Step 2: Scan all items from source
  console.log();
  const items = await scanAll(SOURCE_TABLE);

  if (items.length === 0) {
    console.log("No items found in source table. Nothing to copy.");
    return;
  }

  // Step 3: Write all items to destination
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
