/**
 * ============================================================================
 * BATCH USER UPGRADE SCRIPT WITH PRO CHECK
 * ============================================================================
 *
 * This script processes a list of users and upgrades them to PRO (30 days)
 * while SKIPPING users who already have an active PRO subscription.
 *
 * Usage: npx tsx scripts/production/batch-upgrade-with-check.ts
 * ============================================================================
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { execSync } from "child_process";

// ============================================================================
// CONFIGURATION
// ============================================================================

const REGION = "af-south-1";
const ENVIRONMENT = "prod";
const TABLE_NAME = `exam-platform-data-${ENVIRONMENT}`;
const TIER = "pro";
const DURATION_DAYS = 30;

// ============================================================================
// AWS CLIENT
// ============================================================================

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// ============================================================================
// TYPES
// ============================================================================

interface ActivePurchase {
  purchaseId: string;
  tier: string;
  status: string;
  expiresAt: string;
}

interface ProcessResult {
  email: string;
  status: 'success' | 'skipped' | 'failed';
  reason?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find user by email
 */
async function findUserByEmail(email: string): Promise<string | null> {
  try {
    const response = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :email",
      ExpressionAttributeValues: {
        ":gsi1pk": "USER",
        ":email": email.trim(),
      },
      Limit: 1,
    }));

    if (!response.Items || response.Items.length === 0) {
      return null;
    }

    return response.Items[0]['userId'];
  } catch (error) {
    console.error(`   Error finding user: ${error}`);
    return null;
  }
}

/**
 * Check if user has active PRO subscription
 */
async function hasActivePro(userId: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    const response = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :gsi2pk AND GSI2SK > :now",
      ExpressionAttributeValues: {
        ":gsi2pk": `USER#${userId}#ACTIVEPURCHASE`,
        ":now": now,
      },
    }));

    if (!response.Items || response.Items.length === 0) {
      return false;
    }

    // Check if any active purchase is PRO tier
    const hasProPurchase = response.Items.some(item =>
      item['tier'] === 'pro' &&
      item['status'] === 'active' &&
      new Date(item['expiresAt']) > new Date()
    );

    return hasProPurchase;
  } catch (error) {
    console.error(`   Error checking active purchases: ${error}`);
    return false;
  }
}

/**
 * Upgrade user using the existing script
 */
function upgradeUser(email: string): boolean {
  try {
    const scriptPath = join(__dirname, 'upgrade-user-subscription.ts');
    execSync(`npx tsx "${scriptPath}" "${email}" ${TIER} ${ENVIRONMENT} ${DURATION_DAYS}`, {
      stdio: 'inherit',
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Process a single user
 */
async function processUser(email: string): Promise<ProcessResult> {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📧 Processing: ${email}`);

  // Find user
  const userId = await findUserByEmail(email);
  if (!userId) {
    console.log(`   ⚠️  User not found - may not be registered yet`);
    return { email, status: 'failed', reason: 'User not found' };
  }

  console.log(`   ✓ User found: ${userId}`);

  // Check for active PRO
  const hasProActive = await hasActivePro(userId);
  if (hasProActive) {
    console.log(`   ⏭️  Already has active PRO subscription - SKIPPING`);
    return { email, status: 'skipped', reason: 'Already has active PRO' };
  }

  console.log(`   ▶️  No active PRO found - upgrading...`);

  // Upgrade user
  const success = upgradeUser(email);
  if (success) {
    console.log(`   ✅ Successfully upgraded to PRO (30 days)`);
    return { email, status: 'success' };
  } else {
    console.log(`   ❌ Upgrade failed`);
    return { email, status: 'failed', reason: 'Upgrade script failed' };
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  BATCH USER UPGRADE TO PRO (30 DAYS) - WITH DUPLICATE CHECK`);
  console.log(`${'═'.repeat(70)}\n`);

  console.log(`📋 Configuration:`);
  console.log(`   Environment: ${ENVIRONMENT.toUpperCase()}`);
  console.log(`   Database: ${TABLE_NAME}`);
  console.log(`   Region: ${REGION}`);
  console.log(`   Tier: ${TIER.toUpperCase()}`);
  console.log(`   Duration: ${DURATION_DAYS} days\n`);

  // Read user list
  const userListPath = join(__dirname, 'userlist.process');
  const emails = readFileSync(userListPath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`📊 Total users to process: ${emails.length}\n`);

  // Confirm
  console.log(`⚠️  WARNING: This will process ${emails.length} users in PRODUCTION!`);
  console.log(`   Users with active PRO subscriptions will be SKIPPED.\n`);

  // Process all users
  const results: ProcessResult[] = [];

  for (const email of emails) {
    const result = await processUser(email);
    results.push(result);

    // Small delay between users
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  BATCH UPGRADE COMPLETE`);
  console.log(`${'═'.repeat(70)}\n`);

  const successful = results.filter(r => r.status === 'success');
  const skipped = results.filter(r => r.status === 'skipped');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`📊 Summary:`);
  console.log(`   Total Processed: ${results.length}`);
  console.log(`   ✅ Successfully Upgraded: ${successful.length}`);
  console.log(`   ⏭️  Skipped (Already PRO): ${skipped.length}`);
  console.log(`   ❌ Failed: ${failed.length}\n`);

  if (skipped.length > 0) {
    console.log(`📋 Skipped users (already have PRO):`);
    skipped.forEach(r => console.log(`   - ${r.email}`));
    console.log();
  }

  if (failed.length > 0) {
    console.log(`❌ Failed users:`);
    failed.forEach(r => console.log(`   - ${r.email} (${r.reason})`));
    console.log();
  }

  if (successful.length > 0) {
    console.log(`✅ Successfully upgraded users:`);
    successful.forEach(r => console.log(`   - ${r.email}`));
    console.log();
  }

  console.log(`✅ Batch upgrade script completed\n`);
}

// Run the script
main().catch(error => {
  console.error(`\n❌ Fatal error:`, error);
  process.exit(1);
});
