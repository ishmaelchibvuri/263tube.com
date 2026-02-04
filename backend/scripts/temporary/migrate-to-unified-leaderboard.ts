/**
 * Migration Script: Migrate Tier-Based Leaderboards to Unified Leaderboard
 *
 * This script:
 * 1. Reads all entries from old tier-based leaderboards (free and premium)
 * 2. Merges them into new unified leaderboard structure
 * 3. Removes duplicate users (keeps highest score per user per timeframe)
 * 4. Deletes old tier-based entries
 *
 * Run this ONCE after deploying the new unified leaderboard code
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";

interface LeaderboardEntry {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  userId: string;
  firstName: string;
  lastName?: string;
  profilePicture?: string;
  score: number;
  totalPoints?: number;
  tier?: string;
  [key: string]: any;
}

async function queryLeaderboard(gsi1pk: string): Promise<LeaderboardEntry[]> {
  const entries: LeaderboardEntry[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": gsi1pk,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (response.Items) {
      entries.push(...(response.Items as LeaderboardEntry[]));
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return entries;
}

async function migrateLeaderboardType(type: "DAILY" | "WEEKLY" | "MONTHLY" | "ALLTIME") {
  console.log(`\n=== Migrating ${type} Leaderboard ===`);

  // Query both tiers
  const [freeEntries, premiumEntries] = await Promise.all([
    queryLeaderboard(`LEADERBOARD#${type}#free`),
    queryLeaderboard(`LEADERBOARD#${type}#premium`),
  ]);

  console.log(`Found ${freeEntries.length} free tier entries`);
  console.log(`Found ${premiumEntries.length} premium tier entries`);

  // Combine all entries
  const allEntries = [...freeEntries, ...premiumEntries];

  if (allEntries.length === 0) {
    console.log(`No entries to migrate for ${type}`);
    return;
  }

  // Group by timeframe and userId - keep highest score per user per timeframe
  const groupedByTimeframe = new Map<string, Map<string, LeaderboardEntry>>();

  for (const entry of allEntries) {
    // Extract timeframe from old PK format: LEADERBOARD#TYPE#tier#timeframe
    const pkParts = entry.PK.split("#");
    const timeframe = pkParts[3]; // e.g., "2025-01-15" or "2025-W03"

    if (!timeframe) {
      console.warn(`Could not extract timeframe from PK: ${entry.PK}`);
      continue;
    }

    if (!groupedByTimeframe.has(timeframe)) {
      groupedByTimeframe.set(timeframe, new Map());
    }

    const timeframeMap = groupedByTimeframe.get(timeframe)!;
    const existing = timeframeMap.get(entry.userId);
    const entryScore = entry.totalPoints || entry.score || 0;
    const existingScore = existing ? (existing.totalPoints || existing.score || 0) : 0;

    // Keep entry with higher score
    if (!existing || entryScore > existingScore) {
      timeframeMap.set(entry.userId, entry);
    }
  }

  // Write new unified entries
  let migratedCount = 0;
  for (const [timeframe, userMap] of groupedByTimeframe.entries()) {
    console.log(`Migrating ${userMap.size} unique users for ${type} ${timeframe}`);

    // Sort by score descending to get correct SK ordering
    const sortedEntries = Array.from(userMap.values()).sort((a, b) => {
      const scoreA = a.totalPoints || a.score || 0;
      const scoreB = b.totalPoints || b.score || 0;
      return scoreB - scoreA;
    });

    for (const entry of sortedEntries) {
      const score = entry.totalPoints || entry.score || 0;
      const paddedScore = padScore(score);

      // Create new unified entry
      const newEntry = {
        ...entry,
        PK: `LEADERBOARD#${type}#${timeframe}`,
        SK: `SCORE#${paddedScore}#${entry.userId}`,
        GSI1PK: `LEADERBOARD#${type}`,
        GSI1SK: `${timeframe}#${paddedScore}#${entry.userId}`,
      };

      // Remove old tier field if it exists
      delete newEntry.tier;

      // Write new entry
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: newEntry,
        })
      );

      migratedCount++;

      // Delete old entry
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: entry.PK,
            SK: entry.SK,
          },
        })
      );
    }
  }

  console.log(`✓ Migrated ${migratedCount} entries for ${type}`);
}

function padScore(score: number): string {
  // Same logic as in leaderboard-calculator.ts
  const invertedScore = 10000000 - Math.round(score);
  return invertedScore.toString().padStart(8, "0");
}

async function main() {
  console.log("Starting leaderboard migration to unified structure...");
  console.log(`Target table: ${TABLE_NAME}`);

  try {
    // Migrate each leaderboard type
    await migrateLeaderboardType("DAILY");
    await migrateLeaderboardType("WEEKLY");
    await migrateLeaderboardType("MONTHLY");
    await migrateLeaderboardType("ALLTIME");

    console.log("\n✅ Migration completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Verify the new unified leaderboards are working correctly");
    console.log("2. Test the frontend to ensure it displays correctly");
    console.log("3. Monitor for any issues with new exam submissions");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
