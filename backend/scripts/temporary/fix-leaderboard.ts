/**
 * Migration Script: Fix Leaderboard Entries
 *
 * This script:
 * 1. Updates verified users to have showOnLeaderboard: true
 * 2. Backfills leaderboard entries for existing exam attempts
 *
 * Run with: npx ts-node backend/scripts/fix-leaderboard.ts
 */

import { DatabaseService, DatabaseHelpers } from "../../lib/database";
import { LeaderboardCalculator } from "../../lib/leaderboard-calculator";

async function main() {
  console.log("🔧 Starting leaderboard fix migration...\n");

  // Step 1: Fix user profiles
  console.log("📋 Step 1: Updating user profiles with showOnLeaderboard flag");
  await fixUserProfiles();

  // Step 2: Backfill leaderboard entries
  console.log(
    "\n📋 Step 2: Backfilling leaderboard entries from exam attempts"
  );
  await backfillLeaderboardEntries();

  console.log("\n✅ Migration completed successfully!");
}

async function fixUserProfiles() {
  console.log("Scanning for all users to set showOnLeaderboard...");

  // Get all user profiles
  const users = await DatabaseService.scanItems(
    "begins_with(PK, :pk) AND SK = :sk",
    {
      ":pk": "USER#",
      ":sk": "PROFILE",
    }
  );

  console.log(`Found ${users.length} total users`);

  let updatedCount = 0;

  for (const user of users) {
    // All users should have showOnLeaderboard set to true by default
    // (they can opt out later if they want)
    const needsUpdate =
      user.showOnLeaderboard !== true && user.showOnLeaderboard !== false;

    if (needsUpdate) {
      console.log(
        `  Updating user ${user.email} to show on leaderboard by default`
      );

      await DatabaseHelpers.updateUserProfile(user.userId, {
        showOnLeaderboard: true,
        updatedAt: new Date().toISOString(),
      });

      updatedCount++;
    }
  }

  console.log(`✅ Updated ${updatedCount} user profiles`);
}

async function backfillLeaderboardEntries() {
  console.log("Scanning for exam attempts to backfill...");

  // Get all exam attempts
  const attempts = await DatabaseService.scanItems("begins_with(SK, :sk)", {
    ":sk": "ATTEMPT#",
  });

  console.log(`Found ${attempts.length} total exam attempts`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const attempt of attempts) {
    try {
      // Check if this is a full exam attempt (not a custom quiz)
      if (!attempt.examId || attempt.examId.startsWith("CUSTOM_")) {
        skippedCount++;
        continue;
      }

      // Get user profile
      const userProfile = await DatabaseService.getItem(
        `USER#${attempt.userId}`,
        "PROFILE"
      );

      if (!userProfile) {
        console.log(
          `  ⚠️  User profile not found for attempt ${attempt.attemptId}`
        );
        skippedCount++;
        continue;
      }

      // Skip if user explicitly opted out of leaderboard
      if (userProfile.showOnLeaderboard === false) {
        console.log(`  ⏭️  User ${userProfile.email} opted out of leaderboard`);
        skippedCount++;
        continue;
      }

      console.log(
        `  Processing attempt ${attempt.attemptId} for user ${userProfile.email}`
      );

      // Prepare attempt data for leaderboard calculator
      const attemptData = {
        userId: attempt.userId,
        examId: attempt.examId,
        examTitle: attempt.examTitle || "Exam",
        score: attempt.score || 0,
        percentage: attempt.percentage || 0,
        timeTaken: attempt.timeTaken || 0,
        timestamp: attempt.submittedAt || attempt.createdAt,
        date:
          attempt.date ||
          new Date(attempt.submittedAt || attempt.createdAt)
            .toISOString()
            .split("T")[0],
        week:
          attempt.week ||
          getISOWeek(new Date(attempt.submittedAt || attempt.createdAt)),
        month:
          attempt.month ||
          new Date(attempt.submittedAt || attempt.createdAt)
            .toISOString()
            .substring(0, 7),
        year:
          attempt.year ||
          new Date(attempt.submittedAt || attempt.createdAt)
            .getFullYear()
            .toString(),
      };

      // Update leaderboards
      await LeaderboardCalculator.updateLeaderboards(attemptData);

      processedCount++;

      // Add small delay to avoid throttling
      if (processedCount % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(
        `  ❌ Error processing attempt ${attempt.attemptId}:`,
        error
      );
      errorCount++;
    }
  }

  console.log(`✅ Processed ${processedCount} exam attempts`);
  console.log(`⏭️  Skipped ${skippedCount} attempts`);
  console.log(`❌ Errors: ${errorCount}`);
}

function getISOWeek(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

// Run the migration
main().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
