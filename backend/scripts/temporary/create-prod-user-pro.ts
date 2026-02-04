import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "exam-platform-data-prod";

async function createUserAndUpgradeToPro() {
  const userId = "71bce268-7001-709b-ba98-9d7b9580389c";
  const userEmail = "arpan.maxi@moonfee.com";
  const firstName = "Arpan";
  const lastName = "Maxi";
  const durationDays = 90;
  const tier = "pro";
  const amount = 17999; // R179.99

  console.log(`\n🔍 Creating user profile and upgrading to PRO: ${userEmail}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Name: ${firstName} ${lastName}`);
  console.log(`   Tier: ${tier}`);
  console.log(`   Duration: ${durationDays} days\n`);

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  // Step 1: Create user profile
  console.log(`📝 Creating user profile...`);
  const userProfile = {
    PK: `USER#${userId}`,
    SK: "PROFILE",
    userId,
    email: userEmail,
    firstName,
    lastName,
    role: "student",
    isActive: true,
    showOnLeaderboard: true,
    createdAt: now,
    lastActive: now,
    lastLoginAt: now,
    entityType: "USER_PROFILE",
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: userProfile,
    }));
    console.log(`✅ User profile created successfully!`);
  } catch (error: any) {
    console.error(`❌ Error creating user profile:`, error.message);
    throw error;
  }

  // Step 2: Create PRO tier purchase record
  const purchaseId = `ADMIN-${uuid()}`;
  console.log(`\n📝 Creating PRO tier purchase record...`);

  const purchase = {
    PK: `USER#${userId}`,
    SK: `PURCHASE#${now}#${purchaseId}`,
    GSI1PK: "PURCHASE",
    GSI1SK: `active#${expiresAt}`,
    GSI2PK: `USER#${userId}#ACTIVEPURCHASE`,
    GSI2SK: expiresAt,
    purchaseId,
    userId,
    tier,
    status: "active",
    amount,
    currency: "ZAR",
    durationDays,
    purchaseDate: now,
    expiresAt,
    activatedAt: now,
    createdAt: now,
    updatedAt: now,
    entityType: "USER_PURCHASE",
    payfastPaymentId: `ADMIN-MANUAL-${Date.now()}`,
    payfastMerchantId: "ADMIN",
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: purchase,
    }));
    console.log(`✅ Purchase record created successfully!`);
    console.log(`   Purchase ID: ${purchaseId}`);
    console.log(`   Status: active`);
    console.log(`   Expires: ${expiresAt}`);
    console.log(`\n🎉 User profile created and upgraded to Pro tier successfully!\n`);
  } catch (error: any) {
    console.error(`❌ Error creating purchase:`, error.message);
    throw error;
  }
}

createUserAndUpgradeToPro()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
