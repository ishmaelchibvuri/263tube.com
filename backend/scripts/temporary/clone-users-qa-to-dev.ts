import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  MessageActionType,
  UserType,
} from "@aws-sdk/client-cognito-identity-provider";

// Environment configurations
const ENVIRONMENTS = {
  qa: {
    tableName: "exam-platform-data-qa",
    userPoolId: "af-south-1_7H3fSbzTl",
  },
  dev: {
    tableName: "exam-platform-data-dev",
    userPoolId: "af-south-1_1lk5A2Q5n",
  },
};

// Default password for cloned users
const DEFAULT_PASSWORD = "TempPass123!";

const dynamoClient = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({
  region: "af-south-1",
});

interface CognitoUserAttributes {
  email: string;
  givenName?: string;
  familyName?: string;
  emailVerified?: string;
  [key: string]: string | undefined;
}

interface CloneResult {
  email: string;
  cognitoCreated: boolean;
  error?: string;
}

/**
 * List all users from source Cognito pool
 */
async function listAllCognitoUsers(
  userPoolId: string
): Promise<UserType[]> {
  console.log(`📋 Listing all users from Cognito pool...`);

  const users: UserType[] = [];
  let paginationToken: string | undefined;

  do {
    const command = new ListUsersCommand({
      UserPoolId: userPoolId,
      PaginationToken: paginationToken,
    });

    const response = await cognitoClient.send(command);

    if (response.Users) {
      users.push(...response.Users);
    }

    paginationToken = response.PaginationToken;
  } while (paginationToken);

  console.log(`   ✅ Found ${users.length} users in Cognito`);
  return users;
}

/**
 * Get Cognito user attributes
 */
async function getCognitoUserAttributes(
  username: string,
  userPoolId: string
): Promise<CognitoUserAttributes | null> {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    });

    const response = await cognitoClient.send(command);

    if (!response.UserAttributes) {
      return null;
    }

    const attributes: CognitoUserAttributes = { email: username };

    for (const attr of response.UserAttributes) {
      if (attr.Name && attr.Value) {
        switch (attr.Name) {
          case "given_name":
            attributes.givenName = attr.Value;
            break;
          case "family_name":
            attributes.familyName = attr.Value;
            break;
          case "email":
            attributes.email = attr.Value;
            break;
          case "email_verified":
            attributes.emailVerified = attr.Value;
            break;
          case "custom:role":
            attributes["custom:role"] = attr.Value;
            break;
          case "custom:showOnLeaderboard":
            attributes["custom:showOnLeaderboard"] = attr.Value;
            break;
        }
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
      { Name: "email_verified", Value: attributes.emailVerified || "true" },
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
 * Clone a single Cognito user to dev
 */
async function cloneCognitoUserToDev(
  username: string,
  sourceUserPoolId: string,
  targetUserPoolId: string
): Promise<CloneResult> {
  const result: CloneResult = {
    email: username,
    cognitoCreated: false,
  };

  try {
    // Get user attributes from source
    const cognitoAttrs = await getCognitoUserAttributes(
      username,
      sourceUserPoolId
    );

    if (!cognitoAttrs) {
      result.error = "Could not fetch user attributes from source";
      return result;
    }

    // Create user in target
    result.cognitoCreated = await createCognitoUser(
      cognitoAttrs,
      targetUserPoolId
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
  console.log(`   CLONE ALL COGNITO USERS FROM QA TO DEV`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Source: QA (${ENVIRONMENTS.qa.userPoolId})`);
  console.log(`Target: DEV (${ENVIRONMENTS.dev.userPoolId})`);
  console.log(`Default password for cloned Cognito users: ${DEFAULT_PASSWORD}`);
  console.log(`${"=".repeat(70)}\n`);

  const summary = {
    totalUsers: 0,
    cognitoUsersCreated: 0,
    alreadyExisted: 0,
    errors: 0,
  };

  try {
    // List all users from QA Cognito
    const qaUsers = await listAllCognitoUsers(ENVIRONMENTS.qa.userPoolId);
    summary.totalUsers = qaUsers.length;

    console.log(`\n${"=".repeat(70)}`);
    console.log(`   CLONING ${qaUsers.length} USERS`);
    console.log(`${"=".repeat(70)}\n`);

    // Clone each user
    let processedCount = 0;
    for (const user of qaUsers) {
      const username = user.Username;
      if (!username) continue;

      processedCount++;
      console.log(`[${processedCount}/${qaUsers.length}] Cloning user: ${username}`);

      const result = await cloneCognitoUserToDev(
        username,
        ENVIRONMENTS.qa.userPoolId,
        ENVIRONMENTS.dev.userPoolId
      );

      if (result.error) {
        console.log(`   ❌ ERROR: ${result.error}`);
        summary.errors++;
      } else if (result.cognitoCreated) {
        console.log(`   ✅ Created in DEV Cognito`);
        summary.cognitoUsersCreated++;
      } else {
        console.log(`   ⏭️  Already exists in DEV`);
        summary.alreadyExisted++;
      }
    }

    // Print summary
    console.log(`\n${"=".repeat(70)}`);
    console.log(`   CLONING SUMMARY`);
    console.log(`${"=".repeat(70)}`);
    console.log(`   Total users in QA: ${summary.totalUsers}`);
    console.log(`   Users created in DEV: ${summary.cognitoUsersCreated}`);
    console.log(`   Users already existed: ${summary.alreadyExisted}`);
    console.log(`   Errors: ${summary.errors}`);
    console.log(`${"=".repeat(70)}`);
    console.log(`\n   NOTE: Cloned Cognito users have password: ${DEFAULT_PASSWORD}`);
    console.log(`   Users may need to reset their password on first login.\n`);

    if (summary.errors > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error("\n   Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("\n   Fatal error:", error);
  process.exit(1);
});
