/**
 * Quick script to check current user role in database
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

const EMAIL = "ishmaelchibvuri@gmail.com";
const ENVIRONMENT = "dev"; // Change to 'qa' or 'prod' as needed
const TABLE_NAME = `exam-platform-data-${ENVIRONMENT}`;

async function checkUserRole(email: string) {
  console.log("========================================");
  console.log(`Checking user role`);
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Email: ${email}`);
  console.log("========================================\n");

  try {
    // Find user by email using GSI1
    console.log(`Finding user by email: ${email}`);
    const queryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
      ExpressionAttributeValues: {
        ":pk": "USER",
        ":sk": email,
      },
      Limit: 1,
    });

    const queryResult = await docClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      console.log(`❌ User not found with email: ${email}`);
      return;
    }

    const user = queryResult.Items[0]!;

    console.log(`\n✅ User found:`);
    console.log(`   - User ID: ${user.userId}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Name: ${user.firstName} ${user.lastName}`);
    console.log(`   - Current Role: ${user.role || "user"}`);
    console.log(`   - Status: ${user.status || "unknown"}`);
    console.log(`   - Created At: ${user.createdAt}`);
    console.log(`   - Updated At: ${user.updatedAt || "N/A"}`);

    console.log("\n========================================");
    if (user.role === "admin") {
      console.log("✅ User has ADMIN role in database");
    } else {
      console.log(`⚠️  User has ${user.role || "user"} role - NOT admin`);
    }
    console.log("========================================");
  } catch (error) {
    console.error("\n❌ Error checking user role:", error);
    throw error;
  }
}

// Run the script
checkUserRole(EMAIL)
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
