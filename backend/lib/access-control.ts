import {
  SubscriptionDatabase,
  SubscriptionHelpers,
} from "./subscription-database";
import {
  SubscriptionTier,
  AccessCheckResult,
  SubscriptionInfo,
} from "./types";

/**
 * Access Control System
 *
 * Manages tier-based access control for features and content.
 * Implements the 3-tier system: Free, Premium, Pro
 */

export type Feature =
  | "unlimited_questions"
  | "all_practice_tests"
  | "performance_tracking"
  | "exclusive_materials"
  | "video_explanations"
  | "exam_simulation"
  | "advanced_analytics"
  | "bookmarking"
  | "priority_support";

/**
 * Feature access matrix
 * Defines which features are available for each tier
 */
const FEATURE_MATRIX: Record<Feature, SubscriptionTier[]> = {
  unlimited_questions: [SubscriptionTier.PREMIUM, SubscriptionTier.PRO],
  all_practice_tests: [SubscriptionTier.PREMIUM, SubscriptionTier.PRO],
  performance_tracking: [SubscriptionTier.PREMIUM, SubscriptionTier.PRO],
  exclusive_materials: [SubscriptionTier.PRO],
  video_explanations: [SubscriptionTier.PRO],
  exam_simulation: [SubscriptionTier.PRO],
  advanced_analytics: [SubscriptionTier.PRO],
  bookmarking: [SubscriptionTier.PRO],
  priority_support: [SubscriptionTier.PRO],
};

/**
 * Free tier limits
 */
const FREE_TIER_LIMITS = {
  dailyQuestions: parseInt(process.env.FREE_TIER_DAILY_QUESTIONS || "10"),
  practiceTests: parseInt(process.env.FREE_TIER_PRACTICE_TESTS || "1"),
};

export class AccessControl {
  /**
   * Check if user has access to a specific feature
   */
  static async checkFeatureAccess(
    userId: string,
    feature: Feature,
    impersonatedTier?: SubscriptionTier
  ): Promise<AccessCheckResult> {
    // Get user's current tier (use impersonated tier if provided)
    const userTier = impersonatedTier || await SubscriptionHelpers.getUserTier(userId);

    // Check if tier has access to feature
    const allowedTiers = FEATURE_MATRIX[feature];
    const hasAccess = allowedTiers.includes(userTier);

    if (hasAccess) {
      return {
        allowed: true,
        hasAccess: true,
        tier: userTier,
        currentTier: userTier,
      };
    }

    // Determine minimum required tier
    const requiredTier = allowedTiers.includes(SubscriptionTier.PREMIUM) ? SubscriptionTier.PREMIUM : SubscriptionTier.PRO;

    return {
      allowed: false,
      hasAccess: false,
      reason: `This feature requires ${requiredTier} subscription`,
      requiredTier,
      tier: userTier,
      currentTier: userTier,
    };
  }

  /**
   * Check if user can attempt a question
   * NOTE: Daily limits removed. Free users have access to static exam only (no custom quizzes).
   */
  static async checkQuestionAccess(
    userId: string,
    impersonatedTier?: SubscriptionTier
  ): Promise<AccessCheckResult> {
    const userTier = impersonatedTier || await SubscriptionHelpers.getUserTier(userId);

    // All users have access to questions within their allowed exams
    // Free tier: limited to static exam
    // Premium/Pro: unlimited access to all exams and custom quizzes
    return {
      allowed: true,
      hasAccess: true,
      tier: userTier,
      currentTier: userTier,
    };
  }

  /**
   * Check if user can access an exam
   */
  static async checkExamAccess(
    userId: string,
    examId: string,
    isPremiumExam: boolean = false,
    impersonatedTier?: SubscriptionTier
  ): Promise<AccessCheckResult> {
    const userTier = impersonatedTier || await SubscriptionHelpers.getUserTier(userId);

    // If it's not a premium exam, everyone has access
    if (!isPremiumExam) {
      return {
        allowed: true,
        hasAccess: true,
        tier: userTier,
        currentTier: userTier,
      };
    }

    // Premium exams require at least premium tier
    if (userTier === SubscriptionTier.PREMIUM || userTier === SubscriptionTier.PRO) {
      return {
        allowed: true,
        hasAccess: true,
        tier: userTier,
        currentTier: userTier,
      };
    }

    return {
      allowed: false,
      hasAccess: false,
      reason: "This exam requires Premium or Pro subscription",
      requiredTier: SubscriptionTier.PREMIUM,
      tier: userTier,
      currentTier: userTier,
    };
  }

  /**
   * Track question attempt for free users
   * NOTE: Daily tracking removed. Method kept for backward compatibility but does nothing.
   */
  static async trackQuestionAttempt(userId: string): Promise<void> {
    // Daily tracking removed - free users now have static exam access only
    // Method kept for backward compatibility
    console.log(`Question attempt tracking disabled for user: ${userId}`);
  }

  /**
   * Get user's subscription information
   */
  static async getUserSubscription(
    userId: string,
    impersonatedTier?: SubscriptionTier
  ): Promise<SubscriptionInfo> {
    const subInfo = await SubscriptionHelpers.getUserSubscriptionInfo(userId);

    // If impersonating, override the tier
    if (impersonatedTier) {
      const features = SubscriptionHelpers.getTierFeatures(impersonatedTier);
      return {
        ...subInfo,
        tier: impersonatedTier,
        features,
      };
    }

    const features = SubscriptionHelpers.getTierFeatures(subInfo.tier);
    return {
      ...subInfo,
      features,
    };
  }

  /**
   * Get user's remaining daily questions (for free tier)
   * NOTE: Daily question limits have been removed. Free users now have access to a static 50-question exam.
   * This method now returns null for all tiers to maintain backward compatibility.
   */
  static async getRemainingDailyQuestions(
    userId: string
  ): Promise<number | null> {
    // Daily question tracking removed - all tiers return null
    // Free users have access to a static exam with limited question bank
    return null;
  }

  /**
   * Check if user's subscription is about to expire (within 7 days)
   */
  static async isSubscriptionExpiringSoon(userId: string): Promise<boolean> {
    const subInfo = await SubscriptionHelpers.getUserSubscriptionInfo(userId);

    if (subInfo.status !== "active" || !subInfo.daysRemaining) {
      return false;
    }

    return subInfo.daysRemaining <= 7;
  }

  /**
   * Get tier comparison for upgrade prompts
   */
  static getTierComparison(currentTier: SubscriptionTier): {
    currentFeatures: string[];
    premiumFeatures: string[];
    proFeatures: string[];
  } {
    return {
      currentFeatures: SubscriptionHelpers.getTierFeatures(currentTier),
      premiumFeatures: SubscriptionHelpers.getTierFeatures(SubscriptionTier.PREMIUM),
      proFeatures: SubscriptionHelpers.getTierFeatures(SubscriptionTier.PRO),
    };
  }

  /**
   * Validate tier upgrade eligibility
   * Returns true if user can upgrade to the specified tier
   */
  static async canUpgradeTo(
    userId: string,
    targetTier: "premium" | "pro"
  ): Promise<{
    canUpgrade: boolean;
    reason?: string;
  }> {
    const currentTier = await SubscriptionHelpers.getUserTier(userId);

    // Can't "upgrade" to free
    if (targetTier === currentTier) {
      return {
        canUpgrade: false,
        reason: `Already on ${targetTier} tier`,
      };
    }

    // Check if trying to downgrade
    const tierHierarchy: Record<SubscriptionTier, number> = {
      [SubscriptionTier.GUEST]: 0,
      [SubscriptionTier.FREE]: 0,
      [SubscriptionTier.PREMIUM]: 1,
      [SubscriptionTier.PRO]: 2,
    };

    if (tierHierarchy[targetTier] !== undefined && tierHierarchy[currentTier] !== undefined && tierHierarchy[targetTier] < tierHierarchy[currentTier]) {
      return {
        canUpgrade: false,
        reason: `Cannot downgrade from ${currentTier} to ${targetTier}`,
      };
    }

    return {
      canUpgrade: true,
    };
  }

  /**
   * Get access control middleware for Lambda functions
   * Returns a function that checks access and throws error if denied
   */
  static requireFeature(feature: Feature) {
    return async (userId: string): Promise<void> => {
      const access = await this.checkFeatureAccess(userId, feature);

      if (!access.hasAccess) {
        throw new Error(
          access.reason ||
            `Access denied: ${feature} requires ${access.requiredTier} subscription`
        );
      }
    };
  }

  /**
   * Get access control middleware for exams
   */
  static requireExamAccess(examId: string, isPremiumExam: boolean = false) {
    return async (userId: string): Promise<void> => {
      const access = await this.checkExamAccess(
        userId,
        examId,
        isPremiumExam
      );

      if (!access.hasAccess) {
        throw new Error(
          access.reason || `Access denied: Premium subscription required`
        );
      }
    };
  }

  /**
   * Get access control middleware for questions
   */
  static requireQuestionAccess() {
    return async (userId: string): Promise<void> => {
      const access = await this.checkQuestionAccess(userId);

      if (!access.hasAccess) {
        throw new Error(
          access.reason || `Access denied: Daily limit exceeded`
        );
      }
    };
  }
}

/**
 * Convenience functions for common access checks
 */
export const accessControl = {
  /**
   * Check if user has unlimited questions
   */
  hasUnlimitedQuestions: async (userId: string): Promise<boolean> => {
    const tier = await SubscriptionHelpers.getUserTier(userId);
    return tier === SubscriptionTier.PREMIUM || tier === SubscriptionTier.PRO;
  },

  /**
   * Check if user is on Pro tier
   */
  isProUser: async (userId: string): Promise<boolean> => {
    const tier = await SubscriptionHelpers.getUserTier(userId);
    return tier === SubscriptionTier.PRO;
  },

  /**
   * Check if user is on Premium or Pro tier
   */
  isPaidUser: async (userId: string): Promise<boolean> => {
    const tier = await SubscriptionHelpers.getUserTier(userId);
    return tier === SubscriptionTier.PREMIUM || tier === SubscriptionTier.PRO;
  },

  /**
   * Check if user is on Free tier
   */
  isFreeUser: async (userId: string): Promise<boolean> => {
    const tier = await SubscriptionHelpers.getUserTier(userId);
    return tier === SubscriptionTier.FREE;
  },

  /**
   * Get user's tier
   */
  getUserTier: SubscriptionHelpers.getUserTier,

  /**
   * Get user's subscription info
   */
  getUserSubscription: AccessControl.getUserSubscription,

  /**
   * Track question attempt
   */
  trackQuestionAttempt: AccessControl.trackQuestionAttempt,

  /**
   * Get remaining daily questions
   */
  getRemainingQuestions: AccessControl.getRemainingDailyQuestions,
};

/**
 * Export everything for external use
 */
export { FREE_TIER_LIMITS, FEATURE_MATRIX };
