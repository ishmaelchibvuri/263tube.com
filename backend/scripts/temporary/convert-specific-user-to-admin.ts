/**
 * Script to convert a specific user ID to admin role
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Configuration
const USER_ID = "71bcd2c8-e081-705a-73e9-cbed7f7c6424"; // Current logged-in user
const ENVIRONMENT = "dev";
const TABLE_NAME = `exam-platform-data-${ENVIRONMENT}`;

async function convertUserToAdmin(userId: string) {
  console.log("========================================");
  console.log(`Converting user to admin`);
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`User ID: ${userId}`);
  console.log("========================================\n");

  try {
    // Step 1: Get current user profile
    console.log(`1. Fetching user profile...`);
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: "PROFILE",
      },
    });

    const getResult = await docClient.send(getCommand);

    if (!getResult.Item) {
      console.log(`❌ User not found with ID: ${userId}`);
      return;
    }

    const user = getResult.Item;

    console.log(`✅ User found:`);
    console.log(`   - User ID: ${user.userId}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Name: ${user.firstName} ${user.lastName}`);
    console.log(`   - Current Role: ${user.role || "user"}`);

    // Step 2: Check if user is already an admin
    if (user.role === "admin") {
      console.log(`\n⚠️  User is already an admin. No changes needed.`);
      return;
    }

    // Step 3: Update user role to admin
    console.log(`\n2. Updating user role to admin...`);
    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
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

    console.log(`✅ User role updated successfully!`);

    // Step 4: Verify the update
    console.log(`\n3. Verifying update...`);
    const verifyResult = await docClient.send(getCommand);
    const updatedUser = verifyResult.Item;

    if (updatedUser && updatedUser.role === "admin") {
      console.log(`✅ Verification successful!`);
      console.log(`   - User ID: ${updatedUser.userId}`);
      console.log(`   - Email: ${updatedUser.email}`);
      console.log(`   - Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
      console.log(`   - New Role: ${updatedUser.role}`);
      console.log(`   - Updated At: ${updatedUser.updatedAt}`);
    } else {
      console.log(`⚠️  Verification failed - role was not updated correctly`);
    }

    console.log("\n========================================");
    console.log("✅ User conversion to admin completed!");
    console.log("========================================");
  } catch (error) {
    console.error("\n❌ Error converting user to admin:", error);
    throw error;
  }
}

// Run the script
convertUserToAdmin(USER_ID)
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
