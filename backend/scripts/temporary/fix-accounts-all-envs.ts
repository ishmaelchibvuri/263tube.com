/**
 * Script to fix accounts across all environments
 * - Convert current user to admin
 * - Delete old unused user
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Configuration
const CURRENT_USER_ID = "71bcd2c8-e081-705a-73e9-cbed7f7c6424"; // Keep and make admin
const OLD_USER_ID = "414c02b8-c0c1-7071-5c1b-c7c74186105a"; // Delete this one
const ENVIRONMENTS = ["qa", "prod"];

async function convertToAdmin(userId: string, environment: string) {
  const tableName = `exam-platform-data-${environment}`;

  console.log(`\n📝 Converting ${userId} to admin in ${environment}...`);

  try {
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: "PROFILE",
      },
    });

    const getResult = await docClient.send(getCommand);

    if (!getResult.Item) {
      console.log(`   ⚠️  User not found in ${environment}`);
      return false;
    }

    const user = getResult.Item;
    console.log(`   ✓ Found: ${user.email} (role: ${user.role})`);

    if (user.role === "admin") {
      console.log(`   ℹ️  Already admin, skipping`);
      return true;
    }

    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: "PROFILE",
      },
      UpdateExpression: "SET #role = :role, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#role": "role",
      },
      ExpressionAttributeValues: {
        ":role": "admin",
        ":updatedAt": new Date().toISOString(),
      },
    });

    await docClient.send(updateCommand);
    console.log(`   ✅ Converted to admin`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }
}

async function deleteUser(userId: string, environment: string) {
  const tableName = `exam-platform-data-${environment}`;

  console.log(`\n🗑️  Deleting ${userId} from ${environment}...`);

  try {
    // Get user profile first
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: "PROFILE",
      },
    });

    const getResult = await docClient.send(getCommand);

    if (!getResult.Item) {
      console.log(`   ℹ️  User not found in ${environment} (already deleted)`);
      return true;
    }

    const user = getResult.Item;
    console.log(`   ✓ Found: ${user.email}`);

    // Query all items for this user
    const queryCommand = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
      },
    });

    const queryResult = await docClient.send(queryCommand);
    const items = queryResult.Items || [];

    console.log(`   ✓ Found ${items.length} items to delete`);

    // Delete all items
    for (const item of items) {
      await docClient.send(
        new DeleteCommand({
          TableName: tableName,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        })
      );
    }

    console.log(`   ✅ Deleted all items`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }
}

async function processEnvironment(env: string) {
  console.log("\n========================================");
  console.log(`Processing ${env.toUpperCase()} environment`);
  console.log("========================================");

  // Convert current user to admin
  await convertToAdmin(CURRENT_USER_ID, env);

  // Delete old user
  await deleteUser(OLD_USER_ID, env);
}

async function main() {
  console.log("========================================");
  console.log("Fixing accounts across all environments");
  console.log("========================================");
  console.log(`Current user (keep as admin): ${CURRENT_USER_ID}`);
  console.log(`Old user (delete): ${OLD_USER_ID}`);

  for (const env of ENVIRONMENTS) {
    await processEnvironment(env);
  }

  console.log("\n========================================");
  console.log("✅ All environments processed!");
  console.log("========================================");
  console.log("\nSummary:");
  console.log("- Current user (71bcd2c8...) is now admin in QA and PROD");
  console.log("- Old user (414c02b8...) has been deleted from QA and PROD");
}

// Run the script
main()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
