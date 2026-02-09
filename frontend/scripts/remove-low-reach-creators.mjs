/**
 * 263Tube - Remove Low-Reach Creators
 *
 * Deletes all creators with totalReach < 100 from DynamoDB.
 *
 * Usage:
 *   node scripts/remove-low-reach-creators.mjs                # dev (default)
 *   node scripts/remove-low-reach-creators.mjs --env=qa
 *   node scripts/remove-low-reach-creators.mjs --env=prod
 *   node scripts/remove-low-reach-creators.mjs --dry-run      # preview only
 *
 * Prerequisites: AWS credentials configured with DynamoDB access
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

// ============================================================================
// Configuration
// ============================================================================

const REGION = "af-south-1";
const MIN_REACH = 100;
const DYNAMO_BATCH_SIZE = 25;

function parseArgs() {
  const args = process.argv.slice(2);
  let env = "dev";
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith("--env=")) env = arg.split("=")[1];
    if (arg === "--dry-run") dryRun = true;
  }

  return { env, dryRun };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const { env, dryRun } = parseArgs();
  const tableName = `263tube-${env}`;

  console.log(`\n  Environment : ${env}`);
  console.log(`  Table       : ${tableName}`);
  console.log(`  Min reach   : ${MIN_REACH}`);
  console.log(`  Dry run     : ${dryRun}\n`);

  const client = new DynamoDBClient({ region: REGION });
  const docClient = DynamoDBDocumentClient.from(client);

  // Query all creators across all status partitions
  const statusPartitions = [
    "STATUS#ACTIVE",
    "STATUS#FEATURED",
    "STATUS#INACTIVE",
    "STATUS#PENDING_REVIEW",
  ];

  const toDelete = [];

  for (const partition of statusPartitions) {
    let lastKey = undefined;

    do {
      const result = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk",
          ExpressionAttributeValues: { ":pk": partition },
          ProjectionExpression: "pk, sk, #n, slug, #m",
          ExpressionAttributeNames: { "#n": "name", "#m": "metrics" },
          ExclusiveStartKey: lastKey,
        })
      );

      for (const item of result.Items || []) {
        const reach = item.metrics?.totalReach || 0;
        if (reach < MIN_REACH) {
          toDelete.push({
            pk: item.pk,
            sk: item.sk,
            name: item.name || item.slug || "unknown",
            reach,
            partition,
          });
        }
      }

      lastKey = result.LastEvaluatedKey;
    } while (lastKey);
  }

  console.log(`  Found ${toDelete.length} creators with reach < ${MIN_REACH}\n`);

  if (toDelete.length === 0) {
    console.log("  Nothing to delete.\n");
    return;
  }

  // Show sample of creators being deleted
  const sample = toDelete.slice(0, 20);
  console.log("  Sample of creators to delete:");
  for (const item of sample) {
    console.log(`    - ${item.name} (reach: ${item.reach}, ${item.partition})`);
  }
  if (toDelete.length > 20) {
    console.log(`    ... and ${toDelete.length - 20} more\n`);
  } else {
    console.log("");
  }

  if (dryRun) {
    console.log(`  Dry run complete. ${toDelete.length} creators would be deleted.\n`);
    return;
  }

  // Batch delete in groups of 25
  let deleted = 0;

  for (let i = 0; i < toDelete.length; i += DYNAMO_BATCH_SIZE) {
    const batch = toDelete.slice(i, i + DYNAMO_BATCH_SIZE);
    const deleteRequests = batch.map((item) => ({
      DeleteRequest: { Key: { pk: item.pk, sk: item.sk } },
    }));

    try {
      let unprocessed = { [tableName]: deleteRequests };
      let retries = 0;

      while (unprocessed[tableName]?.length > 0 && retries < 3) {
        const result = await docClient.send(
          new BatchWriteCommand({ RequestItems: unprocessed })
        );
        const remaining = result.UnprocessedItems?.[tableName]?.length || 0;
        deleted += (unprocessed[tableName]?.length || 0) - remaining;
        unprocessed = result.UnprocessedItems || {};

        if (unprocessed[tableName]?.length > 0) {
          retries++;
          await new Promise((r) => setTimeout(r, 1000 * retries));
        }
      }
    } catch (err) {
      console.error(`  Batch delete failed at offset ${i}: ${err.message}`);
    }

    // Progress every 250 items
    if ((i + DYNAMO_BATCH_SIZE) % 250 < DYNAMO_BATCH_SIZE) {
      console.log(`  Deleted ${deleted}/${toDelete.length}...`);
    }
  }

  console.log(`\n  Done! Deleted ${deleted} creators with reach < ${MIN_REACH} from ${tableName}.\n`);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
