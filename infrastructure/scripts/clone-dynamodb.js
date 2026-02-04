const { DynamoDBClient, ScanCommand, BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");
const { CognitoIdentityProviderClient, AdminGetUserCommand, ListUsersCommand } = require("@aws-sdk/client-cognito-identity-provider");

// Accept command line arguments: node clone-dynamodb.js [source-env] [target-env]
const args = process.argv.slice(2);
const SOURCE_ENV = args[0] || "prod";
const TARGET_ENV = args[1] || "dev";

const SOURCE_TABLE = `debtpayoff-data-${SOURCE_ENV}`;
const TARGET_TABLE = `debtpayoff-data-${TARGET_ENV}`;
const REGION = "af-south-1";
const BATCH_SIZE = 25;

// Cognito User Pool IDs for each environment
const USER_POOLS = {
  dev: "af-south-1_RSjx52jna",
  qa: "af-south-1_Z91iNnuPT",
  prod: "af-south-1_4gW5XgZXm",
};

const dynamoClient = new DynamoDBClient({ region: REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

async function scanAllItems(tableName) {
  console.log(`Scanning ${tableName}...`);
  const items = [];
  let lastEvaluatedKey = undefined;
  let batchNum = 0;

  do {
    batchNum++;
    const command = new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await dynamoClient.send(command);
    items.push(...response.Items);
    lastEvaluatedKey = response.LastEvaluatedKey;

    console.log(`  Batch ${batchNum}: Retrieved ${response.Items.length} items (Total: ${items.length})`);
  } while (lastEvaluatedKey);

  return items;
}

async function batchWriteItems(tableName, items) {
  console.log(`Writing ${items.length} items to ${tableName}...`);
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const putRequests = batch.map((item) => ({
      PutRequest: { Item: item },
    }));

    const command = new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: putRequests,
      },
    });

    try {
      const response = await dynamoClient.send(command);

      // Handle unprocessed items
      const unprocessed = response.UnprocessedItems?.[tableName] || [];
      if (unprocessed.length > 0) {
        console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length - unprocessed.length} succeeded, ${unprocessed.length} unprocessed`);
        successCount += batch.length - unprocessed.length;
        failedCount += unprocessed.length;
      } else {
        console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)}: ${batch.length} items written`);
        successCount += batch.length;
      }
    } catch (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: Error - ${error.message}`);
      failedCount += batch.length;
    }

    // Small delay to avoid throttling
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { successCount, failedCount };
}

// Extract unique user IDs from items (format: USER#<userId>)
function extractUniqueUserIds(items) {
  const userIds = new Set();
  for (const item of items) {
    if (item.PK?.S) {
      const match = item.PK.S.match(/USER#([a-f0-9-]+)/);
      if (match) {
        userIds.add(match[1]);
      }
    }
    // Also check GSI keys for user IDs
    for (const key of ["GSI1PK", "GSI2PK"]) {
      if (item[key]?.S) {
        const match = item[key].S.match(/([a-f0-9-]{36})/);
        if (match) {
          userIds.add(match[1]);
        }
      }
    }
  }
  return Array.from(userIds);
}

// Get user email from Cognito by user ID
async function getUserEmail(userPoolId, userId) {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: userId,
    });
    const response = await cognitoClient.send(command);
    const emailAttr = response.UserAttributes?.find((attr) => attr.Name === "email");
    return emailAttr?.Value || null;
  } catch (error) {
    console.log(`    Could not find user ${userId} in source pool: ${error.message}`);
    return null;
  }
}

// Find user ID by email in target Cognito pool
async function findUserByEmail(userPoolId, email) {
  try {
    const command = new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: `email = "${email}"`,
      Limit: 1,
    });
    const response = await cognitoClient.send(command);
    if (response.Users && response.Users.length > 0) {
      return response.Users[0].Username;
    }
    return null;
  } catch (error) {
    console.log(`    Could not find user with email ${email} in target pool: ${error.message}`);
    return null;
  }
}

// Build user ID mapping between source and target environments
async function buildUserIdMapping(userIds, sourceEnv, targetEnv) {
  console.log(`\nBuilding user ID mapping (${sourceEnv} -> ${targetEnv})...`);
  const mapping = {};
  const sourcePoolId = USER_POOLS[sourceEnv];
  const targetPoolId = USER_POOLS[targetEnv];

  if (!sourcePoolId || !targetPoolId) {
    console.log("  Warning: Could not find user pool IDs for environments");
    return mapping;
  }

  for (const userId of userIds) {
    console.log(`  Processing user: ${userId}`);

    // Get email from source Cognito
    const email = await getUserEmail(sourcePoolId, userId);
    if (!email) {
      console.log(`    Skipping - no email found in source`);
      continue;
    }
    console.log(`    Found email: ${email}`);

    // Find user in target Cognito by email
    const targetUserId = await findUserByEmail(targetPoolId, email);
    if (!targetUserId) {
      console.log(`    Warning: User not found in target environment`);
      continue;
    }

    if (userId !== targetUserId) {
      mapping[userId] = targetUserId;
      console.log(`    Mapped: ${userId} -> ${targetUserId}`);
    } else {
      console.log(`    Same ID in both environments`);
    }

    // Small delay to avoid Cognito rate limiting
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return mapping;
}

// Remap user IDs in an item
function remapItemUserIds(item, mapping) {
  const newItem = {};

  for (const [key, value] of Object.entries(item)) {
    if (value.S) {
      let newValue = value.S;
      for (const [oldId, newId] of Object.entries(mapping)) {
        newValue = newValue.replace(new RegExp(oldId, "g"), newId);
      }
      newItem[key] = { S: newValue };
    } else if (value.N) {
      newItem[key] = { N: value.N };
    } else if (value.BOOL !== undefined) {
      newItem[key] = { BOOL: value.BOOL };
    } else if (value.L) {
      newItem[key] = { L: value.L };
    } else if (value.M) {
      newItem[key] = { M: value.M };
    } else if (value.NULL) {
      newItem[key] = { NULL: true };
    } else {
      newItem[key] = value;
    }
  }

  return newItem;
}

async function main() {
  console.log("=".repeat(60));
  console.log(`Cloning DynamoDB: ${SOURCE_TABLE} -> ${TARGET_TABLE}`);
  console.log(`Region: ${REGION}`);
  console.log(`User ID remapping: Enabled`);
  console.log("=".repeat(60));
  console.log();

  try {
    // Step 1: Export from source
    console.log("Step 1: Exporting data from source table...");
    const items = await scanAllItems(SOURCE_TABLE);
    console.log(`Total items to clone: ${items.length}\n`);

    if (items.length === 0) {
      console.log("No items to clone. Source table is empty.");
      return;
    }

    // Step 2: Extract unique user IDs and build mapping
    console.log("Step 2: Building user ID mapping...");
    const userIds = extractUniqueUserIds(items);
    console.log(`Found ${userIds.length} unique user(s) in source data`);

    const userIdMapping = await buildUserIdMapping(userIds, SOURCE_ENV, TARGET_ENV);
    const mappingCount = Object.keys(userIdMapping).length;
    console.log(`\nUser ID mappings created: ${mappingCount}`);

    // Step 3: Remap user IDs in items
    let remappedItems = items;
    if (mappingCount > 0) {
      console.log("\nStep 3: Remapping user IDs in data...");
      remappedItems = items.map((item) => remapItemUserIds(item, userIdMapping));
      console.log(`  Remapped ${items.length} items`);
    } else {
      console.log("\nStep 3: No user ID remapping needed");
    }

    // Step 4: Import to target
    console.log("\nStep 4: Importing data to target table...");
    const { successCount, failedCount } = await batchWriteItems(TARGET_TABLE, remappedItems);

    console.log();
    console.log("=".repeat(60));
    console.log("Clone completed!");
    console.log(`  Source: ${SOURCE_TABLE}`);
    console.log(`  Target: ${TARGET_TABLE}`);
    console.log(`  Items cloned: ${successCount}`);
    console.log(`  Users remapped: ${mappingCount}`);
    if (failedCount > 0) {
      console.log(`  Items failed: ${failedCount}`);
    }
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
