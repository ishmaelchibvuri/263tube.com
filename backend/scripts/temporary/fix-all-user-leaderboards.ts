/**
 * Fix ALL User Leaderboard Entries Script
 *
 * Deletes ALL incorrect leaderboard entries and recreates them with correct percentage values.
 * This includes: Daily, Weekly, Monthly, AND All-Time entries.
 */

// Set environment variable BEFORE imports
const env = process.argv[3] || "dev";
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

async function fixAllUserLeaderboards(email: string) {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Fix ALL User Leaderboard Entries");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Email: ${email}`);
  console.log(`  Table: ${TABLE_NAME}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Step 1: Find user
  console.log("🔍 Finding user by email...");
  const userScan = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "email = :email AND SK = :sk",
    ExpressionAttributeValues: { ":email": email, ":sk": "PROFILE" }
  }));

  if (!userScan.Items || userScan.Items.length === 0) {
    console.error(`❌ User not found: ${email}`);
    return;
  }

  const userProfile = userScan.Items[0];
  const userId = userProfile!.PK.replace("USER#", "");
  const firstName = userProfile!.firstName || "Anonymous";
  const lastName = userProfile!.lastName;
  const profilePicture = userProfile!.profilePicture;
  const tier = userProfile!.subscriptionTier === "premium" || userProfile!.subscriptionTier === "pro" ? "premium" : "free";

  console.log(`✅ Found user: ${userId} (${firstName} ${lastName || ""})`);
  console.log(`   Tier: ${tier}\n`);

  // Step 2: Delete ALL existing leaderboard entries
  console.log("🔍 Finding ALL current leaderboard entries...");
  const existingEntries = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "begins_with(PK, :pk) AND userId = :uid",
    ExpressionAttributeValues: { ":pk": "LEADERBOARD#", ":uid": userId }
  }));

  console.log(`📊 Found ${existingEntries.Items?.length || 0} existing entries:`);
  for (const item of existingEntries.Items || []) {
    console.log(`   ❌ ${item.PK} | score: ${item.score || item.avgScore}`);
  }

  if (existingEntries.Items && existingEntries.Items.length > 0) {
    console.log("\n🗑️  Deleting ALL incorrect entries...");
    const batchSize = 25;
    for (let i = 0; i < existingEntries.Items.length; i += batchSize) {
      const batch = existingEntries.Items.slice(i, i + batchSize);
      const deleteRequests = batch.map((item) => ({
        DeleteRequest: { Key: { PK: { S: item.PK }, SK: { S: item.SK } } }
      }));
      await client.send(new BatchWriteItemCommand({ RequestItems: { [TABLE_NAME]: deleteRequests } }));
    }
    console.log(`✅ Deleted ${existingEntries.Items.length} entries\n`);
  }

  // Step 3: Get user's attempts
  console.log("🔍 Getting user's exam attempts...");
  const attempts = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "ATTEMPT#" }
  }));

  if (!attempts.Items || attempts.Items.length === 0) {
    console.log("✅ No attempts found\n");
    return;
  }

  console.log(`📊 Found ${attempts.Items.length} attempts:`);
  for (const a of attempts.Items) {
    console.log(`   - ${a.date} | ${a.examTitle || a.examId} | percentage: ${a.percentage}%`);
  }

  // Step 4: Group attempts and create ALL leaderboard entries
  console.log("\n♻️  Creating CORRECT leaderboard entries using PERCENTAGE...\n");

  // Group by timeframe
  const dailyGroups = new Map<string, any[]>();
  const weeklyGroups = new Map<string, any[]>();
  const monthlyGroups = new Map<string, any[]>();
  const allTimeByExam = new Map<string, any>();

  for (const attempt of attempts.Items) {
    const date = attempt.date;
    const week = attempt.week || getISOWeek(new Date(date));
    const month = attempt.month || date.substring(0, 7);

    // Daily
    if (!dailyGroups.has(date)) dailyGroups.set(date, []);
    dailyGroups.get(date)!.push(attempt);

    // Weekly
    if (!weeklyGroups.has(week)) weeklyGroups.set(week, []);
    weeklyGroups.get(week)!.push(attempt);

    // Monthly
    if (!monthlyGroups.has(month)) monthlyGroups.set(month, []);
    monthlyGroups.get(month)!.push(attempt);

    // All-Time (best score per exam)
    const examId = attempt.examId;
    const existing = allTimeByExam.get(examId);
    if (!existing || attempt.percentage > existing.percentage) {
      allTimeByExam.set(examId, attempt);
    }
  }

  // Create Daily entries
  for (const [date, dateAttempts] of dailyGroups) {
    const percentages = dateAttempts.map(a => a.percentage || 0);
    const avgPercentage = calculateAverage(percentages);
    const paddedScore = padScore(avgPercentage);

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `LEADERBOARD#DAILY#${tier}#${date}`,
        SK: `SCORE#${paddedScore}#${userId}`,
        GSI1PK: `LEADERBOARD#DAILY#${tier}`,
        GSI1SK: `${date}#${paddedScore}#${userId}`,
        userId, firstName, lastName, profilePicture,
        avgScore: avgPercentage, score: avgPercentage, percentage: avgPercentage,
        allScores: percentages, attemptCount: dateAttempts.length, tier,
        TTL: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      }
    }));
    console.log(`   ✅ Daily (${date}): ${avgPercentage}%`);
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
        SK: `SCORE#${paddedScore}#${userId}`,
        GSI1PK: `LEADERBOARD#WEEKLY#${tier}`,
        GSI1SK: `${week}#${paddedScore}#${userId}`,
        userId, firstName, lastName, profilePicture,
        avgScore: avgPercentage, score: avgPercentage, percentage: avgPercentage,
        allScores: percentages, attemptCount: weekAttempts.length, tier,
        TTL: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60,
      }
    }));
    console.log(`   ✅ Weekly (${week}): ${avgPercentage}%`);
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
        SK: `SCORE#${paddedScore}#${userId}`,
        GSI1PK: `LEADERBOARD#MONTHLY#${tier}`,
        GSI1SK: `${month}#${paddedScore}#${userId}`,
        userId, firstName, lastName, profilePicture,
        avgScore: avgPercentage, score: avgPercentage, percentage: avgPercentage,
        allScores: percentages, attemptCount: monthAttempts.length, tier,
        TTL: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      }
    }));
    console.log(`   ✅ Monthly (${month}): ${avgPercentage}%`);
  }

  // Create All-Time entries (best score per exam)
  for (const [examId, bestAttempt] of allTimeByExam) {
    const paddedScore = padScore(bestAttempt.percentage);

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `LEADERBOARD#ALLTIME#${tier}#${examId}`,
        SK: `SCORE#${paddedScore}#${userId}`,
        GSI1PK: `LEADERBOARD#ALLTIME#${tier}`,
        GSI1SK: `SCORE#${paddedScore}#${userId}#${examId}`,
        userId, firstName, lastName, profilePicture,
        examId, examTitle: bestAttempt.examTitle || examId,
        score: bestAttempt.percentage, percentage: bestAttempt.percentage,
        timeTaken: bestAttempt.timeTaken, timestamp: bestAttempt.submittedAt, tier,
      }
    }));
    console.log(`   ✅ All-Time (${examId}): ${bestAttempt.percentage}%`);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ✅ ALL leaderboard entries fixed!");
  console.log("═══════════════════════════════════════════════════════════\n");
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx backend/scripts/fix-all-user-leaderboards.ts <email> [env]");
  process.exit(1);
}

fixAllUserLeaderboards(email).then(() => process.exit(0)).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
