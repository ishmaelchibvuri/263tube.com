import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "exam-platform-data-prod";

async function verifyUserSubscription() {
  const userId = "71bce268-7001-709b-ba98-9d7b9580389c";
  const userEmail = "arpan.maxi@moonfee.com";

  console.log(`\n🔍 Verifying subscription for: ${userEmail}`);
  console.log(`   User ID: ${userId}\n`);

  try {
    // Query for all purchases for this user
    const response = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "PURCHASE#",
      },
    }));

    if (response.Items && response.Items.length > 0) {
      console.log(`✅ Found ${response.Items.length} purchase(s):\n`);

      response.Items.forEach((purchase, index) => {
        console.log(`${index + 1}. Purchase ID: ${purchase['purchaseId']}`);
        console.log(`   Tier: ${purchase['tier']}`);
        console.log(`   Status: ${purchase['status']}`);
        console.log(`   Amount: R${(purchase['amount'] / 100).toFixed(2)}`);
        console.log(`   Duration: ${purchase['durationDays']} days`);
        console.log(`   Activated: ${purchase['activatedAt']}`);
        console.log(`   Expires: ${purchase['expiresAt']}`);
        console.log(`   Active: ${new Date(purchase['expiresAt']) > new Date() ? 'Yes' : 'No'}\n`);
      });

      // Find active purchase
      const activePurchase = response.Items.find(
        (p) => p['status'] === 'active' && new Date(p['expiresAt']) > new Date()
      );

      if (activePurchase) {
        console.log(`\n🎉 User has an ACTIVE ${activePurchase['tier'].toUpperCase()} subscription!`);
        console.log(`   Expires on: ${new Date(activePurchase['expiresAt']).toLocaleDateString()}\n`);
      } else {
        console.log(`\n⚠️ No active subscription found.\n`);
      }
    } else {
      console.log(`❌ No purchases found for this user.\n`);
    }
  } catch (error: any) {
    console.error(`❌ Error verifying subscription:`, error.message);
    throw error;
  }
}

verifyUserSubscription()
  .then(() => {
    console.log("✅ Verification completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
