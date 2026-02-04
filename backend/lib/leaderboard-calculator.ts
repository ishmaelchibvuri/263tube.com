import { DatabaseService, DynamoDBItem } from "./database";
import { SubscriptionTier } from "./types";

// Points awarded per correct answer
export const POINTS_PER_CORRECT_ANSWER = 10;

export interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName?: string;
  profilePicture?: string;
  examId: string;
  examTitle: string;
  score: number;
  percentage: number;
  timeTaken: number;
  timestamp: string;
  rank: number;
  tier?: SubscriptionTier;
  totalPoints?: number; // Total points earned in the period
}

export interface WeeklyLeaderboardEntry {
  userId: string;
  firstName: string;
  avgScore: number;
  bestScores: number[];
  attemptCount: number;
  rank: number;
  totalPoints?: number;
}

export class LeaderboardCalculator {
  static async updateLeaderboards(attempt: any): Promise<void> {
    const {
      userId,
      examId,
      examTitle,
      score,
      percentage,
      timeTaken,
      timestamp,
      date,
      week,
      month,
      year,
    } = attempt;

    // Get user profile for first name
    const userProfile = await DatabaseService.getItem(
      `USER#${userId}`,
      "PROFILE"
    );
    if (!userProfile) {
      console.log("User profile not found");
      return;
    }

    // All logged-in users are verified (they had to activate/verify to login)
    // Only skip if user explicitly opted out of leaderboard
    if (userProfile.showOnLeaderboard === false) {
      console.log(`User ${userId} explicitly opted out of leaderboard`);
      return;
    }

    const firstName = userProfile.firstName || "Anonymous";
    const lastName = userProfile.lastName;
    const profilePicture = userProfile.profilePicture;

    // Update daily leaderboard
    await this.updateDailyLeaderboard({
      userId,
      firstName,
      lastName,
      profilePicture,
      examId,
      examTitle,
      score,
      percentage,
      timeTaken,
      timestamp,
      date,
    });

    // Update weekly leaderboard
    await this.updateWeeklyLeaderboard({
      userId,
      firstName,
      lastName,
      profilePicture,
      examId,
      score,
      week,
    });

    // Update monthly leaderboard
    await this.updateMonthlyLeaderboard({
      userId,
      firstName,
      lastName,
      profilePicture,
      examId,
      score,
      month,
    });

    // Update all-time leaderboard
    await this.updateAllTimeLeaderboard({
      userId,
      firstName,
      lastName,
      profilePicture,
      examId,
      examTitle,
      score,
      percentage,
      timeTaken,
      timestamp,
    });
  }

  private static async updateDailyLeaderboard(entry: any): Promise<void> {
    // Get user's attempts for this day
    const dayAttempts = await this.getUserDayAttempts(
      entry.userId,
      entry.date
    );
    // Calculate total points: sum of (correctAnswers * POINTS_PER_CORRECT_ANSWER)
    const totalPoints = dayAttempts.reduce((sum, attempt) => {
      const correctAnswers = attempt.correctAnswers || attempt.score || 0;
      return sum + (correctAnswers * POINTS_PER_CORRECT_ANSWER);
    }, 0);

    if (totalPoints === 0) return; // No valid attempts

    const pk = `LEADERBOARD#DAILY#${entry.date}`;

    // Delete any existing entry for this user (score may have changed)
    await this.deleteUserLeaderboardEntry(pk, entry.userId);

    const paddedScore = this.padScore(totalPoints);
    const item: DynamoDBItem = {
      PK: pk,
      SK: `SCORE#${paddedScore}#${entry.userId}`,
      GSI1PK: `LEADERBOARD#DAILY`,
      GSI1SK: `${entry.date}#${paddedScore}#${entry.userId}`,
      userId: entry.userId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      profilePicture: entry.profilePicture,
      totalPoints,
      score: totalPoints, // Total points for ranking
      percentage: 0, // Not used for points-based leaderboard
      allScores: dayAttempts.map(a => (a.correctAnswers || a.score || 0) * POINTS_PER_CORRECT_ANSWER),
      attemptCount: dayAttempts.length,
      TTL: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    await DatabaseService.putItem(item);
  }

  private static async updateWeeklyLeaderboard(entry: any): Promise<void> {
    // Get user's attempts for this week
    const weekAttempts = await this.getUserWeekAttempts(
      entry.userId,
      entry.week
    );
    // Calculate total points: sum of (correctAnswers * POINTS_PER_CORRECT_ANSWER)
    const totalPoints = weekAttempts.reduce((sum, attempt) => {
      const correctAnswers = attempt.correctAnswers || attempt.score || 0;
      return sum + (correctAnswers * POINTS_PER_CORRECT_ANSWER);
    }, 0);

    if (totalPoints === 0) return; // No valid attempts

    const pk = `LEADERBOARD#WEEKLY#${entry.week}`;

    // Delete any existing entry for this user (score may have changed)
    await this.deleteUserLeaderboardEntry(pk, entry.userId);

    const paddedScore = this.padScore(totalPoints);
    const item: DynamoDBItem = {
      PK: pk,
      SK: `SCORE#${paddedScore}#${entry.userId}`,
      GSI1PK: `LEADERBOARD#WEEKLY`,
      GSI1SK: `${entry.week}#${paddedScore}#${entry.userId}`,
      userId: entry.userId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      profilePicture: entry.profilePicture,
      totalPoints,
      score: totalPoints, // Total points for ranking
      percentage: 0, // Not used for points-based leaderboard
      allScores: weekAttempts.map(a => (a.correctAnswers || a.score || 0) * POINTS_PER_CORRECT_ANSWER),
      attemptCount: weekAttempts.length,
      TTL: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60, // 60 days
    };

    await DatabaseService.putItem(item);
  }

  private static async updateMonthlyLeaderboard(entry: any): Promise<void> {
    // Get user's attempts for this month
    const monthAttempts = await this.getUserMonthAttempts(
      entry.userId,
      entry.month
    );
    // Calculate total points: sum of (correctAnswers * POINTS_PER_CORRECT_ANSWER)
    const totalPoints = monthAttempts.reduce((sum, attempt) => {
      const correctAnswers = attempt.correctAnswers || attempt.score || 0;
      return sum + (correctAnswers * POINTS_PER_CORRECT_ANSWER);
    }, 0);

    if (totalPoints === 0) return; // No valid attempts

    const pk = `LEADERBOARD#MONTHLY#${entry.month}`;

    // Delete any existing entry for this user (score may have changed)
    await this.deleteUserLeaderboardEntry(pk, entry.userId);

    const paddedScore = this.padScore(totalPoints);
    const item: DynamoDBItem = {
      PK: pk,
      SK: `SCORE#${paddedScore}#${entry.userId}`,
      GSI1PK: `LEADERBOARD#MONTHLY`,
      GSI1SK: `${entry.month}#${paddedScore}#${entry.userId}`,
      userId: entry.userId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      profilePicture: entry.profilePicture,
      totalPoints,
      score: totalPoints, // Total points for ranking
      percentage: 0, // Not used for points-based leaderboard
      allScores: monthAttempts.map(a => (a.correctAnswers || a.score || 0) * POINTS_PER_CORRECT_ANSWER),
      attemptCount: monthAttempts.length,
      TTL: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days
    };

    await DatabaseService.putItem(item);
  }

  private static async updateAllTimeLeaderboard(entry: any): Promise<void> {
    // Get ALL user's attempts across all exams
    const allAttempts = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${entry.userId}`,
        ":sk": "ATTEMPT#",
      },
      undefined,
      undefined,
      false
    );

    // Calculate total points: sum of (correctAnswers * POINTS_PER_CORRECT_ANSWER) across ALL attempts
    const totalPoints = allAttempts.reduce((sum, attempt) => {
      const correctAnswers = attempt.correctAnswers || attempt.score || 0;
      return sum + (correctAnswers * POINTS_PER_CORRECT_ANSWER);
    }, 0);

    if (totalPoints === 0) return; // No valid attempts

    // Check if user crossed 20,000 points threshold (Hall of Fame)
    await this.checkHallOfFameEntry(entry.userId, totalPoints);

    const pk = `LEADERBOARD#ALLTIME`;

    // Delete any existing entry for this user (score may have changed)
    await this.deleteUserLeaderboardEntry(pk, entry.userId);

    const paddedScore = this.padScore(totalPoints);
    const item: DynamoDBItem = {
      PK: pk,
      SK: `SCORE#${paddedScore}#${entry.userId}`,
      GSI1PK: `LEADERBOARD#ALLTIME`,
      GSI1SK: `SCORE#${paddedScore}#${entry.userId}`,
      userId: entry.userId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      profilePicture: entry.profilePicture,
      totalPoints,
      score: totalPoints, // Total points for ranking
      allScores: allAttempts.map(a => (a.correctAnswers || a.score || 0) * POINTS_PER_CORRECT_ANSWER),
      attemptCount: allAttempts.length,
      // No TTL for all-time leaderboard
    };

    await DatabaseService.putItem(item);
    console.log(
      `Updated all-time leaderboard entry for user ${entry.userId} with ${totalPoints} total points from ${allAttempts.length} attempts`
    );
  }

  // Hall of Fame threshold
  private static readonly HALL_OF_FAME_THRESHOLD = 20000;

  /**
   * Check if user has crossed Hall of Fame threshold and record the timestamp
   */
  private static async checkHallOfFameEntry(
    userId: string,
    currentTotalPoints: number
  ): Promise<void> {
    if (currentTotalPoints < this.HALL_OF_FAME_THRESHOLD) {
      return; // User hasn't reached threshold yet
    }

    // Get user profile to check if they've already been marked as Hall of Fame member
    const userProfile = await DatabaseService.getItem(
      `USER#${userId}`,
      "PROFILE"
    );

    if (!userProfile) {
      console.log(`User profile not found for ${userId}`);
      return;
    }

    // If user already has Hall of Fame entry timestamp, don't update it
    if (userProfile.hallOfFameEnteredAt) {
      return; // Already tracked
    }

    // User just crossed threshold! Record the timestamp
    const now = new Date().toISOString();

    await DatabaseService.updateItem(
      `USER#${userId}`,
      "PROFILE",
      "SET hallOfFameEnteredAt = :timestamp, hallOfFamePoints = :points",
      {
        ":timestamp": now,
        ":points": currentTotalPoints,
      }
    );

    console.log(
      `🏆 User ${userId} entered Hall of Fame with ${currentTotalPoints} points at ${now}`
    );
  }

  private static async deleteUserLeaderboardEntry(
    pk: string,
    userId: string
  ): Promise<void> {
    // Query for all entries in this leaderboard partition
    const entries = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": pk,
        ":sk": "SCORE#",
      },
      undefined,
      undefined,
      false
    );

    // Find and delete any existing entry for this user
    const userEntry = entries.find((entry) => entry.userId === userId);
    if (userEntry) {
      await DatabaseService.deleteItem(userEntry.PK, userEntry.SK);
      console.log(`Deleted old leaderboard entry for user ${userId} in ${pk}`);
    }
  }

  private static async getUserDayAttempts(
    userId: string,
    date: string
  ): Promise<any[]> {
    const attempts = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${userId}`,
        ":sk": "ATTEMPT#",
      },
      undefined,
      undefined,
      false
    );

    return attempts.filter((attempt) => attempt.date === date);
  }

  private static async getUserWeekAttempts(
    userId: string,
    week: string
  ): Promise<any[]> {
    // FIX: Use correct parameter format
    const attempts = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${userId}`,
        ":sk": "ATTEMPT#",
      },
      undefined,
      undefined,
      false
    );

    return attempts.filter((attempt) => attempt.week === week);
  }

  private static async getUserMonthAttempts(
    userId: string,
    month: string
  ): Promise<any[]> {
    // FIX: Use correct parameter format
    const attempts = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${userId}`,
        ":sk": "ATTEMPT#",
      },
      undefined,
      undefined,
      false
    );

    return attempts.filter((attempt) => attempt.month === month);
  }

  private static getTopScores(attempts: any[], count: number): number[] {
    return attempts
      .map((attempt) => attempt.score || 0)
      .sort((a, b) => b - a)
      .slice(0, count);
  }

  private static calculateAverage(scores: number[]): number {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / scores.length) * 100) / 100;
  }

  private static padScore(score: number): string {
    // Pad score to 8 digits for proper sorting
    // Use inverted score for descending sort (10000000 - score)
    // Increased to 10M to support large point totals (e.g., 5000 points -> "09995000")
    const invertedScore = 10000000 - Math.round(score);
    return invertedScore.toString().padStart(8, "0");
  }

  static async getUserRank(
    userId: string,
    leaderboardType: string,
    timeframe: string
  ): Promise<number> {
    let pk: string;

    switch (leaderboardType) {
      case "daily":
        pk = `LEADERBOARD#DAILY#${timeframe}`;
        break;
      case "weekly":
        pk = `LEADERBOARD#WEEKLY#${timeframe}`;
        break;
      case "monthly":
        pk = `LEADERBOARD#MONTHLY#${timeframe}`;
        break;
      case "alltime":
        pk = `LEADERBOARD#ALLTIME`; // Unified all-time leaderboard
        break;
      default:
        throw new Error("Invalid leaderboard type");
    }

    const entries = await DatabaseService.queryItems(
      "PK = :pk",
      { ":pk": pk },
      undefined,
      undefined,
      true // Sort ascending for proper ranking
    );

    const userIndex = entries.findIndex((entry) => entry.userId === userId);
    return userIndex >= 0 ? userIndex + 1 : -1; // Return -1 if user not found
  }

  static async getLeaderboardEntries(
    leaderboardType: string,
    timeframe: string,
    limit: number = 20
  ): Promise<LeaderboardEntry[]> {
    let entries: any[];

    switch (leaderboardType) {
      case "daily":
        if (!timeframe) {
          timeframe = new Date().toISOString().split("T")[0]!;
        }
        entries = await DatabaseService.queryItems(
          "PK = :pk",
          { ":pk": `LEADERBOARD#DAILY#${timeframe}` },
          undefined,
          limit,
          true
        );
        break;

      case "weekly":
        if (!timeframe) {
          timeframe = this.getISOWeek(new Date());
        }
        entries = await DatabaseService.queryItems(
          "PK = :pk",
          { ":pk": `LEADERBOARD#WEEKLY#${timeframe}` },
          undefined,
          limit,
          true
        );
        break;

      case "monthly":
        if (!timeframe) {
          timeframe = new Date().toISOString().substring(0, 7);
        }
        entries = await DatabaseService.queryItems(
          "PK = :pk",
          { ":pk": `LEADERBOARD#MONTHLY#${timeframe}` },
          undefined,
          limit,
          true
        );
        break;

      case "alltime":
        console.log(`=== QUERYING ALL-TIME LEADERBOARD ===`);
        // Query unified all-time leaderboard
        entries = await DatabaseService.queryItems(
          "PK = :pk",
          { ":pk": `LEADERBOARD#ALLTIME` },
          undefined,
          limit,
          true // Sort ascending (since we inverted scores)
        );
        console.log(`Retrieved ${entries.length} entries from all-time leaderboard`);
        break;

      default:
        throw new Error("Invalid leaderboard type");
    }

    // Deduplicate entries: keep only the highest score per user
    // This is needed for daily/weekly/monthly where users may have multiple entries
    // AllTime now has one entry per user, so no deduplication needed
    if (leaderboardType !== "alltime") {
      console.log(`Deduplicating ${entries.length} entries before ranking`);

      const userBestScores = new Map<string, any>();
      for (const entry of entries) {
        const existing = userBestScores.get(entry.userId);
        const entryScore = entry.score || entry.avgScore || 0;
        const existingScore = existing ? (existing.score || existing.avgScore || 0) : 0;

        if (!existing || entryScore > existingScore) {
          userBestScores.set(entry.userId, entry);
        }
      }

      console.log(`Deduplicated to ${userBestScores.size} unique users`);

      // Convert back to array and sort by score descending
      entries = Array.from(userBestScores.values())
        .sort((a, b) => {
          const scoreA = a.score || a.avgScore || 0;
          const scoreB = b.score || b.avgScore || 0;
          return scoreB - scoreA;
        })
        .slice(0, limit);
    }

    return entries.map((entry, index) => ({
      userId: entry.userId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      profilePicture: entry.profilePicture,
      examId: entry.examId,
      examTitle: entry.examTitle,
      score: entry.score || entry.avgScore || entry.totalPoints || 0,
      percentage: entry.percentage || 0,
      timeTaken: entry.timeTaken || 0,
      timestamp: entry.timestamp,
      rank: index + 1,
      totalPoints: entry.totalPoints || entry.score || entry.avgScore || 0, // Include totalPoints for points-based ranking
    }));
  }

  private static getISOWeek(date: Date): string {
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
}
