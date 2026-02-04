/**
 * ============================================================================
 * MANUAL USER SUBSCRIPTION UPGRADE SCRIPT
 * ============================================================================
 *
 * PURPOSE:
 * --------
 * This script manually upgrades users to paid subscription tiers (Premium or Pro)
 * by creating active purchase records directly in DynamoDB. Use this for:
 * - Users experiencing payment gateway issues (PayFast failures)
 * - Manual account upgrades for support/marketing purposes
 * - Compensating users for service disruptions
 * - Testing subscription features in different environments
 *
 *
 * WHAT IT DOES:
 * -------------
 * 1. Finds the user by email address or user ID
 * 2. Verifies the user exists in the database
 * 3. Creates a purchase record with status "pending"
 * 4. Immediately activates the purchase (sets status to "active")
 * 5. Sets proper expiration dates based on tier duration
 * 6. Configures all DynamoDB GSI indexes for proper querying
 *
 * The created purchase record is fully equivalent to a PayFast payment and will
 * be recognized by all subscription access control systems.
 *
 *
 * USAGE:
 * ------
 * npx tsx scripts/production/upgrade-user-subscription.ts <emailOrUserId> <tier> <environment> [durationDays]
 *
 *
 * ARGUMENTS:
 * ----------
 * emailOrUserId  - User's email address OR user ID (UUID format)
 *                  Examples: dragon.aziz@moonfee.com
 *                           319c22a8-6031-70f9-daa6-52997b4c7731
 *
 * tier          - Subscription tier to upgrade to
 *                 Values: "premium" or "pro"
 *                 - premium: 30 days access (default), R99.99
 *                 - pro: 90 days access (default), R179.99
 *
 * environment   - Target environment
 *                 Values: "dev", "qa", or "prod"
 *                 Default: "dev" (if not specified)
 *
 * durationDays  - OPTIONAL: Custom duration in days (overrides tier default)
 *                 Examples: 7, 14, 30, 60, 90
 *                 Use this to grant PRO features for a custom period
 *
 *
 * EXAMPLES:
 * ---------
 * # Upgrade user by email to PRO in production (default 90 days)
 * npx tsx scripts/production/upgrade-user-subscription.ts dragon.aziz@moonfee.com pro prod
 *
 * # Upgrade user to PRO for 30 days only (custom duration)
 * npx tsx scripts/production/upgrade-user-subscription.ts dragon.aziz@moonfee.com pro prod 30
 *
 * # Upgrade user by ID to PREMIUM in dev
 * npx tsx scripts/production/upgrade-user-subscription.ts 319c22a8-6031-70f9-daa6-52997b4c7731 premium dev
 *
 * # Upgrade to PRO in QA for 7 days trial
 * npx tsx scripts/production/upgrade-user-subscription.ts user@example.com pro qa 7
 *
 *
 * PURCHASE RECORD STRUCTURE:
 * --------------------------
 * The script creates a DynamoDB record with:
 * - Purchase ID: Prefixed with "ADMIN-" + UUID
 * - Status: "active" (immediately activated)
 * - Tier: "premium" or "pro"
 * - Amount: 9999 cents (premium) or 17999 cents (pro)
 * - Duration: 30 days (premium) or 90 days (pro)
 * - Expiration: Calculated from current date + duration
 * - All GSI keys: Properly configured for database queries
 *
 *
 * SUBSCRIPTION TIERS:
 * -------------------
 * PREMIUM (30 days - R99.99):
 * - Unlimited custom quizzes
 * - Full question bank access
 * - Unlimited practice tests
 * - Performance tracking
 *
 * PRO (90 days - R179.99):
 * - Everything in Premium
 * - Exclusive study materials
 * - Video explanations
 * - Weakest areas mode
 * - Bookmarking
 * - Priority support
 * - Advanced analytics
 *
 *
 * DATABASE TABLES:
 * ----------------
 * - dev: exam-platform-data-dev
 * - qa: exam-platform-data-qa
 * - prod: exam-platform-data-prod
 *
 * Region: af-south-1 (Africa - Cape Town)
 *
 *
 * VERIFICATION:
 * -------------
 * After running, verify the purchase was created:
 *
 * aws dynamodb query \
 *   --table-name exam-platform-data-prod \
 *   --region af-south-1 \
 *   --key-condition-expression "PK = :pk AND begins_with(SK, :sk)" \
 *   --expression-attribute-values '{":pk":{"S":"USER#<userId>"},":sk":{"S":"PURCHASE#"}}'
 *
 *
 * SAFETY NOTES:
 * -------------
 * - ALWAYS double-check the environment parameter before running
 * - Production upgrades affect real user accounts
 * - The script does NOT check for existing active purchases
 * - Multiple active purchases can coexist (user gets the highest tier)
 * - All admin-created purchases are tagged with "ADMIN-" prefix
 * - No payment gateway integration - purely database operation
 *
 *
 * TROUBLESHOOTING:
 * ----------------
 * Error: "User not found"
 *   - Verify the email/ID is correct
 *   - Check you're using the right environment
 *   - Ensure the user has completed registration
 *
 * Error: "ResourceNotFoundException"
 *   - Verify AWS credentials are configured
 *   - Check you have access to the DynamoDB table
 *   - Ensure the region is correct (af-south-1)
 *
 *
 * AUTHOR: Claude Code
 * DATE: 2025-11-18
 * VERSION: 1.0
 * ============================================================================
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";

// ============================================================================
// CONFIGURATION
// ============================================================================

const REGION = "af-south-1";

const TIER_CONFIG = {
  premium: {
    duration: 30,
    amount: 9999, // R99.99 in cents
  },
  pro: {
    duration: 90,
    amount: 17999, // R179.99 in cents
  },
};

// ============================================================================
// ARGUMENT PARSING & VALIDATION
// ============================================================================

const args = process.argv.slice(2);
const emailOrUserId = args[0];
const tier = args[1] as "premium" | "pro";
const environment = args[2] || "dev";
const customDuration = args[3] ? parseInt(args[3], 10) : undefined;

if (!emailOrUserId || !tier) {
  console.error("\n❌ Error: Email/UserID and tier are required\n");
  console.log("Usage: npx tsx scripts/production/upgrade-user-subscription.ts <emailOrUserId> <tier> <environment> [durationDays]\n");
  console.log("Arguments:");
  console.log("  emailOrUserId - User's email address or user ID (UUID)");
  console.log("  tier          - Subscription tier: 'premium' or 'pro'");
  console.log("  environment   - Target environment: 'dev', 'qa', or 'prod' (default: dev)");
  console.log("  durationDays  - OPTIONAL: Custom duration in days (overrides tier default)\n");
  console.log("Examples:");
  console.log("  npx tsx scripts/production/upgrade-user-subscription.ts user@example.com pro prod");
  console.log("  npx tsx scripts/production/upgrade-user-subscription.ts user@example.com pro prod 30");
  console.log("  npx tsx scripts/production/upgrade-user-subscription.ts <uuid> premium dev\n");
  process.exit(1);
}

if (!["premium", "pro"].includes(tier)) {
  console.error("\n❌ Error: Tier must be either 'premium' or 'pro'\n");
  process.exit(1);
}

if (!["dev", "qa", "prod"].includes(environment)) {
  console.error("\n❌ Error: Environment must be 'dev', 'qa', or 'prod'\n");
  process.exit(1);
}

if (customDuration !== undefined && (isNaN(customDuration) || customDuration < 1)) {
  console.error("\n❌ Error: Duration must be a positive number of days\n");
  process.exit(1);
}

const TABLE_NAME = `exam-platform-data-${environment}`;
const tierConfig = TIER_CONFIG[tier];
const actualDuration = customDuration !== undefined ? customDuration : tierConfig.duration;

// ============================================================================
// AWS CLIENT INITIALIZATION
// ============================================================================

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a string is a valid UUID format
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Find user by email address or user ID
 */
async function findUser(emailOrUserId: string): Promise<{ userId: string; email: string; firstName: string; lastName: string }> {
  // If it's a UUID, fetch directly
  if (isUUID(emailOrUserId)) {
    console.log(`🔍 Looking up user by ID: ${emailOrUserId}...`);

    const response = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${emailOrUserId}`,
        SK: "PROFILE",
      },
    }));

    if (!response.Item) {
      throw new Error(`User not found with ID: ${emailOrUserId}`);
    }

    return {
      userId: response.Item['userId'],
      email: response.Item['email'],
      firstName: response.Item['firstName'],
      lastName: response.Item['lastName'],
    };
  }

  // Otherwise, query by email using GSI1 (much more efficient than scan)
  console.log(`🔍 Searching for user by email: ${emailOrUserId}...`);

  const response = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :email",
    ExpressionAttributeValues: {
      ":gsi1pk": "USER",
      ":email": emailOrUserId,
    },
    Limit: 1,
  }));

  if (!response.Items || response.Items.length === 0) {
    throw new Error(`User not found with email: ${emailOrUserId}`);
  }

  const user = response.Items[0]!;
  return {
    userId: user['userId'],
    email: user['email'],
    firstName: user['firstName'] || 'Unknown',
    lastName: user['lastName'] || 'User',
  };
}

/**
 * Create and activate a purchase record
 */
async function createPurchaseRecord(
  userId: string,
  tier: "premium" | "pro",
  duration: number,
  amount: number
): Promise<{ purchaseId: string; expiresAt: string }> {
  const purchaseId = `ADMIN-${uuid()}`;
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();

  // Create purchase record
  const purchaseRecord = {
    PK: `USER#${userId}`,
    SK: `PURCHASE#${now}#${purchaseId}`,
    GSI1PK: "PURCHASE",
    GSI1SK: `pending#${expiresAt}`,
    GSI2PK: `USER#${userId}#ACTIVEPURCHASE`,
    GSI2SK: expiresAt,
    GSI3PK: `PURCHASE#${purchaseId}`,
    GSI3SK: now,

    purchaseId,
    userId,
    tier,
    status: "pending",
    amount,
    currency: "ZAR",
    durationDays: duration,
    purchaseDate: now,
    expiresAt,
    createdAt: now,
    updatedAt: now,
    entityType: "USER_PURCHASE",
  };

  console.log(`📝 Creating purchase record...`);
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: purchaseRecord,
  }));

  // Activate the purchase
  console.log(`🔄 Activating purchase...`);
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: `PURCHASE#${now}#${purchaseId}`,
    },
    UpdateExpression: "SET #status = :status, activatedAt = :activatedAt, updatedAt = :updatedAt, #GSI1SK = :gsi1sk",
    ExpressionAttributeNames: {
      "#status": "status",
      "#GSI1SK": "GSI1SK",
    },
    ExpressionAttributeValues: {
      ":status": "active",
      ":activatedAt": now,
      ":updatedAt": now,
      ":gsi1sk": `active#${expiresAt}`,
    },
  }));

  return { purchaseId, expiresAt };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  MANUAL USER SUBSCRIPTION UPGRADE`);
  console.log(`${'='.repeat(70)}\n`);

  console.log(`📋 Configuration:`);
  console.log(`   Environment: ${environment.toUpperCase()}`);
  console.log(`   Database: ${TABLE_NAME}`);
  console.log(`   Region: ${REGION}`);
  console.log(`   Tier: ${tier.toUpperCase()}`);
  console.log(`   Duration: ${actualDuration} days${customDuration !== undefined ? ' (custom)' : ''}`);
  console.log(`   Amount: R${(tierConfig.amount / 100).toFixed(2)}\n`);

  try {
    // Find user
    const user = await findUser(emailOrUserId);

    console.log(`✅ User found:`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user.userId}\n`);

    // Confirm if production
    if (environment === "prod") {
      console.log(`⚠️  WARNING: You are about to upgrade a user in PRODUCTION!`);
      console.log(`   This will affect a real user account.\n`);
    }

    // Create and activate purchase
    const { purchaseId, expiresAt } = await createPurchaseRecord(
      user.userId,
      tier,
      actualDuration,
      tierConfig.amount
    );

    console.log(`✅ Purchase activated!\n`);

    // Success message
    console.log(`╔${'═'.repeat(68)}╗`);
    console.log(`║  🎉 UPGRADE SUCCESSFUL${' '.repeat(44)}║`);
    console.log(`╠${'═'.repeat(68)}╣`);
    console.log(`║  User: ${user.email.padEnd(59)}║`);
    console.log(`║  Name: ${`${user.firstName} ${user.lastName}`.padEnd(60)}║`);
    console.log(`║  Tier: ${tier.toUpperCase().padEnd(60)}║`);
    console.log(`║  Expires: ${new Date(expiresAt).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).padEnd(56)}║`);
    console.log(`║  Duration: ${actualDuration} days${' '.repeat(55 - actualDuration.toString().length)}║`);
    console.log(`║  Purchase ID: ${purchaseId.padEnd(52)}║`);
    console.log(`╚${'═'.repeat(68)}╝\n`);

    console.log(`📌 Next Steps:`);
    console.log(`   1. User can now log in and access ${tier.toUpperCase()} tier features`);
    console.log(`   2. Subscription will expire on: ${new Date(expiresAt).toLocaleString('en-ZA')}`);
    console.log(`   3. No payment gateway notification was sent (manual upgrade)`);
    console.log(`   4. Purchase record is tagged with "ADMIN-" prefix for tracking\n`);

    console.log(`✅ Script completed successfully\n`);
    process.exit(0);

  } catch (error: any) {
    console.error(`\n❌ Error upgrading user:`);
    console.error(`   ${error.message}\n`);

    if (error.message.includes('User not found')) {
      console.log(`💡 Troubleshooting:`);
      console.log(`   - Verify the email address or user ID is correct`);
      console.log(`   - Check you're using the correct environment (${environment})`);
      console.log(`   - Ensure the user has completed registration\n`);
    }

    process.exit(1);
  }
}

// Run the script
main();
