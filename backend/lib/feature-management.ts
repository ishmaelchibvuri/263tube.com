/**
 * Feature Management System
 *
 * This module provides comprehensive feature management capabilities including:
 * - Feature catalog management
 * - Tier-based feature assignments
 * - Promotional/trial features with time limits
 * - Full control over feature access (add/remove features per tier)
 *
 * Database Schema:
 *
 * 1. Feature Definitions
 *    PK: FEATURE#{featureId}
 *    SK: METADATA
 *    GSI1PK: FEATURE#CATEGORY#{category}
 *    GSI1SK: {displayOrder}#{featureId}
 *
 * 2. Tier Feature Assignments (Default)
 *    PK: TIER#{tier}
 *    SK: FEATURE#{featureId}
 *    GSI1PK: FEATURE#{featureId}
 *    GSI1SK: TIER#{tier}
 *
 * 3. Feature Promotions (Overrides)
 *    PK: PROMOTION#{promotionId}
 *    SK: METADATA
 *    GSI1PK: PROMO#ACTIVE
 *    GSI1SK: {startDate}#{promotionId}
 *    GSI2PK: PROMO#TIER#{tier}
 *    GSI2SK: {startDate}#{promotionId}
 */

import { DatabaseService, DynamoDBItem, TABLE_NAME } from "./database";
import { SubscriptionTier } from "./types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FeatureType = "page" | "menu_item" | "functionality" | "content" | "api";
export type FeatureCategory = "core" | "exams" | "analytics" | "community" | "admin" | "content";
export type PromotionStatus = "draft" | "scheduled" | "active" | "expired" | "cancelled";
export type PromotionAction = "grant" | "revoke";

export interface Feature {
  featureId: string;
  featureName: string;
  description: string;
  type: FeatureType;
  category: FeatureCategory;
  displayOrder: number;
  isActive: boolean;
  metadata?: {
    pageRoute?: string;
    menuLabel?: string;
    apiEndpoint?: string;
    componentName?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TierFeatureAssignment {
  tier: SubscriptionTier;
  featureId: string;
  isEnabled: boolean;
  assignedAt: string;
  assignedBy: string;
}

export interface FeaturePromotion {
  promotionId: string;
  promotionName: string;
  description: string;
  status: PromotionStatus;
  targetTiers: SubscriptionTier[];
  features: Array<{
    featureId: string;
    action: PromotionAction; // "grant" or "revoke"
  }>;
  startDate: string | null; // null = immediate
  endDate: string | null; // null = indefinite
  isPermanent: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  activatedAt?: string;
  deactivatedAt?: string;
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason: "tier_default" | "promotion_granted" | "promotion_revoked" | "feature_disabled";
  featureId: string;
  tier: SubscriptionTier;
  promotionId?: string;
}

export interface FeatureAccessSummary {
  tier: SubscriptionTier;
  features: {
    [featureId: string]: {
      hasAccess: boolean;
      reason: string;
      promotionId?: string;
    };
  };
  activePromotions: string[];
}

// ============================================================================
// FEATURE MANAGEMENT SERVICE
// ============================================================================

export class FeatureManagementService {
  // --------------------------------------------------------------------------
  // FEATURE CATALOG MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Create a new feature definition
   */
  static async createFeature(feature: Omit<Feature, "createdAt" | "updatedAt">): Promise<void> {
    const now = new Date().toISOString();
    const displayOrder = String(feature.displayOrder).padStart(5, "0");

    const item: DynamoDBItem = {
      PK: `FEATURE#${feature.featureId}`,
      SK: "METADATA",
      GSI1PK: `FEATURE#CATEGORY#${feature.category}`,
      GSI1SK: `${displayOrder}#${feature.featureId}`,
      ...feature,
      createdAt: now,
      updatedAt: now,
      entityType: "FEATURE",
    };

    await DatabaseService.putItem(item);
  }

  /**
   * Update an existing feature
   */
  static async updateFeature(
    featureId: string,
    updates: Partial<Omit<Feature, "featureId" | "createdAt" | "createdBy">>
  ): Promise<void> {
    const existing = await this.getFeature(featureId);
    if (!existing) {
      throw new Error(`Feature ${featureId} not found`);
    }

    const updatedFeature = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Update GSI1SK if display order or category changed
    if (updates.displayOrder !== undefined || updates.category !== undefined) {
      const displayOrder = String(updatedFeature.displayOrder).padStart(5, "0");
      (updatedFeature as any).GSI1PK = `FEATURE#CATEGORY#${updatedFeature.category}`;
      (updatedFeature as any).GSI1SK = `${displayOrder}#${featureId}`;
    }

    const item: DynamoDBItem = {
      PK: `FEATURE#${featureId}`,
      SK: "METADATA",
      ...updatedFeature,
      entityType: "FEATURE",
    };

    await DatabaseService.putItem(item);
  }

  /**
   * Get a feature by ID
   */
  static async getFeature(featureId: string): Promise<Feature | null> {
    const result = await DatabaseService.getItem(`FEATURE#${featureId}`, "METADATA");
    return result as Feature | null;
  }

  /**
   * Get all features
   */
  static async getAllFeatures(): Promise<Feature[]> {
    const items = await DatabaseService.scanItems(
      "begins_with(PK, :prefix) AND SK = :sk",
      {
        ":prefix": "FEATURE#",
        ":sk": "METADATA",
      }
    );
    return items as unknown as Feature[];
  }

  /**
   * Get features by category
   */
  static async getFeaturesByCategory(category: FeatureCategory): Promise<Feature[]> {
    const items = await DatabaseService.queryItems(
      "GSI1PK = :pk",
      { ":pk": `FEATURE#CATEGORY#${category}` },
      "GSI1",
      undefined,
      true
    );
    return items as unknown as Feature[];
  }

  /**
   * Delete a feature
   */
  static async deleteFeature(featureId: string): Promise<void> {
    // Delete feature metadata
    await DatabaseService.deleteItem(`FEATURE#${featureId}`, "METADATA");

    // Delete all tier assignments for this feature
    const assignments = await this.getFeatureAssignments(featureId);
    for (const assignment of assignments) {
      await DatabaseService.deleteItem(`TIER#${assignment.tier}`, `FEATURE#${featureId}`);
    }
  }

  // --------------------------------------------------------------------------
  // TIER FEATURE ASSIGNMENTS
  // --------------------------------------------------------------------------

  /**
   * Assign a feature to a tier (default access)
   */
  static async assignFeatureToTier(
    tier: SubscriptionTier,
    featureId: string,
    isEnabled: boolean,
    assignedBy: string
  ): Promise<void> {
    const now = new Date().toISOString();

    const item: DynamoDBItem = {
      PK: `TIER#${tier}`,
      SK: `FEATURE#${featureId}`,
      GSI1PK: `FEATURE#${featureId}`,
      GSI1SK: `TIER#${tier}`,
      tier,
      featureId,
      isEnabled,
      assignedAt: now,
      assignedBy,
      entityType: "TIER_FEATURE",
    };

    await DatabaseService.putItem(item);
  }

  /**
   * Remove a feature assignment from a tier
   */
  static async removeFeatureFromTier(tier: SubscriptionTier, featureId: string): Promise<void> {
    await DatabaseService.deleteItem(`TIER#${tier}`, `FEATURE#${featureId}`);
  }

  /**
   * Get all feature assignments for a tier
   */
  static async getTierFeatures(tier: SubscriptionTier): Promise<TierFeatureAssignment[]> {
    const items = await DatabaseService.queryItems(
      "PK = :pk AND begins_with(SK, :sk)",
      {
        ":pk": `TIER#${tier}`,
        ":sk": "FEATURE#",
      }
    );
    return items as unknown as TierFeatureAssignment[];
  }

  /**
   * Get all tiers that have access to a feature
   */
  static async getFeatureAssignments(featureId: string): Promise<TierFeatureAssignment[]> {
    const items = await DatabaseService.queryItems(
      "GSI1PK = :pk",
      { ":pk": `FEATURE#${featureId}` },
      "GSI1"
    );
    return items as unknown as TierFeatureAssignment[];
  }

  /**
   * Bulk update tier features
   */
  static async bulkUpdateTierFeatures(
    tier: SubscriptionTier,
    features: Array<{ featureId: string; isEnabled: boolean }>,
    updatedBy: string
  ): Promise<void> {
    for (const feature of features) {
      await this.assignFeatureToTier(tier, feature.featureId, feature.isEnabled, updatedBy);
    }
  }

  // --------------------------------------------------------------------------
  // PROMOTIONAL FEATURES
  // --------------------------------------------------------------------------

  /**
   * Create a new feature promotion
   */
  static async createPromotion(
    promotion: Omit<FeaturePromotion, "promotionId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const promotionId = `PROMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Determine status based on dates
    let status = promotion.status;
    if (status === "draft") {
      status = "draft";
    } else if (!promotion.startDate || new Date(promotion.startDate) <= new Date()) {
      status = "active";
    } else {
      status = "scheduled";
    }

    const item: DynamoDBItem = {
      PK: `PROMOTION#${promotionId}`,
      SK: "METADATA",
      promotionId,
      ...promotion,
      status,
      createdAt: now,
      updatedAt: now,
      entityType: "PROMOTION",
    };

    // Add to active promotions index if active
    if (status === "active") {
      item.GSI1PK = "PROMO#ACTIVE";
      item.GSI1SK = `${promotion.startDate || now}#${promotionId}`;
      item.activatedAt = now;
    }

    // Add tier-specific indexes
    if (promotion.targetTiers.length > 0) {
      // Store as a single item with tier list, create separate index items for each tier
      await DatabaseService.putItem(item);

      // Create index items for each tier
      for (const tier of promotion.targetTiers) {
        const tierIndexItem: DynamoDBItem = {
          PK: `PROMO#TIER#${tier}`,
          SK: `${promotion.startDate || now}#${promotionId}`,
          GSI2PK: `PROMO#TIER#${tier}`,
          GSI2SK: `${promotion.startDate || now}#${promotionId}`,
          promotionId,
          tier,
          entityType: "PROMOTION_TIER_INDEX",
        };
        await DatabaseService.putItem(tierIndexItem);
      }
    } else {
      await DatabaseService.putItem(item);
    }

    return promotionId;
  }

  /**
   * Update a promotion
   */
  static async updatePromotion(
    promotionId: string,
    updates: Partial<Omit<FeaturePromotion, "promotionId" | "createdAt" | "createdBy">>
  ): Promise<void> {
    const existing = await this.getPromotion(promotionId);
    if (!existing) {
      throw new Error(`Promotion ${promotionId} not found`);
    }

    const now = new Date().toISOString();
    const updatedPromotion = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    // Update status if needed
    if (updates.status === "active" && existing.status !== "active") {
      (updatedPromotion as any).activatedAt = now;
      (updatedPromotion as any).GSI1PK = "PROMO#ACTIVE";
      (updatedPromotion as any).GSI1SK = `${updatedPromotion.startDate || now}#${promotionId}`;
    } else if (updates.status !== "active" && existing.status === "active") {
      (updatedPromotion as any).deactivatedAt = now;
      delete (updatedPromotion as any).GSI1PK;
      delete (updatedPromotion as any).GSI1SK;
    }

    const item: DynamoDBItem = {
      PK: `PROMOTION#${promotionId}`,
      SK: "METADATA",
      ...updatedPromotion,
      entityType: "PROMOTION",
    };

    await DatabaseService.putItem(item);

    // Update tier indexes if targetTiers changed
    if (updates.targetTiers) {
      // Delete old tier indexes
      const oldTiers = existing.targetTiers;
      for (const tier of oldTiers) {
        await DatabaseService.deleteItem(
          `PROMO#TIER#${tier}`,
          `${existing.startDate || existing.createdAt}#${promotionId}`
        );
      }

      // Create new tier indexes
      for (const tier of updates.targetTiers) {
        const tierIndexItem: DynamoDBItem = {
          PK: `PROMO#TIER#${tier}`,
          SK: `${updatedPromotion.startDate || now}#${promotionId}`,
          GSI2PK: `PROMO#TIER#${tier}`,
          GSI2SK: `${updatedPromotion.startDate || now}#${promotionId}`,
          promotionId,
          tier,
          entityType: "PROMOTION_TIER_INDEX",
        };
        await DatabaseService.putItem(tierIndexItem);
      }
    }
  }

  /**
   * Get a promotion by ID
   */
  static async getPromotion(promotionId: string): Promise<FeaturePromotion | null> {
    const result = await DatabaseService.getItem(`PROMOTION#${promotionId}`, "METADATA");
    return result as FeaturePromotion | null;
  }

  /**
   * Get all promotions
   */
  static async getAllPromotions(): Promise<FeaturePromotion[]> {
    const items = await DatabaseService.scanItems(
      "begins_with(PK, :prefix) AND SK = :sk",
      {
        ":prefix": "PROMOTION#",
        ":sk": "METADATA",
      }
    );
    return items as unknown as FeaturePromotion[];
  }

  /**
   * Get active promotions
   */
  static async getActivePromotions(): Promise<FeaturePromotion[]> {
    const items = await DatabaseService.queryItems(
      "GSI1PK = :pk",
      { ":pk": "PROMO#ACTIVE" },
      "GSI1"
    );

    const now = new Date();
    return (items as unknown as FeaturePromotion[]).filter((promo) => {
      const promotion = promo;
      // Check if promotion is within date range
      if (promotion.startDate && new Date(promotion.startDate) > now) {
        return false;
      }
      if (promotion.endDate && new Date(promotion.endDate) < now) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get active promotions for a specific tier
   */
  static async getActivePromotionsForTier(tier: SubscriptionTier): Promise<FeaturePromotion[]> {
    const now = new Date();

    // Get promotion IDs for this tier
    const tierIndexItems = await DatabaseService.queryItems(
      "PK = :pk",
      { ":pk": `PROMO#TIER#${tier}` }
    );

    // Fetch full promotion details
    const promotions: FeaturePromotion[] = [];
    for (const indexItem of tierIndexItems) {
      const promotion = await this.getPromotion(indexItem.promotionId);
      if (promotion && promotion.status === "active") {
        // Check if within date range
        if (promotion.startDate && new Date(promotion.startDate) > now) {
          continue;
        }
        if (promotion.endDate && new Date(promotion.endDate) < now) {
          continue;
        }
        promotions.push(promotion);
      }
    }

    return promotions;
  }

  /**
   * Delete a promotion
   */
  static async deletePromotion(promotionId: string): Promise<void> {
    const promotion = await this.getPromotion(promotionId);
    if (!promotion) {
      return;
    }

    // Delete promotion metadata
    await DatabaseService.deleteItem(`PROMOTION#${promotionId}`, "METADATA");

    // Delete tier indexes
    for (const tier of promotion.targetTiers) {
      await DatabaseService.deleteItem(
        `PROMO#TIER#${tier}`,
        `${promotion.startDate || promotion.createdAt}#${promotionId}`
      );
    }
  }

  /**
   * Activate a scheduled promotion
   */
  static async activatePromotion(promotionId: string): Promise<void> {
    await this.updatePromotion(promotionId, { status: "active" });
  }

  /**
   * Deactivate a promotion
   */
  static async deactivatePromotion(promotionId: string): Promise<void> {
    await this.updatePromotion(promotionId, { status: "cancelled" });
  }

  /**
   * Check and update expired promotions
   */
  static async checkExpiredPromotions(): Promise<void> {
    const activePromotions = await this.getActivePromotions();
    const now = new Date();

    for (const promotion of activePromotions) {
      if (promotion.endDate && new Date(promotion.endDate) < now) {
        await this.updatePromotion(promotion.promotionId, { status: "expired" });
      }
    }
  }

  // --------------------------------------------------------------------------
  // FEATURE ACCESS CHECKING
  // --------------------------------------------------------------------------

  /**
   * Check if a user has access to a feature
   */
  static async checkFeatureAccess(
    tier: SubscriptionTier,
    featureId: string
  ): Promise<FeatureAccessResult> {
    // Get feature definition
    const feature = await this.getFeature(featureId);
    if (!feature) {
      return {
        hasAccess: false,
        reason: "feature_disabled",
        featureId,
        tier,
      };
    }

    if (!feature.isActive) {
      return {
        hasAccess: false,
        reason: "feature_disabled",
        featureId,
        tier,
      };
    }

    // Get tier default access
    const tierFeatures = await this.getTierFeatures(tier);
    const tierFeature = tierFeatures.find((f) => f.featureId === featureId);
    let hasDefaultAccess = tierFeature?.isEnabled || false;

    // Check active promotions for this tier
    const activePromotions = await this.getActivePromotionsForTier(tier);

    // Apply promotion overrides (process in chronological order)
    let finalAccess = hasDefaultAccess;
    let appliedPromotion: string | undefined;
    let reason: FeatureAccessResult["reason"] = "tier_default";

    for (const promotion of activePromotions) {
      const featureAction = promotion.features.find((f) => f.featureId === featureId);
      if (featureAction) {
        if (featureAction.action === "grant") {
          finalAccess = true;
          appliedPromotion = promotion.promotionId;
          reason = "promotion_granted";
        } else if (featureAction.action === "revoke") {
          finalAccess = false;
          appliedPromotion = promotion.promotionId;
          reason = "promotion_revoked";
        }
      }
    }

    return {
      hasAccess: finalAccess,
      reason,
      featureId,
      tier,
      promotionId: appliedPromotion,
    };
  }

  /**
   * Get complete feature access summary for a tier
   */
  static async getFeatureAccessSummary(tier: SubscriptionTier): Promise<FeatureAccessSummary> {
    const allFeatures = await this.getAllFeatures();
    const activePromotions = await this.getActivePromotionsForTier(tier);

    const features: FeatureAccessSummary["features"] = {};

    for (const feature of allFeatures) {
      const access = await this.checkFeatureAccess(tier, feature.featureId);
      features[feature.featureId] = {
        hasAccess: access.hasAccess,
        reason: access.reason,
        promotionId: access.promotionId,
      };
    }

    return {
      tier,
      features,
      activePromotions: activePromotions.map((p) => p.promotionId),
    };
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION & SEEDING
  // --------------------------------------------------------------------------

  /**
   * Seed initial features from existing FEATURE_MATRIX
   */
  static async seedInitialFeatures(createdBy: string): Promise<void> {
    const initialFeatures: Omit<Feature, "createdAt" | "updatedAt">[] = [
      {
        featureId: "unlimited_questions",
        featureName: "Unlimited Questions",
        description: "Access to unlimited practice questions",
        type: "functionality",
        category: "exams",
        displayOrder: 1,
        isActive: true,
        createdBy,
      },
      {
        featureId: "all_practice_tests",
        featureName: "All Practice Tests",
        description: "Access to all available practice exams",
        type: "functionality",
        category: "exams",
        displayOrder: 2,
        isActive: true,
        createdBy,
      },
      {
        featureId: "performance_tracking",
        featureName: "Performance Tracking",
        description: "Detailed performance analytics and tracking",
        type: "functionality",
        category: "analytics",
        displayOrder: 3,
        isActive: true,
        createdBy,
      },
      {
        featureId: "exclusive_materials",
        featureName: "Exclusive Materials",
        description: "Access to exclusive study materials and resources",
        type: "content",
        category: "content",
        displayOrder: 4,
        isActive: true,
        createdBy,
      },
      {
        featureId: "video_explanations",
        featureName: "Video Explanations",
        description: "Video explanations for questions",
        type: "content",
        category: "content",
        displayOrder: 5,
        isActive: true,
        createdBy,
      },
      {
        featureId: "exam_simulation",
        featureName: "Exam Simulation",
        description: "Realistic exam simulation mode",
        type: "functionality",
        category: "exams",
        displayOrder: 6,
        isActive: true,
        createdBy,
      },
      {
        featureId: "advanced_analytics",
        featureName: "Advanced Analytics",
        description: "Advanced analytics dashboard with detailed insights",
        type: "functionality",
        category: "analytics",
        displayOrder: 7,
        isActive: true,
        createdBy,
      },
      {
        featureId: "bookmarking",
        featureName: "Bookmarking",
        description: "Bookmark questions for later review",
        type: "functionality",
        category: "exams",
        displayOrder: 8,
        isActive: true,
        metadata: {
          pageRoute: "/bookmarks",
          menuLabel: "Bookmarks",
        },
        createdBy,
      },
      {
        featureId: "priority_support",
        featureName: "Priority Support",
        description: "Priority customer support",
        type: "functionality",
        category: "core",
        displayOrder: 9,
        isActive: true,
        createdBy,
      },
      // Additional page-based features
      {
        featureId: "community_access",
        featureName: "Community Access",
        description: "Access to community features and discussions",
        type: "page",
        category: "community",
        displayOrder: 10,
        isActive: true,
        metadata: {
          pageRoute: "/community",
          menuLabel: "Community",
        },
        createdBy,
      },
      {
        featureId: "custom_quiz_builder",
        featureName: "Custom Quiz Builder",
        description: "Create custom quizzes with specific criteria",
        type: "functionality",
        category: "exams",
        displayOrder: 11,
        isActive: true,
        createdBy,
      },
      {
        featureId: "weak_areas_mode",
        featureName: "Weak Areas Mode",
        description: "Focus practice on weak areas",
        type: "functionality",
        category: "exams",
        displayOrder: 12,
        isActive: true,
        createdBy,
      },
    ];

    // Create features
    for (const feature of initialFeatures) {
      try {
        await this.createFeature(feature);
        console.log(`Created feature: ${feature.featureId}`);
      } catch (error) {
        console.error(`Error creating feature ${feature.featureId}:`, error);
      }
    }

    // Seed default tier assignments based on existing FEATURE_MATRIX
    const tierAssignments: Array<{
      tier: SubscriptionTier;
      featureId: string;
      isEnabled: boolean;
    }> = [
      // Premium tier
      { tier: SubscriptionTier.PREMIUM, featureId: "unlimited_questions", isEnabled: true },
      { tier: SubscriptionTier.PREMIUM, featureId: "all_practice_tests", isEnabled: true },
      { tier: SubscriptionTier.PREMIUM, featureId: "performance_tracking", isEnabled: true },
      { tier: SubscriptionTier.PREMIUM, featureId: "custom_quiz_builder", isEnabled: true },
      { tier: SubscriptionTier.PREMIUM, featureId: "advanced_analytics", isEnabled: false },
      { tier: SubscriptionTier.PREMIUM, featureId: "bookmarking", isEnabled: false },
      { tier: SubscriptionTier.PREMIUM, featureId: "community_access", isEnabled: false },
      { tier: SubscriptionTier.PREMIUM, featureId: "weak_areas_mode", isEnabled: false },

      // Pro tier - all features
      { tier: SubscriptionTier.PRO, featureId: "unlimited_questions", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "all_practice_tests", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "performance_tracking", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "exclusive_materials", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "video_explanations", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "exam_simulation", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "advanced_analytics", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "bookmarking", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "priority_support", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "community_access", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "custom_quiz_builder", isEnabled: true },
      { tier: SubscriptionTier.PRO, featureId: "weak_areas_mode", isEnabled: true },

      // Free tier - limited features
      { tier: SubscriptionTier.FREE, featureId: "unlimited_questions", isEnabled: false },
      { tier: SubscriptionTier.FREE, featureId: "all_practice_tests", isEnabled: false },
      { tier: SubscriptionTier.FREE, featureId: "performance_tracking", isEnabled: false },
      { tier: SubscriptionTier.FREE, featureId: "custom_quiz_builder", isEnabled: false },
    ];

    // Create tier assignments
    for (const assignment of tierAssignments) {
      try {
        await this.assignFeatureToTier(
          assignment.tier,
          assignment.featureId,
          assignment.isEnabled,
          createdBy
        );
        console.log(
          `Assigned feature ${assignment.featureId} to tier ${assignment.tier}: ${assignment.isEnabled}`
        );
      } catch (error) {
        console.error(
          `Error assigning feature ${assignment.featureId} to tier ${assignment.tier}:`,
          error
        );
      }
    }
  }
}
