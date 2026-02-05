import { z } from 'zod';

// ============================================================================
// USER TYPES
// ============================================================================

export const userRoleSchema = z.enum(['user', 'admin', 'creator', 'sponsor']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  emailVerified: z.boolean().optional(),
  role: userRoleSchema,
  status: z.enum(['pending', 'active', 'suspended']).optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
  lastLoginAt: z.string().optional(),
  profilePicture: z.string().optional(),
  // Creator-linked users (for creators who have claimed their profile)
  creatorSlug: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

// ============================================================================
// PLATFORM TYPES
// ============================================================================

export const platformSchema = z.enum([
  'YouTube',
  'TikTok',
  'Instagram',
  'Facebook',
  'Twitter',
  'Rumble',
]);
export type Platform = z.infer<typeof platformSchema>;

export const platformLinkSchema = z.object({
  platform: platformSchema,
  url: z.string().url(),
  label: z.string().optional(), // e.g., "Main Channel", "Vlog Channel"
  verified: z.boolean().default(false),
  verifiedAt: z.string().optional(),
  verifiedDisplayName: z.string().nullable().optional(),
  verifiedImage: z.string().nullable().optional(),
  verifiedFollowers: z.number().nullable().optional(),
});

export type PlatformLink = z.infer<typeof platformLinkSchema>;

// ============================================================================
// NICHE TYPES
// ============================================================================

export const nicheSchema = z.enum([
  'comedy',
  'music',
  'education',
  'lifestyle',
  'tech',
  'gaming',
  'sports',
  'news',
  'food',
  'travel',
  'fashion',
  'beauty',
  'fitness',
  'business',
  'entertainment',
  'vlogs',
  'documentary',
  'kids',
  'religion',
  'other',
]);
export type Niche = z.infer<typeof nicheSchema>;

// ============================================================================
// CREATOR TYPES
// ============================================================================

export const creatorStatusSchema = z.enum([
  'pending',     // Awaiting review
  'approved',    // Listed on the directory
  'featured',    // Featured/promoted creator
  'rejected',    // Submission rejected
  'suspended',   // Account suspended
]);
export type CreatorStatus = z.infer<typeof creatorStatusSchema>;

export const creatorSchema = z.object({
  creatorId: z.string(),
  slug: z.string(), // URL-friendly identifier

  // Basic Info
  name: z.string(),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
  coverImage: z.string().optional(),

  // Content
  niches: z.array(nicheSchema),
  customNiche: z.string().optional(),

  // Platform Links
  platforms: z.array(platformSchema),
  platformLinks: z.array(platformLinkSchema),
  website: z.string().url().optional(),

  // Stats (aggregated from verified platforms)
  totalFollowers: z.number().default(0),
  totalViews: z.number().optional(),

  // Location
  country: z.string().default('Zimbabwe'),
  city: z.string().optional(),

  // Status & Flags
  status: creatorStatusSchema,
  isFeatured: z.boolean().default(false),
  isVerified: z.boolean().default(false), // Profile claimed by creator

  // Linked User (if creator has claimed their profile)
  userId: z.string().optional(),

  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
  approvedAt: z.string().optional(),
  featuredAt: z.string().optional(),
});

export type Creator = z.infer<typeof creatorSchema>;

// ============================================================================
// SUBMISSION TYPES
// ============================================================================

export const submissionTypeSchema = z.enum(['self', 'other']);
export type SubmissionType = z.infer<typeof submissionTypeSchema>;

export const submissionStatusSchema = z.enum([
  'pending',
  'under_review',
  'approved',
  'rejected',
  'duplicate',
]);
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

export const creatorSubmissionSchema = z.object({
  submissionId: z.string(),

  // Creator Information
  creatorName: z.string(),
  niches: z.array(z.string()),
  customNiche: z.string().optional(),
  platforms: z.array(z.string()),
  platformLinks: z.record(z.string(), z.array(z.object({
    label: z.string(),
    url: z.string(),
    verified: z.boolean().optional(),
    verifiedAt: z.string().optional(),
    verifiedDisplayName: z.string().nullable().optional(),
    verifiedImage: z.string().nullable().optional(),
    verifiedFollowers: z.number().nullable().optional(),
  }))),
  website: z.string().optional(),
  about: z.string().optional(),

  // Verified Links Data
  verifiedLinks: z.array(z.object({
    platform: z.string(),
    displayName: z.string().nullable(),
    image: z.string().nullable(),
    followers: z.number().nullable(),
    verifiedAt: z.string(),
  })).optional(),
  primaryProfileImage: z.string().nullable().optional(),

  // Submitter Information
  submitterName: z.string(),
  submitterEmail: z.string().email(),
  submitterRelation: z.string().optional(),
  submissionType: submissionTypeSchema,

  // Status
  status: submissionStatusSchema,
  reviewedAt: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().optional(),

  // If approved, link to creator
  creatorId: z.string().optional(),

  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
  ipAddress: z.string().optional(),
});

export type CreatorSubmission = z.infer<typeof creatorSubmissionSchema>;

// ============================================================================
// SPONSORSHIP / CLIENT TYPES
// ============================================================================

export const campaignStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled',
]);
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export const sponsorshipCampaignSchema = z.object({
  campaignId: z.string(),
  sponsorId: z.string(), // User ID of the client

  // Campaign Details
  title: z.string(),
  description: z.string(),
  budget: z.number().optional(),
  currency: z.string().default('USD'),

  // Target Criteria
  targetNiches: z.array(nicheSchema).optional(),
  targetPlatforms: z.array(platformSchema).optional(),
  minFollowers: z.number().optional(),
  maxFollowers: z.number().optional(),

  // Status
  status: campaignStatusSchema,

  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type SponsorshipCampaign = z.infer<typeof sponsorshipCampaignSchema>;

export const sponsorshipInquirySchema = z.object({
  inquiryId: z.string(),
  sponsorId: z.string(),
  creatorId: z.string(),
  campaignId: z.string().optional(),

  // Message
  subject: z.string(),
  message: z.string(),

  // Status
  status: z.enum(['pending', 'read', 'replied', 'accepted', 'declined']),

  // Metadata
  createdAt: z.string(),
  respondedAt: z.string().optional(),
});

export type SponsorshipInquiry = z.infer<typeof sponsorshipInquirySchema>;

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export const creatorAnalyticsSchema = z.object({
  creatorId: z.string(),
  period: z.string(), // e.g., "2025-01" for monthly

  // Profile Stats
  profileViews: z.number().default(0),
  linkClicks: z.number().default(0),
  inquiriesReceived: z.number().default(0),

  // Platform Breakdown
  platformClicks: z.record(z.string(), z.number()).optional(),

  // Referral Sources
  referralSources: z.record(z.string(), z.number()).optional(),
});

export type CreatorAnalytics = z.infer<typeof creatorAnalyticsSchema>;

export const platformAnalyticsSchema = z.object({
  period: z.string(),

  // Overall Stats
  totalCreators: z.number(),
  totalViews: z.number(),
  totalSubmissions: z.number(),

  // Breakdown
  creatorsByNiche: z.record(z.string(), z.number()),
  creatorsByPlatform: z.record(z.string(), z.number()),
  submissionsByStatus: z.record(z.string(), z.number()),

  // Growth
  newCreators: z.number(),
  newUsers: z.number(),
});

export type PlatformAnalytics = z.infer<typeof platformAnalyticsSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export const apiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    data,
    message: z.string().optional(),
    timestamp: z.string(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
};

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
  timestamp: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// ============================================================================
// SEARCH & FILTER TYPES
// ============================================================================

export const creatorSearchFiltersSchema = z.object({
  query: z.string().optional(),
  niches: z.array(nicheSchema).optional(),
  platforms: z.array(platformSchema).optional(),
  minFollowers: z.number().optional(),
  maxFollowers: z.number().optional(),
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortBy: z.enum(['name', 'followers', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export type CreatorSearchFilters = z.infer<typeof creatorSearchFiltersSchema>;

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export const notificationTypeSchema = z.enum([
  'submission_approved',
  'submission_rejected',
  'new_inquiry',
  'inquiry_response',
  'profile_featured',
  'system_announcement',
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  notificationId: z.string(),
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  actionUrl: z.string().optional(),
  isRead: z.boolean().default(false),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

// ============================================================================
// REFERRAL TYPES
// ============================================================================

export const referralSchema = z.object({
  referralId: z.string(),
  referrerId: z.string(), // User who made the referral
  referredEmail: z.string().email(),
  referredUserId: z.string().optional(), // Set when user signs up
  status: z.enum(['pending', 'signed_up', 'converted', 'expired']),
  createdAt: z.string(),
  convertedAt: z.string().optional(),
});

export type Referral = z.infer<typeof referralSchema>;

// ============================================================================
// FEATURE FLAG TYPES
// ============================================================================

export const featureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  description: z.string().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  enabledForRoles: z.array(userRoleSchema).optional(),
});

export type FeatureFlag = z.infer<typeof featureFlagSchema>;
