const {
  DynamoDBClient,
  QueryCommand,
  BatchWriteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

// Load from environment or use default
const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";
const USER_POOL_ID = process.env.USER_POOL_ID;
const AWS_REGION = process.env.AWS_REGION || process.env.REGION || "af-south-1";

// Create AWS clients with correct region
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

// Users to delete
const USERS_TO_DELETE = [
  "support@activewave.co.za",
];

/**
 * Get user profile by email
 */
async function getUserByEmail(email) {
  console.log(`\n🔍 Looking up user: ${email}`);

  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
    ExpressionAttributeValues: {
      ":pk": { S: "USER" },
      ":sk": { S: email },
    },
  });

  const response = await dynamoClient.send(command);

  if (!response.Items || response.Items.length === 0) {
    console.log(`❌ User not found: ${email}`);
    return null;
  }

  const user = unmarshall(response.Items[0]);
  console.log(`✅ Found user: ${user.userId} (${user.email})`);
  return user;
}

/**
 * Get all items for a user (attempts, stats, purchases, etc.)
 */
async function getUserItems(userId) {
  console.log(`\n📦 Fetching all data for user: ${userId}`);

  const items = [];
  let lastEvaluatedKey = undefined;

  do {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: `USER#${userId}` },
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await dynamoClient.send(command);

    if (response.Items && response.Items.length > 0) {
      const unmarshalled = response.Items.map((item) => unmarshall(item));
      items.push(...unmarshalled);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`✅ Found ${items.length} items for user ${userId}`);

  // Log item types
  const itemTypes = items.reduce((acc, item) => {
    const type = item.entityType || "UNKNOWN";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  console.log("📊 Item breakdown:");
  Object.entries(itemTypes).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`);
  });

  return items;
}

/**
 * Delete items in batches
 */
async function deleteItemsBatch(items) {
  if (items.length === 0) return;

  const BATCH_SIZE = 25; // DynamoDB BatchWrite limit

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    const deleteRequests = batch.map((item) => ({
      DeleteRequest: {
        Key: {
          PK: { S: item.PK },
          SK: { S: item.SK },
        },
      },
    }));

    const command = new BatchWriteItemCommand({
      RequestItems: {
        [TABLE_NAME]: deleteRequests,
      },
    });

    await dynamoClient.send(command);
    console.log(
      `   ✅ Deleted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items)`
    );
  }
}

/**
 * Delete user from Cognito
 */
async function deleteUserFromCognito(email) {
  if (!USER_POOL_ID) {
    console.log("⚠️  No USER_POOL_ID set, skipping Cognito deletion");
    return;
  }

  console.log(`\n🗑️  Deleting user from Cognito: ${email}`);

  try {
    const command = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    console.log(`✅ User deleted from Cognito: ${email}`);
  } catch (error) {
    if (error.name === "UserNotFoundException") {
      console.log(`⚠️  User not found in Cognito: ${email}`);
    } else {
      console.error(`❌ Failed to delete from Cognito:`, error.message);
      throw error;
    }
  }
}

/**
 * Delete a single user and all their data
 */
async function deleteUser(email) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🗑️  DELETING USER: ${email}`);
  console.log(`${"=".repeat(60)}`);

  // Step 1: Get user by email
  const user = await getUserByEmail(email);

  if (!user) {
    console.log(`⚠️  User not found in database: ${email}`);
    console.log(`   Checking Cognito anyway...`);
    await deleteUserFromCognito(email);
    return;
  }

  const userId = user.userId;

  // Step 2: Get all user data from DynamoDB
  const items = await getUserItems(userId);

  // Step 3: Delete all items from DynamoDB
  console.log(`\n🗑️  Deleting ${items.length} items from DynamoDB...`);
  await deleteItemsBatch(items);
  console.log(`✅ All DynamoDB items deleted for ${email}`);

  // Step 4: Delete user from Cognito
  await deleteUserFromCognito(email);

  console.log(`\n✅ USER COMPLETELY DELETED: ${email}`);
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 USER DELETION SCRIPT`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`User Pool: ${USER_POOL_ID || "Not set"}`);
  console.log(`Users to delete: ${USERS_TO_DELETE.length}`);
  console.log(`${"=".repeat(60)}\n`);

  for (const email of USERS_TO_DELETE) {
    try {
      await deleteUser(email);
    } catch (error) {
      console.error(`\n❌ Failed to delete user ${email}:`, error.message);
      console.error(error);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ DELETION COMPLETE`);
  console.log(`${"=".repeat(60)}\n`);
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
