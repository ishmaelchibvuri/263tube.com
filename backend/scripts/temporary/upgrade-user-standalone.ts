import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "exam-platform-data-dev";

async function upgradeUserToPro() {
  const userId = "81ecd2f8-6061-7032-ed83-e4ccef117691";
  const userEmail = "sigourney.aylinne@moonfee.com";
  const durationDays = 90;
  const tier = "pro";
  const amount = 17999; // R179.99

  console.log(`\n🔍 Upgrading user: ${userEmail}`);
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
    console.log(`   Expires: ${expiresAt}`);
    console.log(`\n🎉 User upgraded to Pro tier successfully!\n`);
  } catch (error: any) {
    console.error(`❌ Error creating purchase:`, error.message);
    throw error;
  }
}

upgradeUserToPro()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
