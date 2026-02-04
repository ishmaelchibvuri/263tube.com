// Set the correct environment variables FIRST before importing
process.env["TABLE_NAME"] = "exam-platform-data-dev";
process.env["AWS_REGION"] = "af-south-1";

import { SubscriptionDatabase } from "../../lib/subscription-database";
import { v4 as uuid } from "uuid";

/**
 * Script to upgrade a user to Pro tier
 *
 * Usage: Set the userId in the script and run:
 *   npx tsx scripts/upgrade-user-to-pro.ts
 */

async function upgradeUserToPro(
  userId: string,
  userEmail: string,
  durationDays: number = 90
) {
  console.log(`\n🔍 Upgrading user: ${userEmail} (ID: ${userId})...`);

  // Create purchase record
  const purchaseId = `ADMIN-${uuid()}`;
  const amount = 17999; // Pro tier price in cents (R179.99)

  console.log(`\n📝 Creating Pro purchase record...`);
  console.log(`   Purchase ID: ${purchaseId}`);
  console.log(`   Tier: pro`);
  console.log(`   Duration: ${durationDays} days`);
  console.log(`   Amount: R${(amount / 100).toFixed(2)}`);

  await SubscriptionDatabase.createPurchase({
    purchaseId,
    userId,
    tier: "pro",
    amount,
    durationDays,
  });

  console.log(`✅ Purchase record created`);

  // Activate the purchase
  console.log(`\n🔄 Activating purchase...`);
  await SubscriptionDatabase.updatePurchaseStatus(
    purchaseId,
    "active" as const
  );

  const expiresAt = new Date(
    Date.now() + durationDays * 24 * 60 * 60 * 1000
  ).toISOString();

  console.log(`✅ Purchase activated!`);
  console.log(`\n🎉 User ${userEmail} has been upgraded to Pro tier`);
  console.log(`   Expires: ${expiresAt}`);
  console.log(`   Days: ${durationDays}\n`);
}

// Main execution
const userId = "81ecd2f8-6061-7032-ed83-e4ccef117691";
const userEmail = "sigourney.aylinne@moonfee.com";
const durationDays = 90; // 90 days for Pro tier

upgradeUserToPro(userId, userEmail, durationDays)
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error upgrading user:", error);
    process.exit(1);
  });
