import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "exam-platform-data-prod";

async function listAllUsers() {
  console.log(`\n🔍 Listing all users in database...\n`);

  try {
    const response = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: {
        ":entityType": "USER_PROFILE",
      },
    }));

    if (response.Items && response.Items.length > 0) {
      console.log(`✅ Found ${response.Items.length} user(s):\n`);

      response.Items.forEach((user, index) => {
        console.log(`${index + 1}. ${user['firstName']} ${user['lastName']}`);
        console.log(`   Email: ${user['email']}`);
        console.log(`   User ID: ${user['userId']}`);
        console.log(`   Role: ${user['role'] || 'student'}\n`);
      });
    } else {
      console.log(`❌ No users found in database\n`);
    }
  } catch (error: any) {
    console.error(`❌ Error listing users:`, error.message);
    throw error;
  }
}

listAllUsers()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
