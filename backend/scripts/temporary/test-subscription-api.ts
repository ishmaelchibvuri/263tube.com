// Set environment variables FIRST
process.env["TABLE_NAME"] = "exam-platform-data-dev";
process.env["AWS_REGION"] = "af-south-1";

import { AccessControl } from "../../lib/access-control";
import { SubscriptionHelpers } from "../../lib/subscription-database";

/**
 * Test script to verify subscription API is working correctly
 */

async function testSubscriptionAPI() {
  const userId = "81ecd2f8-6061-7032-ed83-e4ccef117691";
  const userEmail = "sigourney.aylinne@moonfee.com";

  console.log(`\n=== Testing Subscription API ===`);
  console.log(`User: ${userEmail}`);
  console.log(`User ID: ${userId}\n`);

  try {
    // Test 1: Get user tier
    console.log("📋 Test 1: Get User Tier");
    const tier = await SubscriptionHelpers.getUserTier(userId);
    console.log(`✅ User tier: ${tier}`);
    console.log();

    // Test 2: Get subscription info
    console.log("📋 Test 2: Get Subscription Info");
    const subInfo = await SubscriptionHelpers.getUserSubscriptionInfo(userId);
    console.log(`✅ Subscription info:`, JSON.stringify(subInfo, null, 2));
    console.log();

    // Test 3: Get full access control subscription
    console.log("📋 Test 3: Get Access Control Subscription");
    const subscription = await AccessControl.getUserSubscription(userId);
    console.log(
      `✅ Full subscription data:`,
      JSON.stringify(subscription, null, 2)
    );
    console.log();

    // Test 4: Check feature access
    console.log("📋 Test 4: Check Feature Access");
    const bookmarkAccess = await AccessControl.checkFeatureAccess(
      userId,
      "bookmarking"
    );
    console.log(`✅ Bookmark access:`, JSON.stringify(bookmarkAccess, null, 2));
    console.log();

    const unlimitedQuestionsAccess = await AccessControl.checkFeatureAccess(
      userId,
      "unlimited_questions"
    );
    console.log(
      `✅ Unlimited questions access:`,
      JSON.stringify(unlimitedQuestionsAccess, null, 2)
    );
    console.log();

    // Test 5: Get remaining questions
    console.log("📋 Test 5: Get Remaining Questions");
    const remaining = await AccessControl.getRemainingDailyQuestions(userId);
    console.log(
      `✅ Remaining questions: ${remaining === null ? "Unlimited" : remaining}`
    );
    console.log();

    // Test 6: Check if subscription is expiring soon
    console.log("📋 Test 6: Check Expiring Soon");
    const expiringSoon = await AccessControl.isSubscriptionExpiringSoon(userId);
    console.log(`✅ Expiring soon: ${expiringSoon}`);
    console.log();

    console.log("🎉 All tests passed!");
    console.log("\n=== Summary ===");
    console.log(`Tier: ${tier}`);
    console.log(`Status: ${subInfo.status}`);
    console.log(`Expires: ${subInfo.expiresAt || "N/A"}`);
    console.log(`Days Remaining: ${subInfo.daysRemaining || "N/A"}`);
    console.log();
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testSubscriptionAPI()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
