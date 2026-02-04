import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "exam-platform-data-dev";

async function upgradeUserToPremium() {
  const userId = "c16cc268-9031-70b8-2c79-dd256f8e1e25";
  const userEmail = "ysabelle.linnette@moonfee.com";
  const durationDays = 30; // 30 days for Premium tier
  const tier = "premium";
  const amount = 8999; // R89.99

  console.log(`\n🔍 Upgrading user to Premium tier`);
  console.log(`   Name: Ysabelle Linnette`);
  console.log(`   Email: ${userEmail}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Tier: ${tier}`);
  console.log(`   Duration: ${durationDays} days\n`);

  const purchaseId = `ADMIN-${uuid()}`;
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  // Create purchase record
  console.log(`📝 Creating purchase record...`);
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
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: purchase,
    }));
    console.log(`✅ Purchase record created successfully!`);
    console.log(`   Purchase ID: ${purchaseId}`);
    console.log(`   Status: active`);
    console.log(`   Amount: R${(amount / 100).toFixed(2)}`);
    console.log(`   Expires: ${expiresAt}`);
    console.log(`   Days Remaining: ${durationDays}`);
    console.log(`\n🎉 User upgraded to Premium tier successfully!`);
    console.log(`\n💡 The user can now:`);
    console.log(`   ✓ Access unlimited questions`);
    console.log(`   ✓ Take unlimited exams`);
    console.log(`   ✓ View detailed question breakdowns`);
    console.log(`   ✓ Access the Premium leaderboard`);
    console.log(`   ✓ Generate random full exams`);
    console.log(`   ✓ Use the extensive question bank\n`);
  } catch (error: any) {
    console.error(`❌ Error creating purchase:`, error.message);
    throw error;
  }
}

upgradeUserToPremium()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
