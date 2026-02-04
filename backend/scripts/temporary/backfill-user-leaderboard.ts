/**
 * Backfill User Leaderboard Script
 *
 * Recalculates and creates correct leaderboard entries for a user
 * using percentage (0-100) instead of raw score points.
 *
 * Run with: tsx backend/scripts/backfill-user-leaderboard.ts <email> [env]
 */

// Set environment variable BEFORE imports
const env = process.argv[3] || "dev";
process.env.TABLE_NAME = process.env.TABLE_NAME || `exam-platform-data-${env}`;

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
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

async function backfillUserLeaderboard(email: string) {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Backfill User Leaderboard Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Email: ${email}`);
  console.log(`  Table: ${TABLE_NAME}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Step 1: Find user by email
  console.log("🔍 Finding user by email...");
  const userScan = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "email = :email AND SK = :sk",
    ExpressionAttributeValues: { ":email": email, ":sk": "PROFILE" }
  }));

  if (!userScan.Items || userScan.Items.length === 0) {
    console.error(`❌ User not found with email: ${email}`);
    return;
  }

  const userProfile = userScan.Items[0];
  const userId = userProfile!.PK.replace("USER#", "");
  const firstName = userProfile!.firstName || "Anonymous";
  const lastName = userProfile!.lastName;
  const profilePicture = userProfile!.profilePicture;

  console.log(`✅ Found user: ${userId} (${firstName} ${lastName || ""})`);

  // Step 2: Determine subscription tier from profile or default to free
  // For simplicity, check if user has premium/pro status in profile, otherwise assume free
  const userTier = userProfile!.subscriptionTier || "free";
  const tier = userTier === "free" ? "free" : "premium";
  console.log(`   Subscription tier: ${userTier} -> leaderboard tier: ${tier}`);

  // Step 3: Get all user's attempts
  console.log("\n🔍 Getting user's exam attempts...");
  const attempts = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "ATTEMPT#" }
  }));

  if (!attempts.Items || attempts.Items.length === 0) {
    console.log("✅ No attempts to process");
    return;
  }

  console.log(`📊 Found ${attempts.Items.length} exam attempts`);
  for (const attempt of attempts.Items) {
    console.log(`   - ${attempt.date} | percentage: ${attempt.percentage}%`);
  }

  // Step 4: Group attempts by timeframe
  const dailyAttempts = new Map<string, any[]>();
  const weeklyAttempts = new Map<string, any[]>();
  const monthlyAttempts = new Map<string, any[]>();
  const examBestScores = new Map<string, any>(); // For all-time leaderboard

  for (const attempt of attempts.Items) {
    const date = attempt.date;
    const week = attempt.week || getISOWeek(new Date(date));
    const month = attempt.month || date.substring(0, 7);
    const examId = attempt.examId;
    const percentage = attempt.percentage || 0;

    if (!dailyAttempts.has(date)) dailyAttempts.set(date, []);
    dailyAttempts.get(date)!.push(attempt);

    if (!weeklyAttempts.has(week)) weeklyAttempts.set(week, []);
    weeklyAttempts.get(week)!.push(attempt);

    if (!monthlyAttempts.has(month)) monthlyAttempts.set(month, []);
    monthlyAttempts.get(month)!.push(attempt);

    // Track best score per exam for all-time leaderboard
    if (!examBestScores.has(examId) || examBestScores.get(examId)!.percentage < percentage) {
      examBestScores.set(examId, attempt);
    }
  }

  // Step 5: Create correct leaderboard entries using PERCENTAGE
  console.log("\n♻️  Creating correct leaderboard entries using PERCENTAGE...\n");

  // Daily leaderboards
  for (const [date, dateAttempts] of dailyAttempts) {
    const percentages = dateAttempts.map(a => a.percentage || 0);
    const avgPercentage = calculateAverage(percentages);
    const paddedScore = padScore(avgPercentage);

    const item = {
      PK: `LEADERBOARD#DAILY#${tier}#${date}`,
      SK: `SCORE#${paddedScore}#${userId}`,
      GSI1PK: `LEADERBOARD#DAILY#${tier}`,
      GSI1SK: `${date}#${paddedScore}#${userId}`,
      userId,
      firstName,
      lastName,
      profilePicture,
      avgScore: avgPercentage,
      score: avgPercentage,
      percentage: avgPercentage,
      allScores: percentages,
      attemptCount: dateAttempts.length,
      tier,
      TTL: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    console.log(`   ✅ Daily (${date}): avgPercentage = ${avgPercentage}%`);
  }

  // Weekly leaderboards
  for (const [week, weekAttemptsList] of weeklyAttempts) {
    const percentages = weekAttemptsList.map(a => a.percentage || 0);
    const avgPercentage = calculateAverage(percentages);
    const paddedScore = padScore(avgPercentage);

    const item = {
      PK: `LEADERBOARD#WEEKLY#${tier}#${week}`,
      SK: `SCORE#${paddedScore}#${userId}`,
      GSI1PK: `LEADERBOARD#WEEKLY#${tier}`,
      GSI1SK: `${week}#${paddedScore}#${userId}`,
      userId,
      firstName,
      lastName,
      profilePicture,
      avgScore: avgPercentage,
      score: avgPercentage,
      percentage: avgPercentage,
      allScores: percentages,
      attemptCount: weekAttemptsList.length,
      tier,
      TTL: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    console.log(`   ✅ Weekly (${week}): avgPercentage = ${avgPercentage}%`);
  }

  // Monthly leaderboards
  for (const [month, monthAttemptsList] of monthlyAttempts) {
    const percentages = monthAttemptsList.map(a => a.percentage || 0);
    const avgPercentage = calculateAverage(percentages);
    const paddedScore = padScore(avgPercentage);

    const item = {
      PK: `LEADERBOARD#MONTHLY#${tier}#${month}`,
      SK: `SCORE#${paddedScore}#${userId}`,
      GSI1PK: `LEADERBOARD#MONTHLY#${tier}`,
      GSI1SK: `${month}#${paddedScore}#${userId}`,
      userId,
      firstName,
      lastName,
      profilePicture,
      avgScore: avgPercentage,
      score: avgPercentage,
      percentage: avgPercentage,
      allScores: percentages,
      attemptCount: monthAttemptsList.length,
      tier,
      TTL: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    console.log(`   ✅ Monthly (${month}): avgPercentage = ${avgPercentage}%`);
  }

  // All-time leaderboards (best score per exam)
  for (const [examId, bestAttempt] of examBestScores) {
    const percentage = bestAttempt.percentage || 0;
    const paddedScore = padScore(percentage);

    const item = {
      PK: `LEADERBOARD#ALLTIME#${tier}#${examId}`,
      SK: `SCORE#${paddedScore}#${userId}`,
      GSI1PK: `LEADERBOARD#ALLTIME#${tier}`,
      GSI1SK: `SCORE#${paddedScore}#${userId}#${examId}`,
      userId,
      firstName,
      lastName,
      profilePicture,
      examId,
      examTitle: bestAttempt.examTitle || "Unknown Exam",
      score: percentage,
      percentage,
      timeTaken: bestAttempt.timeTaken,
      timestamp: bestAttempt.timestamp,
      tier,
      // No TTL for all-time leaderboard
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    console.log(`   ✅ All-time (${examId}): best percentage = ${percentage}%`);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ✅ Backfill complete! User now has correct leaderboard entries.");
  console.log("═══════════════════════════════════════════════════════════\n");
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx backend/scripts/backfill-user-leaderboard.ts <email> [env]");
  process.exit(1);
}

backfillUserLeaderboard(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
