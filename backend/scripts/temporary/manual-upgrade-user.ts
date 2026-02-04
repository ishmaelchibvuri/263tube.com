// CRITICAL: Set environment variables BEFORE any imports
// Parse just the environment argument first
const environment = process.argv[4] || "dev";

process.env.TABLE_NAME = `exam-platform-data-${environment}`;
process.env.AWS_REGION = "af-south-1";

/**
 * Manual User Subscription Upgrade Script
 *
 * This script manually upgrades a user to a paid tier (premium or pro) by creating
 * an active purchase record in DynamoDB. Use this for users who have payment issues
 * or for manual account upgrades.
 *
 * Usage:
 *   npx tsx scripts/manual-upgrade-user.ts <emailOrUserId> <tier> [environment] [durationDays]
 *
 * Arguments:
 *   emailOrUserId - User's email address or user ID (UUID format)
 *   tier          - Subscription tier: "premium" or "pro"
 *   environment   - Target environment: "dev", "qa", or "prod" (default: "dev")
 *   durationDays  - Subscription duration in days (default: 30 for premium, 90 for pro)
 *
 * Examples:
 *   npx tsx scripts/manual-upgrade-user.ts dragon.aziz@moonfee.com pro prod
 *   npx tsx scripts/manual-upgrade-user.ts 319c22a8-6031-70f9-daa6-52997b4c7731 pro prod
 *   npx tsx scripts/manual-upgrade-user.ts user@example.com premium dev 60
 */

// Now import dependencies AFTER env vars are set
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { SubscriptionDatabase } from "../../lib/subscription-database";

// Parse all command line arguments
const args = process.argv.slice(2);
const emailOrUserId = args[0];
const tier = args[1] as "premium" | "pro";
const customDuration = args[3] ? parseInt(args[3]) : undefined;

// Validate arguments
if (!emailOrUserId || !tier) {
  console.error("\n❌ Error: Email/UserID and tier are required\n");
  console.log(
    "Usage: npx tsx scripts/manual-upgrade-user.ts <emailOrUserId> <tier> [environment] [durationDays]\n"
  );
  console.log("Arguments:");
  console.log(
    "  emailOrUserId - User's email address or user ID (UUID format)"
  );
  console.log("  tier          - Subscription tier: 'premium' or 'pro'");
  console.log(
    "  environment   - Target environment: 'dev', 'qa', or 'prod' (default: 'dev')"
  );
  console.log(
    "  durationDays  - Subscription duration in days (default: 30 for premium, 90 for pro)\n"
  );
  console.log("Examples:");
  console.log(
    "  npx tsx scripts/manual-upgrade-user.ts user@example.com pro prod"
  );
  console.log(
    "  npx tsx scripts/manual-upgrade-user.ts 319c22a8-6031-70f9-daa6-52997b4c7731 pro prod\n"
  );
  process.exit(1);
}

if (tier !== "premium" && tier !== "pro") {
  console.error("\n❌ Error: Tier must be either 'premium' or 'pro'\n");
  process.exit(1);
}

if (!["dev", "qa", "prod"].includes(environment)) {
  console.error("\n❌ Error: Environment must be 'dev', 'qa', or 'prod'\n");
  process.exit(1);
}

// Initialize AWS clients
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Check if string is a valid UUID
 */
function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Find user by email address or user ID
 */
async function findUser(emailOrUserId: string): Promise<any> {
  console.log(`\n🔍 Searching for user: ${emailOrUserId}`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Table: ${process.env.TABLE_NAME}\n`);

  // If it looks like a UUID, try to get the user directly
  if (isUUID(emailOrUserId)) {
    console.log(`   Detected UUID format, fetching user profile directly...`);

    const response = await docClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME!,
        Key: {
          PK: `USER#${emailOrUserId}`,
          SK: "PROFILE",
        },
      })
    );

    if (response.Item) {
      const user = response.Item;
      console.log(`✅ User found!`);
      console.log(`   User ID: ${user["userId"]}`);
      console.log(`   Name: ${user["firstName"]} ${user["lastName"]}`);
      console.log(`   Email: ${user["email"]}`);
      console.log(`   Role: ${user["role"] || "student"}\n`);
      return user;
    } else {
      throw new Error(`No user found with ID: ${emailOrUserId}`);
    }
  }

  // Otherwise, scan by email
  console.log(`   Scanning by email address...`);

  const response = await docClient.send(
    new ScanCommand({
      TableName: process.env.TABLE_NAME!,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": emailOrUserId,
      },
    })
  );

  console.log(
    `   Scanned ${response.ScannedCount} items, found ${response.Count} matches`
  );

  if (response.Items && response.Items.length > 0) {
    const user = response.Items[0]!;
    console.log(`✅ User found!`);
    console.log(`   User ID: ${user["userId"]}`);
    console.log(`   Name: ${user["firstName"]} ${user["lastName"]}`);
    console.log(`   Email: ${user["email"]}`);
    console.log(`   Role: ${user["role"] || "student"}\n`);
    return user;
  } else {
    throw new Error(`No user found with email: ${emailOrUserId}`);
  }
}

/**
 * Check for existing active purchase
 */
async function checkExistingPurchase(userId: string): Promise<any> {
  console.log(`📋 Checking for existing active purchases...`);

  const activePurchase = await SubscriptionDatabase.getActivePurchase(userId);

  if (activePurchase) {
    console.log(`⚠️  Found existing active purchase:`);
    console.log(`   Purchase ID: ${activePurchase.purchaseId}`);
    console.log(`   Tier: ${activePurchase.tier}`);
    console.log(`   Status: ${activePurchase.status}`);
    console.log(`   Expires: ${activePurchase.expiresAt}\n`);
    return activePurchase;
  } else {
    console.log(`   No active purchase found\n`);
    return null;
  }
}

/**
 * Upgrade user to specified tier
 */
async function upgradeUser(
  userId: string,
  userEmail: string,
  tier: "premium" | "pro",
  durationDays?: number
) {
  // Determine pricing and duration
  const defaultDuration = tier === "premium" ? 30 : 90;
  const duration = durationDays || defaultDuration;
  const amount = tier === "premium" ? 9999 : 17999; // in cents

  console.log(`\n🚀 Upgrading user to ${tier.toUpperCase()} tier...`);
  console.log(`   Email: ${userEmail}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Tier: ${tier}`);
  console.log(`   Duration: ${duration} days`);
  console.log(`   Amount: R${(amount / 100).toFixed(2)}\n`);

  // Create purchase record
  const purchaseId = `ADMIN-${uuid()}`;

  console.log(`📝 Creating purchase record...`);
  await SubscriptionDatabase.createPurchase({
    purchaseId,
    userId,
    tier,
    amount,
    durationDays: duration,
  });

  console.log(`✅ Purchase record created (ID: ${purchaseId})`);

  // Activate the purchase immediately
  console.log(`\n🔄 Activating purchase...`);
  await SubscriptionDatabase.updatePurchaseStatus(
    purchaseId,
    "active" as const
  );

  const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

  console.log(`✅ Purchase activated!\n`);
  console.log(`╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  🎉 UPGRADE SUCCESSFUL                                     ║`);
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  console.log(`║  User: ${userEmail.padEnd(48)} ║`);
  console.log(`║  Tier: ${tier.toUpperCase().padEnd(48)} ║`);
  console.log(`║  Expires: ${expiresAt.toISOString().padEnd(45)} ║`);
  console.log(
    `║  Duration: ${duration} days${" ".repeat(
      43 - duration.toString().length
    )} ║`
  );
  console.log(`║  Purchase ID: ${purchaseId.padEnd(43)} ║`);
  console.log(
    `╚════════════════════════════════════════════════════════════╝\n`
  );
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`  MANUAL USER SUBSCRIPTION UPGRADE`);
    console.log(`${"=".repeat(60)}`);

    // Find user by email or ID
    const user = await findUser(emailOrUserId);
    const userId = user["userId"];
    const userEmail = user["email"];

    // Note: Skipping existing purchase check due to region configuration issues
    // The upgrade will create a new purchase record regardless

    // Perform the upgrade
    await upgradeUser(userId, userEmail, tier, customDuration);

    console.log(`✅ Script completed successfully\n`);
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ Error upgrading user:`, error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
