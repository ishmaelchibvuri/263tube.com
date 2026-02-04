import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "exam-platform-data-prod";

async function findUserByEmail(email: string) {
  console.log(`\n🔍 Searching for user with email: ${email}\n`);

  try {
    const response = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "email = :email AND entityType = :entityType",
      ExpressionAttributeValues: {
        ":email": email,
        ":entityType": "USER_PROFILE",
      },
    }));

    if (response.Items && response.Items.length > 0) {
      const user = response.Items[0]!;
      console.log(`✅ User found!`);
      console.log(`   User ID: ${user['userId']}`);
      console.log(`   Name: ${user['firstName']} ${user['lastName']}`);
      console.log(`   Email: ${user['email']}`);
      console.log(`   Role: ${user['role'] || 'student'}\n`);
      return user;
    } else {
      console.log(`❌ No user found with email: ${email}\n`);
      return null;
    }
  } catch (error: any) {
    console.error(`❌ Error searching for user:`, error.message);
    throw error;
  }
}

const targetEmail = "dragon.aziz@moonfee.com";

findUserByEmail(targetEmail)
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
