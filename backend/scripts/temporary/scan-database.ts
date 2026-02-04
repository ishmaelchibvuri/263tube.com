import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "exam-platform-data-dev";

async function scanDatabase() {
  console.log(`\n🔍 Scanning database for all items...\n`);

  try {
    const response = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 20, // Limit to first 20 items
    }));

    if (response.Items && response.Items.length > 0) {
      console.log(`✅ Found ${response.Items.length} item(s):\n`);

      response.Items.forEach((item, index) => {
        console.log(`${index + 1}. PK: ${item['PK']}, SK: ${item['SK']}`);
        console.log(`   EntityType: ${item['entityType'] || 'N/A'}`);
        if (item['email']) console.log(`   Email: ${item['email']}`);
        if (item['firstName'] && item['lastName']) console.log(`   Name: ${item['firstName']} ${item['lastName']}`);
        if (item['userId']) console.log(`   UserID: ${item['userId']}`);
        console.log();
      });

      // Group by entityType
      const entityTypes = response.Items.reduce((acc: any, item: any) => {
        const type = item['entityType'] || 'UNKNOWN';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      console.log(`\n📊 Entity Type Summary:`);
      Object.entries(entityTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    } else {
      console.log(`❌ No items found in database\n`);
    }
  } catch (error: any) {
    console.error(`❌ Error scanning database:`, error.message);
    throw error;
  }
}

scanDatabase()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
