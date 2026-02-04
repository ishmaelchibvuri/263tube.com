/**
 * Fix User Leaderboard Script
 *
 * Deletes incorrect leaderboard entries for a specific user.
 * The corrected entries will be created on their next exam submission.
 *
 * Run with: TABLE_NAME=exam-platform-data-dev tsx backend/scripts/fix-user-leaderboard.ts <email>
 */

// Set environment variable BEFORE imports
const env = process.argv[3] || "dev";
process.env.TABLE_NAME = process.env.TABLE_NAME || `exam-platform-data-${env}`;

import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME;
const client = new DynamoDBClient({ region: process.env.AWS_REGION || "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

async function fixUserLeaderboard(email: string) {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Fix User Leaderboard Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Email: ${email}`);
  console.log(`  Table: ${TABLE_NAME}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Step 1: Find user by email
  console.log("🔍 Finding user by email...");
  const userScan = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "email = :email AND SK = :sk",
    ExpressionAttributeValues: {
      ":email": email,
      ":sk": "PROFILE"
    }
  }));

  if (!userScan.Items || userScan.Items.length === 0) {
    console.error(`❌ User not found with email: ${email}`);
    return;
  }

  const userProfile = userScan.Items[0];
  const userId = userProfile!.PK.replace("USER#", "");
  console.log(`✅ Found user: ${userId} (${userProfile!.firstName} ${userProfile!.lastName || ""})`);

  // Step 2: Get user's exam attempts first to show what we have
  console.log("\n🔍 Getting user's exam attempts...");
  const attempts = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "ATTEMPT#"
    }
  }));

  console.log(`📊 Found ${attempts.Items?.length || 0} exam attempts`);

  if (attempts.Items && attempts.Items.length > 0) {
    for (const attempt of attempts.Items) {
      console.log(`   - ${attempt.date} | ${attempt.percentage}% | correct: ${attempt.correctAnswers}/${attempt.totalQuestions}`);
    }

    // Calculate what the correct average should be
    const correctAvgPercentage = attempts.Items.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.Items.length;
    console.log(`\n   📊 CORRECT average percentage: ${correctAvgPercentage.toFixed(2)}%`);
  }

  // Step 3: Delete all their current leaderboard entries
  console.log("\n🔍 Finding user's leaderboard entries...");
  const leaderboardScan = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "begins_with(PK, :pk) AND userId = :uid",
    ExpressionAttributeValues: {
      ":pk": "LEADERBOARD#",
      ":uid": userId
    }
  }));

  console.log(`📊 Found ${leaderboardScan.Items?.length || 0} leaderboard entries`);

  if (leaderboardScan.Items && leaderboardScan.Items.length > 0) {
    console.log("\n🗑️  Current (INCORRECT) leaderboard entries:");
    for (const item of leaderboardScan.Items) {
      console.log(`   - ${item.PK}`);
      console.log(`     INCORRECT score: ${item.avgScore || item.score}%`);
    }

    console.log("\n🗑️  Deleting incorrect leaderboard entries...");

    // Delete in batches
    const batchSize = 25;
    for (let i = 0; i < leaderboardScan.Items.length; i += batchSize) {
      const batch = leaderboardScan.Items.slice(i, i + batchSize);
      const deleteRequests = batch.map((item) => ({
        DeleteRequest: {
          Key: {
            PK: { S: item.PK },
            SK: { S: item.SK },
          },
        },
      }));

      await client.send(new BatchWriteItemCommand({
        RequestItems: {
          [TABLE_NAME!]: deleteRequests,
        },
      }));
    }
    console.log(`✅ Deleted ${leaderboardScan.Items.length} incorrect entries`);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ✅ Cleanup complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n📝 NEXT STEPS:");
  console.log("   1. Deploy the fixed leaderboard-calculator.ts code");
  console.log("   2. On the user's next exam submission, correct leaderboard entries will be created");
  console.log("   3. OR run the backfill script to recalculate all leaderboards\n");
}

// Get email from command line
const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx backend/scripts/fix-user-leaderboard.ts <email> [env]");
  console.error("Example: tsx backend/scripts/fix-user-leaderboard.ts user@example.com dev");
  process.exit(1);
}

fixUserLeaderboard(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
