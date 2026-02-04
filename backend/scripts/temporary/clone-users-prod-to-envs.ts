import {
  DynamoDBClient,
  QueryCommand,
  BatchWriteItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";

// Environment configurations
const ENVIRONMENTS = {
  prod: {
    tableName: "exam-platform-data-prod",
    userPoolId: "af-south-1_MxhGAZIEL",
  },
  qa: {
    tableName: "exam-platform-data-qa",
    userPoolId: "af-south-1_fcKpAgQe3",
  },
  dev: {
    tableName: "exam-platform-data-dev",
    userPoolId: "af-south-1_DujUfW9wf",
  },
};

// Users to clone from PROD
const USERS_TO_CLONE = [
  "ishmaelchibvuri@gmail.com",
  "kohyn.rogen@moonfee.com",
  "arpan.maxi@moonfee.com",
  "liandro.eland@moonfee.com",
];

// Default password for cloned users (they will need to reset on first login)
const DEFAULT_PASSWORD = "TempPass123!";

interface DynamoItem {
  PK: string;
  SK: string;
  [key: string]: any;
}

interface CognitoUserAttributes {
  email: string;
  givenName?: string;
  familyName?: string;
  [key: string]: string | undefined;
}

interface CloneResult {
  email: string;
  targetEnv: string;
  dynamoItemsCloned: number;
  cognitoCreated: boolean;
  error?: string;
}

const dynamoClient = new DynamoDBClient({ region: "af-south-1" });
const cognitoClient = new CognitoIdentityProviderClient({
  region: "af-south-1",
});

/**
 * Get user profile by email from source environment
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
 * Get all items for a user from source environment
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
 * Get Cognito user attributes
 */
async function getCognitoUserAttributes(
  email: string,
  userPoolId: string
): Promise<CognitoUserAttributes | null> {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: email,
    });

    const response = await cognitoClient.send(command);

    if (!response.UserAttributes) {
      return null;
    }

    const attributes: CognitoUserAttributes = { email };

    for (const attr of response.UserAttributes) {
      if (attr.Name === "given_name") {
        attributes.givenName = attr.Value;
      } else if (attr.Name === "family_name") {
        attributes.familyName = attr.Value;
      } else if (attr.Name === "email") {
        attributes.email = attr.Value || email;
      } else if (attr.Name === "custom:role") {
        attributes["custom:role"] = attr.Value;
      } else if (attr.Name === "custom:showOnLeaderboard") {
        attributes["custom:showOnLeaderboard"] = attr.Value;
      }
    }

    return attributes;
  } catch (error: any) {
    if (error.name === "UserNotFoundException") {
      return null;
    }
    throw error;
  }
}

/**
 * Create user in Cognito
 */
async function createCognitoUser(
  attributes: CognitoUserAttributes,
  userPoolId: string
): Promise<boolean> {
  try {
    // Build user attributes array
    const userAttributes = [
      { Name: "email", Value: attributes.email },
      { Name: "email_verified", Value: "true" },
    ];

    if (attributes.givenName) {
      userAttributes.push({ Name: "given_name", Value: attributes.givenName });
    }
    if (attributes.familyName) {
      userAttributes.push({
        Name: "family_name",
        Value: attributes.familyName,
      });
    }
    if (attributes["custom:role"]) {
      userAttributes.push({
        Name: "custom:role",
        Value: attributes["custom:role"],
      });
    }
    if (attributes["custom:showOnLeaderboard"]) {
      userAttributes.push({
        Name: "custom:showOnLeaderboard",
        Value: attributes["custom:showOnLeaderboard"],
      });
    }

    // Create the user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: attributes.email,
      UserAttributes: userAttributes,
      MessageAction: MessageActionType.SUPPRESS, // Don't send welcome email
      TemporaryPassword: DEFAULT_PASSWORD,
    });

    await cognitoClient.send(createCommand);

    // Set permanent password so user doesn't need to change it
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: attributes.email,
      Password: DEFAULT_PASSWORD,
      Permanent: true,
    });

    await cognitoClient.send(setPasswordCommand);

    return true;
  } catch (error: any) {
    if (error.name === "UsernameExistsException") {
      console.log(`      User already exists in Cognito, skipping...`);
      return false;
    }
    throw error;
  }
}

/**
 * Write items to target DynamoDB table in batches
 */
async function writeItemsBatch(
  items: DynamoItem[],
  tableName: string
): Promise<number> {
  if (items.length === 0) return 0;

  const BATCH_SIZE = 25;
  let writtenCount = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    const putRequests = batch.map((item) => ({
      PutRequest: {
        Item: marshall(item, { removeUndefinedValues: true }),
      },
    }));

    const command = new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: putRequests,
      },
    });

    await dynamoClient.send(command);
    writtenCount += batch.length;
  }

  return writtenCount;
}

/**
 * Clone a single user to a target environment
 */
async function cloneUserToEnvironment(
  email: string,
  sourceConfig: { tableName: string; userPoolId: string },
  targetEnvName: string,
  targetConfig: { tableName: string; userPoolId: string },
  cachedUserData?: { items: DynamoItem[]; cognitoAttrs: CognitoUserAttributes | null }
): Promise<CloneResult> {
  const result: CloneResult = {
    email,
    targetEnv: targetEnvName,
    dynamoItemsCloned: 0,
    cognitoCreated: false,
  };

  try {
    let items: DynamoItem[];
    let cognitoAttrs: CognitoUserAttributes | null;

    // Use cached data if provided
    if (cachedUserData) {
      items = cachedUserData.items;
      cognitoAttrs = cachedUserData.cognitoAttrs;
    } else {
      // Get user from source
      const user = await getUserByEmail(email, sourceConfig.tableName);
      if (!user) {
        result.error = "User not found in source database";
        return result;
      }

      items = await getUserItems(user.userId, sourceConfig.tableName);
      cognitoAttrs = await getCognitoUserAttributes(email, sourceConfig.userPoolId);
    }

    // Clone DynamoDB items to target
    result.dynamoItemsCloned = await writeItemsBatch(items, targetConfig.tableName);

    // Clone Cognito user to target
    if (cognitoAttrs) {
      result.cognitoCreated = await createCognitoUser(cognitoAttrs, targetConfig.userPoolId);
    }

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
  console.log(`   CLONE USERS FROM PROD TO QA AND DEV`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Users to clone: ${USERS_TO_CLONE.length}`);
  console.log(`Source: PROD`);
  console.log(`Targets: QA, DEV`);
  console.log(`Default password for cloned Cognito users: ${DEFAULT_PASSWORD}`);
  console.log(`${"=".repeat(70)}\n`);

  const allResults: CloneResult[] = [];
  const summary = {
    qa: { users: 0, dynamoItems: 0, cognitoUsers: 0, errors: 0 },
    dev: { users: 0, dynamoItems: 0, cognitoUsers: 0, errors: 0 },
  };

  // Process each user
  for (const email of USERS_TO_CLONE) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`   CLONING USER: ${email}`);
    console.log(`${"=".repeat(70)}`);

    // First, fetch user data from PROD (cache it for both targets)
    console.log(`\n   Fetching from PROD...`);
    const user = await getUserByEmail(email, ENVIRONMENTS.prod.tableName);

    if (!user) {
      console.log(`   ERROR: User not found in PROD database`);
      allResults.push({
        email,
        targetEnv: "qa",
        dynamoItemsCloned: 0,
        cognitoCreated: false,
        error: "User not found in PROD",
      });
      allResults.push({
        email,
        targetEnv: "dev",
        dynamoItemsCloned: 0,
        cognitoCreated: false,
        error: "User not found in PROD",
      });
      summary.qa.errors++;
      summary.dev.errors++;
      continue;
    }

    const items = await getUserItems(user.userId, ENVIRONMENTS.prod.tableName);
    const cognitoAttrs = await getCognitoUserAttributes(
      email,
      ENVIRONMENTS.prod.userPoolId
    );

    console.log(`   Found ${items.length} DynamoDB items`);
    console.log(`   Cognito user: ${cognitoAttrs ? "Yes" : "No"}`);

    // Log item types
    const itemTypes = items.reduce((acc, item) => {
      const type = item.entityType || item.SK?.split("#")[0] || "UNKNOWN";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`   Item breakdown:`);
    Object.entries(itemTypes).forEach(([type, count]) => {
      console.log(`      - ${type}: ${count}`);
    });

    // Clone to QA
    console.log(`\n   Cloning to QA...`);
    const qaResult = await cloneUserToEnvironment(
      email,
      ENVIRONMENTS.prod,
      "qa",
      ENVIRONMENTS.qa,
      { items, cognitoAttrs }
    );
    allResults.push(qaResult);

    if (qaResult.error) {
      console.log(`      ERROR: ${qaResult.error}`);
      summary.qa.errors++;
    } else {
      console.log(`      DynamoDB items cloned: ${qaResult.dynamoItemsCloned}`);
      console.log(
        `      Cognito user created: ${qaResult.cognitoCreated ? "Yes" : "No (already exists)"}`
      );
      summary.qa.users++;
      summary.qa.dynamoItems += qaResult.dynamoItemsCloned;
      if (qaResult.cognitoCreated) {
        summary.qa.cognitoUsers++;
      }
    }

    // Clone to DEV
    console.log(`\n   Cloning to DEV...`);
    const devResult = await cloneUserToEnvironment(
      email,
      ENVIRONMENTS.prod,
      "dev",
      ENVIRONMENTS.dev,
      { items, cognitoAttrs }
    );
    allResults.push(devResult);

    if (devResult.error) {
      console.log(`      ERROR: ${devResult.error}`);
      summary.dev.errors++;
    } else {
      console.log(`      DynamoDB items cloned: ${devResult.dynamoItemsCloned}`);
      console.log(
        `      Cognito user created: ${devResult.cognitoCreated ? "Yes" : "No (already exists)"}`
      );
      summary.dev.users++;
      summary.dev.dynamoItems += devResult.dynamoItemsCloned;
      if (devResult.cognitoCreated) {
        summary.dev.cognitoUsers++;
      }
    }
  }

  // Print summary
  console.log(`\n${"=".repeat(70)}`);
  console.log(`   CLONING SUMMARY`);
  console.log(`${"=".repeat(70)}`);

  for (const [envName, stats] of Object.entries(summary)) {
    console.log(`\n   ${envName.toUpperCase()}:`);
    console.log(`      Users cloned: ${stats.users}`);
    console.log(`      DynamoDB items cloned: ${stats.dynamoItems}`);
    console.log(`      Cognito users created: ${stats.cognitoUsers}`);
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

  console.log(`\n   TOTALS:`);
  console.log(`      Total DynamoDB items cloned: ${totalDynamoItems}`);
  console.log(`      Total Cognito users created: ${totalCognitoUsers}`);
  console.log(`      Total errors: ${totalErrors}`);

  console.log(`\n${"=".repeat(70)}`);
  console.log(`   CLONING COMPLETE`);
  console.log(`${"=".repeat(70)}`);
  console.log(`\n   NOTE: Cloned Cognito users have password: ${DEFAULT_PASSWORD}`);
  console.log(`   Users may need to reset their password on first login.\n`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("\n   Fatal error:", error);
  process.exit(1);
});
