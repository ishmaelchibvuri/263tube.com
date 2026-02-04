/**
 * Script to delete the old unused account
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const dynamoClient = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: "af-south-1" });

// Configuration
const OLD_USER_ID = "414c02b8-c0c1-7071-5c1b-c7c74186105a"; // Old account to delete
const ENVIRONMENT = "dev";
const TABLE_NAME = `exam-platform-data-${ENVIRONMENT}`;
const USER_POOL_ID = "af-south-1_FG21EYH08"; // Dev user pool from .env.local

async function deleteOldAccount(userId: string) {
  console.log("========================================");
  console.log(`Deleting old account`);
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`User ID: ${userId}`);
  console.log("========================================\n");

  try {
    // Step 1: Get user profile to see details
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
    console.log(`   - Role: ${user.role || "user"}`);
    console.log(`   - Created: ${user.createdAt}`);

    // Step 2: Query all data for this user
    console.log(`\n2. Finding all user data...`);
    const queryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
      },
    });

    const queryResult = await docClient.send(queryCommand);
    const items = queryResult.Items || [];

    console.log(`✅ Found ${items.length} items to delete`);

    // Step 3: Delete all items
    console.log(`\n3. Deleting all DynamoDB items...`);
    for (const item of items) {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        })
      );
      console.log(`   ✓ Deleted ${item.PK} / ${item.SK}`);
    }

    console.log(`✅ All DynamoDB items deleted`);

    // Step 4: Try to delete from Cognito
    console.log(`\n4. Attempting to delete from Cognito...`);
    try {
      // First check if user exists in Cognito
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId,
      });

      await cognitoClient.send(getUserCommand);
      console.log(`   ✓ User exists in Cognito, proceeding with deletion...`);

      // Delete from Cognito
      const deleteUserCommand = new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId,
      });

      await cognitoClient.send(deleteUserCommand);
      console.log(`✅ User deleted from Cognito`);
    } catch (cognitoError: any) {
      if (cognitoError.name === "UserNotFoundException") {
        console.log(`   ℹ️  User not found in Cognito (already deleted or never existed)`);
      } else {
        console.warn(`   ⚠️  Cognito deletion failed:`, cognitoError.message);
        console.log(`   ℹ️  DynamoDB data was deleted, but Cognito user may still exist`);
      }
    }

    console.log("\n========================================");
    console.log("✅ Old account deletion completed!");
    console.log("========================================");
  } catch (error) {
    console.error("\n❌ Error deleting account:", error);
    throw error;
  }
}

// Run the script
deleteOldAccount(OLD_USER_ID)
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
