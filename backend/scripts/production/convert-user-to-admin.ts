/**
 * Script to convert a user to admin role
 * Usage: ts-node convert-user-to-admin.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Configuration
const EMAIL = "ishmaelchibvuri@gmail.com";
const ENVIRONMENT = "prod"; // Change to 'qa' or 'prod' as needed
const TABLE_NAME = `exam-platform-data-${ENVIRONMENT}`;

async function convertUserToAdmin(email: string) {
  console.log("========================================");
  console.log(`Converting user to admin`);
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Email: ${email}`);
  console.log("========================================\n");

  try {
    // Step 1: Find user by email using GSI1
    console.log(`1. Finding user by email: ${email}`);
    const queryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
      ExpressionAttributeValues: {
        ":pk": "USER",
        ":sk": email,
      },
      Limit: 1,
    });

    const queryResult = await docClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      console.log(`❌ User not found with email: ${email}`);
      return;
    }

    const user = queryResult.Items[0]!;
    const userId = user.userId as string;

    console.log(`✅ User found:`);
    console.log(`   - User ID: ${userId}`);
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
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: "PROFILE",
      },
    });

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
convertUserToAdmin(EMAIL)
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
