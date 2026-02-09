/**
 * 263Tube - Manage Cognito Admin Users
 *
 * Add or remove users from the "admins" group in Cognito.
 *
 * Usage:
 *   node scripts/manage-administrators.mjs add <email>              # dev (default)
 *   node scripts/manage-administrators.mjs add <email> --env=qa
 *   node scripts/manage-administrators.mjs add <email> --env=prod
 *   node scripts/manage-administrators.mjs remove <email>           # dev (default)
 *   node scripts/manage-administrators.mjs remove <email> --env=qa
 *   node scripts/manage-administrators.mjs remove <email> --env=prod
 *   node scripts/manage-administrators.mjs list                     # dev (default)
 *   node scripts/manage-administrators.mjs list --env=qa
 *   node scripts/manage-administrators.mjs list --env=prod
 *
 * Prerequisites: AWS credentials configured with Cognito admin access
 */

import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  ListUsersInGroupCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// ============================================================================
// Configuration
// ============================================================================

const REGION = "af-south-1";
const GROUP_NAME = "admins";

const USER_POOLS = {
  dev:  "af-south-1_tl53nFXtH",
  qa:   "af-south-1_ERbM0hMU1",
  prod: "af-south-1_tn35fXjiP",
};

// ============================================================================
// Helpers
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const envFlag = args.find((a) => a.startsWith("--env="));
  const env = envFlag ? envFlag.split("=")[1] : "dev";
  const filtered = args.filter((a) => !a.startsWith("--"));
  const action = filtered[0];
  const email = filtered[1];

  return { action, email, env };
}

function getUserPoolId(env) {
  const id = USER_POOLS[env];
  if (!id) {
    console.error(`Unknown environment: "${env}". Available: ${Object.keys(USER_POOLS).join(", ")}`);
    process.exit(1);
  }
  return id;
}

// ============================================================================
// Commands
// ============================================================================

async function addAdmin(client, poolId, email) {
  // Verify user exists first
  try {
    await client.send(
      new AdminGetUserCommand({ UserPoolId: poolId, Username: email })
    );
  } catch (err) {
    if (err.name === "UserNotFoundException") {
      console.error(`User "${email}" not found in the user pool.`);
      process.exit(1);
    }
    throw err;
  }

  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: poolId,
      Username: email,
      GroupName: GROUP_NAME,
    })
  );

  console.log(`Added "${email}" to the ${GROUP_NAME} group.`);
}

async function removeAdmin(client, poolId, email) {
  await client.send(
    new AdminRemoveUserFromGroupCommand({
      UserPoolId: poolId,
      Username: email,
      GroupName: GROUP_NAME,
    })
  );

  console.log(`Removed "${email}" from the ${GROUP_NAME} group.`);
}

async function listAdmins(client, poolId) {
  const response = await client.send(
    new ListUsersInGroupCommand({
      UserPoolId: poolId,
      GroupName: GROUP_NAME,
    })
  );

  const users = response.Users || [];

  if (users.length === 0) {
    console.log("No admin users found.");
    return;
  }

  console.log(`Admin users (${users.length}):\n`);
  for (const user of users) {
    const email =
      user.Attributes?.find((a) => a.Name === "email")?.Value || "—";
    const status = user.UserStatus;
    const created = user.UserCreateDate?.toLocaleDateString() || "—";
    console.log(`  ${email}  (status: ${status}, created: ${created})`);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const { action, email, env } = parseArgs();

  if (!action || !["add", "remove", "list"].includes(action)) {
    console.log(`
263Tube — Manage Admin Users

Usage:
  node scripts/manage-administrators.mjs add <email>    [--env=dev|qa|prod]
  node scripts/manage-administrators.mjs remove <email> [--env=dev|qa|prod]
  node scripts/manage-administrators.mjs list           [--env=dev|qa|prod]
`);
    process.exit(1);
  }

  if (["add", "remove"].includes(action) && !email) {
    console.error(`Please provide an email address. Example:\n  node scripts/manage-admin.mjs ${action} user@example.com`);
    process.exit(1);
  }

  const poolId = getUserPoolId(env);
  const client = new CognitoIdentityProviderClient({ region: REGION });

  console.log(`Environment: ${env}  |  User Pool: ${poolId}\n`);

  try {
    if (action === "add") await addAdmin(client, poolId, email);
    else if (action === "remove") await removeAdmin(client, poolId, email);
    else if (action === "list") await listAdmins(client, poolId);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();
