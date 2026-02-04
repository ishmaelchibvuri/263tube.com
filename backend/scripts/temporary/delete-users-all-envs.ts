import {
  DynamoDBClient,
  QueryCommand,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { unmarshall } from "@aws-sdk/util-dynamodb";

// Environment configurations
const ENVIRONMENTS = {
  dev: {
    tableName: "exam-platform-data-dev",
    userPoolId: "af-south-1_DujUfW9wf",
  },
  qa: {
    tableName: "exam-platform-data-qa",
    userPoolId: "af-south-1_fcKpAgQe3",
  },
  prod: {
    tableName: "exam-platform-data-prod",
    userPoolId: "af-south-1_MxhGAZIEL",
  },
};

// Users to delete - from users.txt
const USERS_TO_DELETE = [
  "famous.ronin@moonfee.com",
  "tj.parv@moonfee.com",
  "Chibvuriesther@gmail.com",
  "me@you.comd",
  "maverick.hung@moonfee.com",
  "kinzy.makhyla@moonfee.com",
  "velma.shelsey@moonfee.com",
  "maynor.virgilio@moonfee.com",
  "malka.elaya@moonfee.com",
  "sigourney.aylinne@moonfee.com",
  "benjamyn.jamesmichael@moonfee.com",
  "jayven.johncarlos@moonfee.com",
];

interface DynamoItem {
  PK: string;
  SK: string;
  [key: string]: any;
}

interface DeletionResult {
  email: string;
  environment: string;
  dynamoItemsDeleted: number;
  cognitoDeleted: boolean;
  error?: string;
}

const dynamoClient = new DynamoDBClient({ region: "af-south-1" });
const cognitoClient = new CognitoIdentityProviderClient({
  region: "af-south-1",
});

/**
 * Get user profile by email
 */
async function getUserByEmail(
  email: string,
  tableName: string
): Promise<any | null> {
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
    ExpressionAttributeValues: {
      ":pk": { S: "USER" },
      ":sk": { S: email },
    },
  });

  const response = await dynamoClient.send(command);

  if (!response.Items || response.Items.length === 0) {
    return null;
  }

  const firstItem = response.Items[0];
  if (!firstItem) {
    return null;
  }

  return unmarshall(firstItem);
}

/**
 * Get all items for a user (attempts, stats, purchases, etc.)
 */
async function getUserItems(
  userId: string,
  tableName: string
): Promise<DynamoItem[]> {
  const items: DynamoItem[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: `USER#${userId}` },
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await dynamoClient.send(command);

    if (response.Items && response.Items.length > 0) {
      const unmarshalled = response.Items.map((item) =>
        unmarshall(item)
      ) as DynamoItem[];
      items.push(...unmarshalled);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

/**
 * Delete items in batches
 */
async function deleteItemsBatch(
  items: DynamoItem[],
  tableName: string
): Promise<number> {
  if (items.length === 0) return 0;

  const BATCH_SIZE = 25; // DynamoDB BatchWrite limit
  let deletedCount = 0;

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
        [tableName]: deleteRequests,
      },
    });

    await dynamoClient.send(command);
    deletedCount += batch.length;
  }

  return deletedCount;
}

/**
 * Delete user from Cognito
 */
async function deleteUserFromCognito(
  email: string,
  userPoolId: string
): Promise<boolean> {
  try {
    const command = new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: email,
    });

    await cognitoClient.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "UserNotFoundException") {
      return false; // User not found is not an error
    }
    throw error;
  }
}

/**
 * Delete a single user from a single environment
 */
async function deleteUserFromEnvironment(
  email: string,
  envName: string,
  config: { tableName: string; userPoolId: string }
): Promise<DeletionResult> {
  const result: DeletionResult = {
    email,
    environment: envName,
    dynamoItemsDeleted: 0,
    cognitoDeleted: false,
  };

  try {
    // Step 1: Get user by email from DynamoDB
    const user = await getUserByEmail(email, config.tableName);

    if (user) {
      const userId = user.userId;

      // Step 2: Get all user data from DynamoDB
      const items = await getUserItems(userId, config.tableName);

      // Step 3: Delete all items from DynamoDB
      result.dynamoItemsDeleted = await deleteItemsBatch(
        items,
        config.tableName
      );
    }

    // Step 4: Delete user from Cognito (even if not in DynamoDB)
    result.cognitoDeleted = await deleteUserFromCognito(
      email,
      config.userPoolId
    );

    return result;
  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`   USER DELETION SCRIPT - ALL ENVIRONMENTS (DEV, QA, PROD)`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Users to delete: ${USERS_TO_DELETE.length}`);
  console.log(`Environments: dev, qa, prod`);
  console.log(`${"=".repeat(70)}\n`);

  const allResults: DeletionResult[] = [];
  const summary = {
    dev: { users: 0, dynamoItems: 0, cognitoUsers: 0, errors: 0 },
    qa: { users: 0, dynamoItems: 0, cognitoUsers: 0, errors: 0 },
    prod: { users: 0, dynamoItems: 0, cognitoUsers: 0, errors: 0 },
  };

  // Process each environment
  for (const [envName, config] of Object.entries(ENVIRONMENTS)) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`   PROCESSING ENVIRONMENT: ${envName.toUpperCase()}`);
    console.log(`   Table: ${config.tableName}`);
    console.log(`   User Pool: ${config.userPoolId}`);
    console.log(`${"=".repeat(70)}`);

    for (const email of USERS_TO_DELETE) {
      console.log(`\n   Deleting: ${email}`);

      const result = await deleteUserFromEnvironment(email, envName, config);
      allResults.push(result);

      if (result.error) {
        console.log(`      ERROR: ${result.error}`);
        summary[envName as keyof typeof summary].errors++;
      } else {
        console.log(`      DynamoDB items deleted: ${result.dynamoItemsDeleted}`);
        console.log(
          `      Cognito user deleted: ${result.cognitoDeleted ? "Yes" : "No (not found)"}`
        );

        summary[envName as keyof typeof summary].users++;
        summary[envName as keyof typeof summary].dynamoItems +=
          result.dynamoItemsDeleted;
        if (result.cognitoDeleted) {
          summary[envName as keyof typeof summary].cognitoUsers++;
        }
      }
    }
  }

  // Print summary
  console.log(`\n${"=".repeat(70)}`);
  console.log(`   DELETION SUMMARY`);
  console.log(`${"=".repeat(70)}`);

  for (const [envName, stats] of Object.entries(summary)) {
    console.log(`\n   ${envName.toUpperCase()}:`);
    console.log(`      Users processed: ${stats.users}`);
    console.log(`      DynamoDB items deleted: ${stats.dynamoItems}`);
    console.log(`      Cognito users deleted: ${stats.cognitoUsers}`);
    if (stats.errors > 0) {
      console.log(`      Errors: ${stats.errors}`);
    }
  }

  // Total summary
  const totalDynamoItems = Object.values(summary).reduce(
    (sum, s) => sum + s.dynamoItems,
    0
  );
  const totalCognitoUsers = Object.values(summary).reduce(
    (sum, s) => sum + s.cognitoUsers,
    0
  );
  const totalErrors = Object.values(summary).reduce(
    (sum, s) => sum + s.errors,
    0
  );

  console.log(`\n   TOTALS ACROSS ALL ENVIRONMENTS:`);
  console.log(`      Total DynamoDB items deleted: ${totalDynamoItems}`);
  console.log(`      Total Cognito users deleted: ${totalCognitoUsers}`);
  console.log(`      Total errors: ${totalErrors}`);

  console.log(`\n${"=".repeat(70)}`);
  console.log(`   DELETION COMPLETE`);
  console.log(`${"=".repeat(70)}\n`);

  // Return non-zero exit code if there were errors
  if (totalErrors > 0) {
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("\n   Fatal error:", error);
  process.exit(1);
});
