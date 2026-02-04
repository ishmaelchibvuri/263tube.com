import { DatabaseService, DatabaseHelpers, DynamoDBItem } from "./database";
import {
  UserPurchase,
  DailyUsage,
  SubscriptionTier,
  PurchaseStatus,
} from "./types";

/**
 * Subscription and Payment Database Operations
 *
 * This module handles all DynamoDB operations related to:
 * - User purchases and subscriptions
 * - Daily usage tracking for free tier
 * - Payment history
 */

export class SubscriptionDatabase {
  /**
   * Create a new purchase record
   */
  static async createPurchase(purchaseData: {
    purchaseId: string;
    userId: string;
    tier: SubscriptionTier;
    amount: number;
    durationDays: number;
    payfastPaymentId?: string;
  }): Promise<void> {
    const now = new Date().toISOString();
    const expiresAt = new Date(
      Date.now() + purchaseData.durationDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const purchase: DynamoDBItem = {
      PK: `USER#${purchaseData.userId}`,
      SK: `PURCHASE#${now}#${purchaseData.purchaseId}`,
      GSI1PK: "PURCHASE",
      GSI1SK: `pending#${expiresAt}`,
      GSI2PK: `USER#${purchaseData.userId}#ACTIVEPURCHASE`,
      GSI2SK: expiresAt,
      GSI3PK: `PURCHASE#${purchaseData.purchaseId}`, // For lookup by purchaseId
      GSI3SK: now, // Sort by creation time

      purchaseId: purchaseData.purchaseId,
      userId: purchaseData.userId,
      tier: purchaseData.tier,
      status: "pending" as PurchaseStatus,
      amount: purchaseData.amount,
      currency: "ZAR",
      durationDays: purchaseData.durationDays,
      purchaseDate: now,
      expiresAt,
      payfastPaymentId: purchaseData.payfastPaymentId,

      createdAt: now,
      updatedAt: now,
      entityType: "USER_PURCHASE",
    };

    console.log("Creating purchase record:", {
      purchaseId: purchase['purchaseId'],
      userId: purchase['userId'],
      tier: purchase['tier'],
      status: purchase['status'],
    });

    await DatabaseService.putItem(purchase);
  }

  /**
   * Get a purchase by purchaseId
   */
  static async getPurchaseById(
    purchaseId: string
  ): Promise<UserPurchase | null> {
    console.log(`Getting purchase by ID: ${purchaseId}`);

    // Query GSI3 by purchaseId (much faster and strongly consistent)
    const purchases = await DatabaseService.queryItems(
      "GSI3PK = :pk",
      {
        ":pk": `PURCHASE#${purchaseId}`,
      },
      "GSI3",
      1
    );

    console.log(`Query returned ${purchases.length} items`);
    return purchases.length > 0 ? (purchases[0] as UserPurchase) : null;
  }

  /**
   * Update purchase status (e.g., from pending to active)
   */
  static async updatePurchaseStatus(
    purchaseId: string,
    status: PurchaseStatus,
    payfastDetails?: {
      payfastPaymentId?: string;
      payfastMerchantId?: string;
      payfastSignature?: string;
    }
  ): Promise<void> {
    console.log(`Updating purchase status: ${purchaseId} -> ${status}`);

    // First, find the purchase to get its SK
    const purchase = await this.getPurchaseById(purchaseId);
    if (!purchase) {
      throw new Error(`Purchase not found: ${purchaseId}`);
    }

    const now = new Date().toISOString();
    const updateData: Record<string, any> = {
      status,
      updatedAt: now,
    };

    if (status === "active") {
      updateData['activatedAt'] = now;
    }

    if (payfastDetails) {
      if (payfastDetails.payfastPaymentId) {
        updateData['payfastPaymentId'] = payfastDetails.payfastPaymentId;
      }
      if (payfastDetails.payfastMerchantId) {
        updateData['payfastMerchantId'] = payfastDetails.payfastMerchantId;
      }
      if (payfastDetails.payfastSignature) {
        updateData['payfastSignature'] = payfastDetails.payfastSignature;
      }
    }

    const updateExpression =
      "SET " +
      Object.keys(updateData)
        .map((key) => `#${key} = :${key}`)
        .join(", ");

    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    for (const [key, value] of Object.entries(updateData)) {
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }

    // Also update GSI1SK to reflect new status
    expressionAttributeNames["#GSI1SK"] = "GSI1SK";
    expressionAttributeValues[":GSI1SK"] = `${status}#${purchase.expiresAt}`;
    const finalUpdateExpression = updateExpression + ", #GSI1SK = :GSI1SK";

    await DatabaseService.updateItem(
      purchase.PK!,
      purchase.SK!,
      finalUpdateExpression,
      expressionAttributeValues,
      expressionAttributeNames
    );
  }

  /**
   * Get active purchase for a user
   */
  static async getActivePurchase(
    userId: string
  ): Promise<UserPurchase | null> {
    console.log(`🔍 Getting active purchase for user: ${userId}`);

    const purchases = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${userId}`,
        ":sk": "PURCHASE#",
      },
      undefined,
      undefined,
      false // Descending order to get most recent first
    );

    console.log(`📦 Found ${purchases.length} total purchases for user`);

    // Find the first active purchase that hasn't expired
    const now = new Date();
    console.log(`⏰ Current time: ${now.toISOString()}`);

    for (const purchase of purchases) {
      console.log(`📋 Checking purchase: ${purchase['purchaseId']}`);
      console.log(`   - Status: ${purchase['status']}`);
      console.log(`   - Tier: ${purchase['tier']}`);
      console.log(`   - Expires: ${purchase['expiresAt']}`);
      console.log(`   - Expires Date: ${new Date(purchase['expiresAt'])}`);
      console.log(`   - Is Active: ${purchase['status'] === "active"}`);
      console.log(`   - Is Not Expired: ${new Date(purchase['expiresAt']) > now}`);

      if (
        purchase['status'] === "active" &&
        new Date(purchase['expiresAt']) > now
      ) {
        console.log(`✅ Found active purchase: ${purchase['purchaseId']} - Tier: ${purchase['tier']}`);
        return purchase as UserPurchase;
      }
    }

    console.log(`❌ No active purchase found for user ${userId}`);
    return null;
  }

  /**
   * Get all purchases for a user (purchase history)
   */
  static async getUserPurchases(
    userId: string,
    limit?: number
  ): Promise<UserPurchase[]> {
    console.log(`Getting purchase history for user: ${userId}`);

    const purchases = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `USER#${userId}`,
        ":sk": "PURCHASE#",
      },
      undefined,
      limit,
      false // Descending order (most recent first)
    );

    return purchases as UserPurchase[];
  }

  /**
   * Get or create daily usage record for a user
   */
  static async getDailyUsage(
    userId: string | undefined,
    date: string | undefined
  ): Promise<DailyUsage | null> {
    if (!userId || !date) {
      return null;
    }
    const usage = await DatabaseService.getItem(
      `USER#${userId}`,
      `USAGE#${date}`
    );

    return usage as DailyUsage | null;
  }

  /**
   * Increment daily usage (questions attempted)
   */
  static async incrementDailyUsage(userId: string): Promise<DailyUsage | null> {
    const today = new Date().toISOString().split("T")[0]!; // YYYY-MM-DD
    const now = new Date().toISOString();

    console.log(`Incrementing daily usage for user: ${userId}, date: ${today}`);

    // Try to get existing usage
    let usage = await this.getDailyUsage(userId, today);

    if (usage) {
      // Update existing usage
      const newCount = (usage.questionsAttempted || 0) + 1;

      await DatabaseService.updateItem(
        `USER#${userId}`,
        `USAGE#${today}`,
        "SET questionsAttempted = :count, lastQuestionAt = :lastAt",
        {
          ":count": newCount,
          ":lastAt": now,
        }
      );

      usage.questionsAttempted = newCount;
      usage.lastQuestionAt = now;
    } else {
      // Create new usage record
      const ttl = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days

      usage = {
        PK: `USER#${userId}`,
        SK: `USAGE#${today}`,
        userId,
        date: today,
        examsStarted: 0,
        examsCompleted: 0,
        questionsAnswered: 0,
        questionsAttempted: 1,
        customQuizzesCreated: 0,
        maxDailyQuestions: parseInt(
          process.env['FREE_TIER_DAILY_QUESTIONS'] || "3"
        ),
        lastQuestionAt: now,
        TTL: ttl,
        entityType: "DAILY_USAGE",
      };

      await DatabaseService.putItem(usage as DynamoDBItem);
    }

    return usage;
  }

  /**
   * Check if user has exceeded daily limit
   */
  static async hasExceededDailyLimit(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0];
    const usage = await this.getDailyUsage(userId, today);

    if (!usage) {
      return false; // No usage yet, not exceeded
    }

    const maxQuestions = parseInt(
      process.env['FREE_TIER_DAILY_QUESTIONS'] || "3"
    );
    return usage.questionsAttempted >= maxQuestions;
  }

  /**
   * Check and expire old purchases
   * This can be run periodically or on-demand
   */
  static async expireOldPurchases(): Promise<number> {
    console.log("Checking for expired purchases...");

    const now = new Date().toISOString();

    // Query all active purchases via GSI1
    const activePurchases = await DatabaseService.queryItems(
      "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
      {
        ":pk": "PURCHASE",
        ":sk": "active#",
      },
      "GSI1"
    );

    let expiredCount = 0;

    for (const purchase of activePurchases) {
      if (purchase['expiresAt'] && purchase['expiresAt'] < now) {
        console.log(`Expiring purchase: ${purchase['purchaseId']}`);

        await DatabaseService.updateItem(
          purchase.PK,
          purchase.SK,
          "SET #status = :status, #GSI1SK = :gsi1sk, updatedAt = :updatedAt",
          {
            ":status": "expired",
            ":gsi1sk": `expired#${purchase['expiresAt']}`,
            ":updatedAt": now,
          },
          {
            "#status": "status",
            "#GSI1SK": "GSI1SK",
          }
        );

        expiredCount++;
      }
    }

    console.log(`Expired ${expiredCount} purchases`);
    return expiredCount;
  }
}

/**
 * Helper functions for common subscription operations
 */
export const SubscriptionHelpers = {
  /**
   * Get user's current subscription tier
   * Note: All logged-in users are verified (no guest tier)
   */
  async getUserTier(userId: string): Promise<SubscriptionTier> {
    const activePurchase = await SubscriptionDatabase.getActivePurchase(userId);

    if (activePurchase) {
      return activePurchase.tier;
    }

    // Default to free tier for all verified users
    return SubscriptionTier.FREE;
  },

  /**
   * Get user's subscription info
   */
  async getUserSubscriptionInfo(userId: string): Promise<{
    tier: SubscriptionTier;
    status: "active" | "expired" | "none";
    isActive: boolean;
    expiresAt?: string;
    daysRemaining?: number;
  }> {
    const activePurchase = await SubscriptionDatabase.getActivePurchase(userId);

    if (!activePurchase) {
      return {
        tier: SubscriptionTier.FREE,
        status: "none",
        isActive: false,
      };
    }

    const now = new Date();
    const expiresAt = new Date(activePurchase.expiresAt!);
    const daysRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isActive = expiresAt > now;

    return {
      tier: activePurchase.tier,
      status: isActive ? "active" : "expired",
      isActive,
      expiresAt: activePurchase.expiresAt,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    };
  },

  /**
   * Get tier features
   */
  getTierFeatures(tier: SubscriptionTier): string[] {
    const features: Record<SubscriptionTier, string[]> = {
      [SubscriptionTier.GUEST]: [
        "1 static practice exam (50 questions)",
        "Limited question bank",
        "Basic scoring",
        "View leaderboards",
      ],
      [SubscriptionTier.FREE]: [
        "1 static practice exam (50 questions)",
        "Limited question bank",
        "Basic scoring",
        "View leaderboards",
      ],
      [SubscriptionTier.PREMIUM]: [
        "Unlimited custom quizzes",
        "Full question bank access",
        "Unlimited practice tests",
        "Performance tracking",
        "30 days access",
      ],
      [SubscriptionTier.PRO]: [
        "Everything in Premium",
        "Exclusive study materials",
        "Video explanations",
        "Weakest areas mode",
        "Bookmarking",
        "Priority support",
        "Advanced analytics",
        "90 days access",
      ],
    };

    return features[tier] || features[SubscriptionTier.FREE];
  },

  /**
   * Get tier pricing
   */
  getTierPricing(
    tier: "premium" | "pro"
  ): { amount: number; durationDays: number } {
    const pricing = {
      premium: {
        amount: parseInt(process.env['PREMIUM_PRICE_CENTS'] || "9999"),
        durationDays: parseInt(process.env['PREMIUM_DURATION_DAYS'] || "30"),
      },
      pro: {
        amount: parseInt(process.env['PRO_PRICE_CENTS'] || "17999"),
        durationDays: parseInt(process.env['PRO_DURATION_DAYS'] || "90"),
      },
    };

    return pricing[tier];
  },
};
