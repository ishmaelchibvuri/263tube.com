/**
 * Update exam allowedTiers field to allow all subscription tiers
 *
 * Usage: npx tsx scripts/production/update-exam-allowed-tiers.ts <examId> <environment>
 * Example: npx tsx scripts/production/update-exam-allowed-tiers.ts re5-free-exam prod
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const REGION = "af-south-1";

// Parse arguments
const args = process.argv.slice(2);
const examId = args[0];
const environment = args[1] || "dev";

if (!examId) {
  console.error("\n❌ Error: Exam ID is required\n");
  console.log("Usage: npx tsx scripts/production/update-exam-allowed-tiers.ts <examId> <environment>\n");
  console.log("Arguments:");
  console.log("  examId      - The exam ID to update (e.g., re5-free-exam)");
  console.log("  environment - Target environment: 'dev', 'qa', or 'prod' (default: dev)\n");
  console.log("Examples:");
  console.log("  npx tsx scripts/production/update-exam-allowed-tiers.ts re5-free-exam prod");
  console.log("  npx tsx scripts/production/update-exam-allowed-tiers.ts re5-exam-set-a dev\n");
  process.exit(1);
}

if (!["dev", "qa", "prod"].includes(environment)) {
  console.error("\n❌ Error: Environment must be 'dev', 'qa', or 'prod'\n");
  process.exit(1);
}

const TABLE_NAME = `exam-platform-data-${environment}`;

// AWS Client
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

async function main() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  UPDATE EXAM ALLOWED TIERS`);
  console.log(`${'='.repeat(70)}\n`);

  console.log(`📋 Configuration:`);
  console.log(`   Environment: ${environment.toUpperCase()}`);
  console.log(`   Database: ${TABLE_NAME}`);
  console.log(`   Region: ${REGION}`);
  console.log(`   Exam ID: ${examId}\n`);

  try {
    // First, get the current exam to verify it exists
    console.log(`🔍 Fetching current exam metadata...`);
    const getResponse = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `EXAM#${examId}`,
        SK: "METADATA",
      },
    }));

    if (!getResponse.Item) {
      console.error(`\n❌ Error: Exam not found with ID: ${examId}\n`);
      process.exit(1);
    }

    const currentExam = getResponse.Item;
    console.log(`✅ Exam found:`);
    console.log(`   Title: ${currentExam.title}`);
    console.log(`   Current allowedTiers: ${JSON.stringify(currentExam.allowedTiers)}\n`);

    // Confirm if production
    if (environment === "prod") {
      console.log(`⚠️  WARNING: You are about to update an exam in PRODUCTION!`);
      console.log(`   This will affect all users.\n`);
    }

    // Update the exam to allow all tiers
    console.log(`📝 Updating allowedTiers to ["free", "premium", "pro"]...`);
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `EXAM#${examId}`,
        SK: "METADATA",
      },
      UpdateExpression: "SET allowedTiers = :allowedTiers, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":allowedTiers": ["free", "premium", "pro"],
        ":updatedAt": new Date().toISOString(),
      },
    }));

    console.log(`✅ Exam updated successfully!\n`);

    // Success message
    console.log(`╔${'═'.repeat(68)}╗`);
    console.log(`║  🎉 UPDATE SUCCESSFUL${' '.repeat(45)}║`);
    console.log(`╠${'═'.repeat(68)}╣`);
    console.log(`║  Exam ID: ${examId.padEnd(57)}║`);
    console.log(`║  Title: ${currentExam.title.padEnd(59)}║`);
    console.log(`║  Previous allowedTiers: ${JSON.stringify(currentExam.allowedTiers).padEnd(39)}║`);
    console.log(`║  New allowedTiers: ["free", "premium", "pro"]${' '.repeat(21)}║`);
    console.log(`╚${'═'.repeat(68)}╝\n`);

    console.log(`📌 Next Steps:`);
    console.log(`   1. All users (free, premium, pro) can now access this exam`);
    console.log(`   2. Changes are effective immediately`);
    console.log(`   3. No cache clearing needed\n`);

    console.log(`✅ Script completed successfully\n`);
    process.exit(0);

  } catch (error: any) {
    console.error(`\n❌ Error updating exam:`);
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }
}

// Run the script
main();
