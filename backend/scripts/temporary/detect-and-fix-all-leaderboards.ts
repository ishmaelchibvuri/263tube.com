/**
 * Detect and Fix ALL Leaderboard Entries Script
 *
 * This script:
 * 1. Scans ALL users with exam attempts
 * 2. Identifies users with potentially incorrect leaderboard scores
 * 3. Fixes ALL leaderboard entries to use correct percentage values
 *
 * Run with: tsx backend/scripts/detect-and-fix-all-leaderboards.ts [env] [--dry-run]
 *
 * Options:
 *   --dry-run    Only detect issues, don't fix them
 *   env          Environment: dev or prod (default: dev)
 */

// Parse arguments: script.ts [env] [--dry-run]
const args = process.argv.slice(2).filter(arg => !arg.includes('node') && !arg.includes('.ts') && !arg.includes('tsx'));
const isDryRun = args.includes('--dry-run');
const env = args.find(arg => !arg.startsWith('--') && (arg === 'dev' || arg === 'prod')) || "dev";

process.env.TABLE_NAME = `exam-platform-data-${env}`;

import { DynamoDBClient, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME;
const client = new DynamoDBClient({ region: process.env.AWS_REGION || "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

function padScore(score: number): string {
  const invertedScore = 100000 - Math.round(score);
  return invertedScore.toString().padStart(6, "0");
}

function calculateAverage(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round((sum / scores.length) * 100) / 100;
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

interface UserIssue {
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  issues: string[];
  expectedScores: Map<string, number>;
  actualScores: Map<string, number>;
}

async function detectAndFixAllLeaderboards() {
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("  Detect and Fix ALL Leaderboard Entries");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log(`  Environment: ${env}`);
  console.log(`  Table: ${TABLE_NAME}`);
  console.log(`  Mode: ${isDryRun ? 'DRY RUN (detection only)' : 'FIX MODE (will update database)'}`);
  console.log("═══════════════════════════════════════════════════════════════════\n");

  // Step 1: Get ALL users with exam attempts
  console.log("🔍 Step 1: Finding all users with exam attempts...\n");

  const allAttempts = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "begins_with(SK, :sk)",
    ExpressionAttributeValues: { ":sk": "ATTEMPT#" }
  }));

  if (!allAttempts.Items || allAttempts.Items.length === 0) {
    console.log("✅ No exam attempts found in database\n");
    return;
  }

  console.log(`📊 Found ${allAttempts.Items.length} total exam attempts\n`);

  // Group attempts by user
  const userAttempts = new Map<string, any[]>();
  for (const attempt of allAttempts.Items) {
    const userId = attempt.PK.replace("USER#", "");
    if (!userAttempts.has(userId)) userAttempts.set(userId, []);
    userAttempts.get(userId)!.push(attempt);
  }

  console.log(`👥 Found ${userAttempts.size} unique users with attempts\n`);

  // Step 2: Check each user for issues
  console.log("🔍 Step 2: Analyzing each user's leaderboard entries...\n");

  const affectedUsers: UserIssue[] = [];
  let processedCount = 0;

  for (const [userId, attempts] of userAttempts) {
    processedCount++;

    // Get user profile
    const userProfile = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "PROFILE" }
    }));

    if (!userProfile.Items || userProfile.Items.length === 0) {
      console.log(`   ⚠️  User ${userId} has attempts but no profile`);
      continue;
    }

    const profile = userProfile.Items[0];
    if (!profile) {
      console.log(`   ⚠️  User ${userId} has no profile data`);
      continue;
    }
    const email = profile.email || "unknown";
    const firstName = profile.firstName || "Anonymous";
    const lastName = profile.lastName;
    const tier = profile.subscriptionTier === "premium" || profile.subscriptionTier === "pro" ? "premium" : "free";

    // Get user's current leaderboard entries
    const leaderboardEntries = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(PK, :pk) AND userId = :uid",
      ExpressionAttributeValues: { ":pk": "LEADERBOARD#", ":uid": userId }
    }));

    // Calculate what the correct scores should be
    const expectedScores = new Map<string, number>();
    const actualScores = new Map<string, number>();
    const issues: string[] = [];

    // Calculate expected all-time scores (best per exam)
    const examBestScores = new Map<string, number>();
    for (const attempt of attempts) {
      const examId = attempt.examId;
      const percentage = attempt.percentage || 0;
      if (!examBestScores.has(examId) || examBestScores.get(examId)! < percentage) {
        examBestScores.set(examId, percentage);
      }
    }

    for (const [examId, bestScore] of examBestScores) {
      expectedScores.set(`ALLTIME#${tier}#${examId}`, bestScore);
    }

    // Check actual leaderboard entries
    for (const entry of leaderboardEntries.Items || []) {
      const pk = entry.PK;
      const score = entry.score || entry.avgScore || 0;

      if (pk.includes("#ALLTIME#")) {
        actualScores.set(pk.replace("LEADERBOARD#", ""), score);
      }
    }

    // Compare expected vs actual
    for (const [key, expected] of expectedScores) {
      const actual = actualScores.get(key);
      if (actual === undefined) {
        issues.push(`Missing ${key} (should be ${expected}%)`);
      } else if (Math.abs(actual - expected) > 0.01) {
        issues.push(`${key}: has ${actual}% but should be ${expected}%`);
      }
    }

    // Check for entries that shouldn't exist
    for (const [key, actual] of actualScores) {
      if (!expectedScores.has(key)) {
        issues.push(`Unexpected entry ${key} with score ${actual}%`);
      }
    }

    if (issues.length > 0) {
      affectedUsers.push({
        userId,
        email,
        firstName,
        lastName,
        issues,
        expectedScores,
        actualScores
      });
      console.log(`   ❌ ${email} - ${issues.length} issues found`);
    } else {
      if (processedCount % 10 === 0) {
        console.log(`   ✅ Processed ${processedCount}/${userAttempts.size} users...`);
      }
    }

    // Small delay to avoid throttling
    if (processedCount % 20 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════════");
  console.log(`  SUMMARY: ${affectedUsers.length} users with incorrect leaderboard data`);
  console.log("═══════════════════════════════════════════════════════════════════\n");

  if (affectedUsers.length === 0) {
    console.log("✅ All leaderboard entries are correct! No fixes needed.\n");
    return;
  }

  // Display affected users
  console.log("Affected users:\n");
  for (const user of affectedUsers) {
    console.log(`📧 ${user.email} (${user.firstName} ${user.lastName || ""})`);
    for (const issue of user.issues) {
      console.log(`   - ${issue}`);
    }
    console.log();
  }

  if (isDryRun) {
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("  DRY RUN COMPLETE - No changes made");
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("\nTo fix these issues, run:");
    console.log(`  tsx backend/scripts/detect-and-fix-all-leaderboards.ts ${env}\n`);
    return;
  }

  // Step 3: Fix all affected users
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("  Step 3: Fixing all affected users...");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  let fixedCount = 0;
  for (const user of affectedUsers) {
    console.log(`\n🔧 Fixing ${user.email}...`);

    // Get user profile again for full data
    const userProfile = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: { ":pk": `USER#${user.userId}`, ":sk": "PROFILE" }
    }));
    const profile = userProfile.Items?.[0];
    if (!profile) {
      console.log(`   ⚠️  Could not load profile for ${user.email}`);
      continue;
    }
    const tier = profile.subscriptionTier === "premium" || profile.subscriptionTier === "pro" ? "premium" : "free";

    // Delete ALL existing leaderboard entries
    const existingEntries = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(PK, :pk) AND userId = :uid",
      ExpressionAttributeValues: { ":pk": "LEADERBOARD#", ":uid": user.userId }
    }));

    if (existingEntries.Items && existingEntries.Items.length > 0) {
      const batchSize = 25;
      for (let i = 0; i < existingEntries.Items.length; i += batchSize) {
        const batch = existingEntries.Items.slice(i, i + batchSize);
        const deleteRequests = batch.map((item) => ({
          DeleteRequest: { Key: { PK: { S: item.PK }, SK: { S: item.SK } } }
        }));
        await client.send(new BatchWriteItemCommand({ RequestItems: { [TABLE_NAME]: deleteRequests } }));
      }
      console.log(`   🗑️  Deleted ${existingEntries.Items.length} old entries`);
    }

    // Get user's attempts and recreate leaderboard entries
    const attempts = userAttempts.get(user.userId)!;

    // Group by timeframe
    const dailyGroups = new Map<string, any[]>();
    const weeklyGroups = new Map<string, any[]>();
    const monthlyGroups = new Map<string, any[]>();
    const allTimeByExam = new Map<string, any>();

    for (const attempt of attempts) {
      const date = attempt.date;
      const week = attempt.week || getISOWeek(new Date(date));
      const month = attempt.month || date.substring(0, 7);

      if (!dailyGroups.has(date)) dailyGroups.set(date, []);
      dailyGroups.get(date)!.push(attempt);

      if (!weeklyGroups.has(week)) weeklyGroups.set(week, []);
      weeklyGroups.get(week)!.push(attempt);

      if (!monthlyGroups.has(month)) monthlyGroups.set(month, []);
      monthlyGroups.get(month)!.push(attempt);

      const examId = attempt.examId;
      const existing = allTimeByExam.get(examId);
      if (!existing || attempt.percentage > existing.percentage) {
        allTimeByExam.set(examId, attempt);
      }
    }

    let createdCount = 0;

    // Create Daily entries
    for (const [date, dateAttempts] of dailyGroups) {
      const percentages = dateAttempts.map(a => a.percentage || 0);
      const avgPercentage = calculateAverage(percentages);
      const paddedScore = padScore(avgPercentage);

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `LEADERBOARD#DAILY#${tier}#${date}`,
          SK: `SCORE#${paddedScore}#${user.userId}`,
          GSI1PK: `LEADERBOARD#DAILY#${tier}`,
          GSI1SK: `${date}#${paddedScore}#${user.userId}`,
          userId: user.userId, firstName: user.firstName, lastName: user.lastName,
          profilePicture: profile.profilePicture,
          avgScore: avgPercentage, score: avgPercentage, percentage: avgPercentage,
          allScores: percentages, attemptCount: dateAttempts.length, tier,
          TTL: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        }
      }));
      createdCount++;
    }

    // Create Weekly entries
    for (const [week, weekAttempts] of weeklyGroups) {
      const percentages = weekAttempts.map(a => a.percentage || 0);
      const avgPercentage = calculateAverage(percentages);
      const paddedScore = padScore(avgPercentage);

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `LEADERBOARD#WEEKLY#${tier}#${week}`,
          SK: `SCORE#${paddedScore}#${user.userId}`,
          GSI1PK: `LEADERBOARD#WEEKLY#${tier}`,
          GSI1SK: `${week}#${paddedScore}#${user.userId}`,
          userId: user.userId, firstName: user.firstName, lastName: user.lastName,
          profilePicture: profile.profilePicture,
          avgScore: avgPercentage, score: avgPercentage, percentage: avgPercentage,
          allScores: percentages, attemptCount: weekAttempts.length, tier,
          TTL: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60,
        }
      }));
      createdCount++;
    }

    // Create Monthly entries
    for (const [month, monthAttempts] of monthlyGroups) {
      const percentages = monthAttempts.map(a => a.percentage || 0);
      const avgPercentage = calculateAverage(percentages);
      const paddedScore = padScore(avgPercentage);

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `LEADERBOARD#MONTHLY#${tier}#${month}`,
          SK: `SCORE#${paddedScore}#${user.userId}`,
          GSI1PK: `LEADERBOARD#MONTHLY#${tier}`,
          GSI1SK: `${month}#${paddedScore}#${user.userId}`,
          userId: user.userId, firstName: user.firstName, lastName: user.lastName,
          profilePicture: profile.profilePicture,
          avgScore: avgPercentage, score: avgPercentage, percentage: avgPercentage,
          allScores: percentages, attemptCount: monthAttempts.length, tier,
          TTL: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
        }
      }));
      createdCount++;
    }

    // Create All-Time entries
    for (const [examId, bestAttempt] of allTimeByExam) {
      const paddedScore = padScore(bestAttempt.percentage);

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `LEADERBOARD#ALLTIME#${tier}#${examId}`,
          SK: `SCORE#${paddedScore}#${user.userId}`,
          GSI1PK: `LEADERBOARD#ALLTIME#${tier}`,
          GSI1SK: `SCORE#${paddedScore}#${user.userId}#${examId}`,
          userId: user.userId, firstName: user.firstName, lastName: user.lastName,
          profilePicture: profile.profilePicture,
          examId, examTitle: bestAttempt.examTitle || examId,
          score: bestAttempt.percentage, percentage: bestAttempt.percentage,
          timeTaken: bestAttempt.timeTaken, timestamp: bestAttempt.submittedAt, tier,
        }
      }));
      createdCount++;
    }

    console.log(`   ✅ Created ${createdCount} correct entries`);
    fixedCount++;

    // Delay to avoid throttling
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log("\n═══════════════════════════════════════════════════════════════════");
  console.log(`  ✅ COMPLETE! Fixed ${fixedCount} users' leaderboard entries`);
  console.log("═══════════════════════════════════════════════════════════════════\n");
}

detectAndFixAllLeaderboards()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
