import { DatabaseService } from "./database";
import { ExamTrackingData } from "./types";

/**
 * Exam Tracking Database Helpers
 *
 * Manages exam date tracking, rewards, and CareerKit unlock system
 */

export class ExamTrackingDatabase {
  /**
   * Get user's exam tracking data
   */
  static async getExamTracking(userId: string): Promise<ExamTrackingData | null> {
    console.log(`Getting exam tracking for user: ${userId}`);

    const items = await DatabaseService.queryItems(
      "PK = :pk AND SK = :sk",
      {
        ":pk": `USER#${userId}`,
        ":sk": "EXAMTRACKING#CURRENT",
      }
    );

    if (items.length === 0) {
      console.log(`No exam tracking found for user ${userId}`);
      return null;
    }

    return items[0] as ExamTrackingData;
  }

  /**
   * Create or update exam tracking data
   */
  static async setExamDate(
    userId: string,
    intendedExamDate: string,
    examType: string = "RE5"
  ): Promise<ExamTrackingData> {
    console.log(`Setting exam date for user ${userId}: ${intendedExamDate}`);

    const existing = await this.getExamTracking(userId);
    const now = new Date().toISOString();

    const examTracking: ExamTrackingData = {
      PK: `USER#${userId}`,
      SK: "EXAMTRACKING#CURRENT",
      userId,
      examType: existing?.examType || examType,
      status: existing?.status || 'scheduled',
      intendedExamDate,
      examPassed: false,
      rewardPending: false,
      careerkitUnlocked: existing?.careerkitUnlocked || false,
      examDateHistory: existing?.examDateHistory || [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await DatabaseService.putItem(examTracking as any);
    console.log(`Exam date set successfully for user ${userId}`);

    return examTracking;
  }

  /**
   * Reschedule exam date
   */
  static async rescheduleExamDate(
    userId: string,
    newExamDate: string,
    reason?: string
  ): Promise<ExamTrackingData> {
    console.log(`Rescheduling exam date for user ${userId}: ${newExamDate}`);

    const existing = await this.getExamTracking(userId);
    if (!existing) {
      throw new Error("No exam tracking found. Please set an exam date first.");
    }

    const now = new Date().toISOString();

    // Add to history
    const history = existing.examDateHistory || [];
    history.push({
      date: existing.intendedExamDate,
      reason: reason || "Rescheduled",
      updatedAt: now,
    });

    const updated: ExamTrackingData = {
      ...existing,
      examType: existing.examType,
      status: existing.status,
      intendedExamDate: newExamDate,
      examDateHistory: history,
      // Reset reward pending if they reschedule
      rewardPending: false,
      updatedAt: now,
    };

    await DatabaseService.putItem(updated as any);
    console.log(`Exam date rescheduled successfully for user ${userId}`);

    return updated;
  }

  /**
   * Mark exam as passed
   */
  static async markExamPassed(
    userId: string,
    passedDate?: string
  ): Promise<ExamTrackingData> {
    console.log(`Marking exam as passed for user ${userId}`);

    const existing = await this.getExamTracking(userId);
    if (!existing) {
      throw new Error("No exam tracking found. Please set an exam date first.");
    }

    const now = new Date().toISOString();

    const updated: ExamTrackingData = {
      ...existing,
      examType: existing.examType,
      status: 'completed',
      examPassed: true,
      rewardPending: true, // Set reward as pending
      passedExamDate: passedDate || now,
      updatedAt: now,
    };

    await DatabaseService.putItem(updated as any);
    console.log(`Exam marked as passed for user ${userId}, reward pending`);

    return updated;
  }

  /**
   * Claim reward and unlock CareerKit
   */
  static async claimReward(userId: string): Promise<ExamTrackingData> {
    console.log(`Claiming reward for user ${userId}`);

    const existing = await this.getExamTracking(userId);
    if (!existing) {
      throw new Error("No exam tracking found.");
    }

    if (!existing.rewardPending) {
      throw new Error("No pending reward to claim.");
    }

    const now = new Date().toISOString();

    const updated: ExamTrackingData = {
      ...existing,
      examType: existing.examType,
      status: existing.status,
      rewardPending: false,
      careerkitUnlocked: true,
      rewardClaimedDate: now,
      updatedAt: now,
    };

    await DatabaseService.putItem(updated as any);
    console.log(`Reward claimed successfully for user ${userId}, CareerKit unlocked`);

    return updated;
  }

  /**
   * Check if exam date has passed
   */
  static hasExamDatePassed(intendedExamDate: string): boolean {
    const examDate = new Date(intendedExamDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    return examDate < now;
  }

  /**
   * Get days until exam
   */
  static getDaysUntilExam(intendedExamDate: string): number {
    const examDate = new Date(intendedExamDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);

    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
