/**
 * 263Tube - Delete Creator from DynamoDB
 *
 * Deletes a creator record (and related inquiry records) from one or all environments.
 *
 * Usage:
 *   node scripts/delete-creator.mjs <slug>                # dev only (default)
 *   node scripts/delete-creator.mjs <slug> --env=prod     # single environment
 *   node scripts/delete-creator.mjs <slug> --env=all      # dev, qa, and prod
 *   node scripts/delete-creator.mjs <slug> --dry-run      # preview without deleting
 *
 * Examples:
 *   node scripts/delete-creator.mjs the-newbys --env=all
 *   node scripts/delete-creator.mjs madam-boss --env=prod --dry-run
 *
 * Prerequisites: AWS credentials configured with DynamoDB access
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

// ============================================================================
// Configuration
// ============================================================================

const REGION = "af-south-1";
const ENVIRONMENTS = ["dev", "qa", "prod"];

function getTableName(env) {
  return `263tube-${env}`;
}

// ============================================================================
// Helpers
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const envFlag = args.find((a) => a.startsWith("--env="));
  const env = envFlag ? envFlag.split("=")[1] : "dev";
  const dryRun = args.includes("--dry-run");
  const filtered = args.filter((a) => !a.startsWith("--"));
  const slug = filtered[0];

  return { slug, env, dryRun };
}

function createDocClient() {
  const client = new DynamoDBClient({ region: REGION });
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
    },
  });
}

// ============================================================================
// Core Operations
// ============================================================================

async function getCreator(docClient, tableName, slug) {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { pk: `CREATOR#${slug}`, sk: "METADATA" },
      })
    );
    return result.Item || null;
  } catch {
    return null;
  }
}

async function deleteCreatorRecord(docClient, tableName, slug) {
  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { pk: `CREATOR#${slug}`, sk: "METADATA" },
    })
  );
}

async function findAndDeleteInquiries(docClient, tableName, slug) {
  let deleted = 0;
  let lastKey;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": `INQUIRY#${slug}`,
        },
        ExclusiveStartKey: lastKey,
      })
    );

    for (const item of result.Items || []) {
      await docClient.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { pk: item.pk, sk: item.sk },
        })
      );
      deleted++;
    }

    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return deleted;
}

// ============================================================================
// Main
// ============================================================================

async function deleteFromEnv(docClient, env, slug, dryRun) {
  const tableName = getTableName(env);
  const prefix = `  [${env}]`;

  // Check if creator exists
  const creator = await getCreator(docClient, tableName, slug);

  if (!creator) {
    console.log(`${prefix} Creator "${slug}" not found — skipping`);
    return;
  }

  console.log(`${prefix} Found: ${creator.name || slug} (status: ${creator.status || "unknown"})`);

  if (dryRun) {
    console.log(`${prefix} (dry-run) Would delete creator + inquiries`);
    return;
  }

  // Delete creator record
  await deleteCreatorRecord(docClient, tableName, slug);
  console.log(`${prefix} Deleted creator record`);

  // Delete related inquiry records
  const inquiriesDeleted = await findAndDeleteInquiries(docClient, tableName, slug);
  if (inquiriesDeleted > 0) {
    console.log(`${prefix} Deleted ${inquiriesDeleted} inquiry record(s)`);
  }
}

async function main() {
  const { slug, env, dryRun } = parseArgs();

  if (!slug) {
    console.log(`
263Tube — Delete Creator

Usage:
  node scripts/delete-creator.mjs <slug>                # dev only (default)
  node scripts/delete-creator.mjs <slug> --env=prod     # single environment
  node scripts/delete-creator.mjs <slug> --env=all      # dev, qa, and prod
  node scripts/delete-creator.mjs <slug> --dry-run      # preview without deleting

Examples:
  node scripts/delete-creator.mjs the-newbys --env=all
  node scripts/delete-creator.mjs madam-boss --env=prod --dry-run
`);
    process.exit(1);
  }

  const envs = env === "all" ? ENVIRONMENTS : [env];

  if (!envs.every((e) => ENVIRONMENTS.includes(e))) {
    console.error(`Unknown environment: "${env}". Available: ${ENVIRONMENTS.join(", ")}, all`);
    process.exit(1);
  }

  console.log(`\nDeleting creator: "${slug}"`);
  console.log(`Environments: ${envs.join(", ")}${dryRun ? "  (DRY RUN)" : ""}\n`);

  const docClient = createDocClient();

  for (const e of envs) {
    try {
      await deleteFromEnv(docClient, e, slug, dryRun);
    } catch (err) {
      console.error(`  [${e}] Error: ${err.message}`);
    }
  }

  console.log("\nDone.");
}

main();
