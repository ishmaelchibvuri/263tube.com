import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchWriteCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Get source and target from command line arguments
const args = process.argv.slice(2);
const sourceArg = args.find(arg => arg.startsWith("--source="));
const targetArg = args.find(arg => arg.startsWith("--target="));
const skipDeleteArg = args.includes("--skip-delete");

if (!sourceArg || !targetArg) {
  console.error("Usage: ts-node clone-database.ts --source=dev --target=qa [--skip-delete]");
  console.error("Example: ts-node clone-database.ts --source=dev --target=qa");
  process.exit(1);
}

const sourceEnv = sourceArg.split("=")[1];
const targetEnv = targetArg.split("=")[1];

const SOURCE_TABLE = `exam-platform-data-${sourceEnv}`;
const TARGET_TABLE = `exam-platform-data-${targetEnv}`;

async function scanAllItems(tableName: string): Promise<any[]> {
  console.log(`📖 Scanning all items from ${tableName}...`);

  let items: any[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;
  let scanCount = 0;

  do {
    const command = new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const result = await docClient.send(command);
    items = items.concat(result.Items || []);
    lastEvaluatedKey = result.LastEvaluatedKey;
    scanCount++;

    console.log(`   Scan ${scanCount}: Retrieved ${result.Items?.length || 0} items (Total: ${items.length})`);
  } while (lastEvaluatedKey);

  console.log(`   ✅ Total items scanned: ${items.length}`);
  return items;
}

async function deleteAllItems(tableName: string): Promise<void> {
  console.log(`🗑️  Deleting all items from ${tableName}...`);

  const items = await scanAllItems(tableName);

  if (items.length === 0) {
    console.log("   No items to delete");
    return;
  }

  // Delete in batches of 25 (DynamoDB limit)
  const batchSize = 25;
  let deletedCount = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const deleteRequests = batch.map(item => ({
      DeleteRequest: {
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      },
    }));

    const command = new BatchWriteCommand({
      RequestItems: {
        [tableName]: deleteRequests,
      },
    });

    await docClient.send(command);
    deletedCount += batch.length;

    if (deletedCount % 100 === 0 || deletedCount === items.length) {
      console.log(`   Deleted ${deletedCount}/${items.length} items`);
    }
  }

  console.log(`   ✅ Deleted all ${items.length} items`);
}

async function writeItems(tableName: string, items: any[]): Promise<void> {
  console.log(`📝 Writing ${items.length} items to ${tableName}...`);

  // Write in batches of 25 (DynamoDB limit)
  const batchSize = 25;
  let writtenCount = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const putRequests = batch.map(item => ({
      PutRequest: {
        Item: item,
      },
    }));

    const command = new BatchWriteCommand({
      RequestItems: {
        [tableName]: putRequests,
      },
    });

    await docClient.send(command);
    writtenCount += batch.length;

    if (writtenCount % 500 === 0 || writtenCount === items.length) {
      console.log(`   Written ${writtenCount}/${items.length} items`);
    }
  }

  console.log(`   ✅ Written all ${items.length} items`);
}

async function main() {
  console.log("🚀 Database Clone Script");
  console.log(`📊 Source: ${SOURCE_TABLE}`);
  console.log(`📊 Target: ${TARGET_TABLE}`);
  console.log("");

  if (sourceEnv === targetEnv) {
    console.error("❌ Source and target cannot be the same!");
    process.exit(1);
  }

  // Safety check for production
  if (targetEnv === "prod") {
    console.error("❌ WARNING: Refusing to overwrite production database!");
    console.error("   If you really want to do this, modify the script.");
    process.exit(1);
  }

  try {
    // Step 1: Scan all items from source
    const sourceItems = await scanAllItems(SOURCE_TABLE);
    console.log("");

    if (sourceItems.length === 0) {
      console.error("❌ No items found in source database!");
      process.exit(1);
    }

    // Step 2: Delete all items from target (unless skipped)
    if (!skipDeleteArg) {
      await deleteAllItems(TARGET_TABLE);
      console.log("");
    } else {
      console.log("⏭️  Skipping delete (--skip-delete flag set)");
      console.log("");
    }

    // Step 3: Write all items to target
    await writeItems(TARGET_TABLE, sourceItems);
    console.log("");

    // Summary
    console.log("🎉 Database clone completed successfully!");
    console.log("");
    console.log("📊 Summary:");
    console.log(`   - Items cloned: ${sourceItems.length}`);
    console.log(`   - Source: ${SOURCE_TABLE}`);
    console.log(`   - Target: ${TARGET_TABLE}`);

    // Count different entity types
    const entityCounts: Record<string, number> = {};
    for (const item of sourceItems) {
      const entityType = item.entityType || "Unknown";
      entityCounts[entityType] = (entityCounts[entityType] || 0) + 1;
    }

    console.log("\n📋 Entity breakdown:");
    for (const [type, count] of Object.entries(entityCounts).sort()) {
      console.log(`   - ${type}: ${count}`);
    }

  } catch (error) {
    console.error("❌ Clone failed:", error);
    process.exit(1);
  }
}

main();
