/**
 * Admin Tier System
 *
 * IMPORTANT DISTINCTION:
 * - ROLE: admin (user.role === 'admin') - Platform administrator
 * - TIERS: free, premium, pro - Subscription tiers for all users
 *
 * Admins are NOT a tier. They have a role that grants special privileges.
 * Admins can impersonate any user tier to test the user experience.
 *
 * Provides utilities for:
 * 1. Checking if user has admin role (true admin vs impersonating)
 * 2. Feature flagging for admin-only features under development
 * 3. Conditional rendering based on admin status
 * 4. Getting effective subscription tier (for admins and regular users)
 */

import { User } from '@/types';

export type SubscriptionTier = 'free' | 'premium' | 'pro';

/**
 * Check if the user is in TRUE ADMIN MODE (not impersonating any user tier)
 * Use this to show admin-only features that should never be visible to regular users
 *
 * @returns true if user has admin role AND is not impersonating
 */
export function isInAdminMode(user: User | null, impersonatedTier: SubscriptionTier | null): boolean {
  return user?.role === 'admin' && !impersonatedTier;
}

/**
 * DEPRECATED: Use isInAdminMode instead for clarity
 * @deprecated Use isInAdminMode() for better clarity
 */
export function isTrueAdmin(user: User | null, impersonatedTier: SubscriptionTier | null): boolean {
  return isInAdminMode(user, impersonatedTier);
}

/**
 * Check if the user has admin credentials (role = admin)
 * Returns true regardless of whether they're impersonating
 *
 * Use this to:
 * - Keep admin controls visible even when impersonating
 * - Check if user can access admin features
 *
 * @returns true if user has admin role (even when impersonating)
 */
export function hasAdminRole(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * DEPRECATED: Use hasAdminRole instead for clarity
 * @deprecated Use hasAdminRole() for better clarity
 */
export function hasAdminCredentials(user: User | null): boolean {
  return hasAdminRole(user);
}

/**
 * Get the effective subscription tier for the current user
 *
 * Priority:
 * 1. If impersonating → return impersonated tier
 * 2. If admin not impersonating → return admin's actual subscription tier (default: 'pro')
 * 3. If regular user → return their subscription tier (default: 'free')
 *
 * @returns The active subscription tier (never returns 'admin')
 */
export function getEffectiveTier(
  user: User | null,
  impersonatedTier: SubscriptionTier | null
): SubscriptionTier {
  // If impersonating, return the impersonated tier
  if (impersonatedTier) {
    return impersonatedTier;
  }

  // For admins not impersonating, default to 'pro' tier
  // (admins typically have full access like pro users)
  if (user?.role === 'admin') {
    return 'pro'; // Admins get pro-level features by default
  }

  // For regular users, return their actual tier
  // TODO: Get actual tier from user.subscriptionTier when available
  return 'free'; // Default to free for regular users
}

/**
 * Check if an admin-only feature should be visible
 *
 * Admin-only features are DEVELOPMENT features that should never be visible to regular users.
 * These are NOT the same as tier-based features (which should use getEffectiveTier).
 *
 * @param user - Current user
 * @param impersonatedTier - Current impersonated tier (if any)
 * @param featureFlag - Feature flag name
 * @returns true if feature should be visible
 *
 * @example
 * ```tsx
 * // Admin-only feature (hidden when impersonating)
 * {isAdminFeatureEnabled(user, impersonatedTier, 'email-templates') && (
 *   <EmailTemplatesButton />
 * )}
 * ```
 */
export function isAdminFeatureEnabled(
  user: User | null,
  impersonatedTier: SubscriptionTier | null,
  featureFlag: string
): boolean {
  // Only show admin features when in admin mode (not impersonating)
  if (!isInAdminMode(user, impersonatedTier)) {
    return false;
  }

  // Feature flags for admin-only platform management features
  // These are NOT subscription tier features
  const ADMIN_FEATURES: Record<string, boolean> = {
    'email-templates': true,      // Email template management
    'advanced-analytics': true,   // Advanced analytics dashboard
    'bulk-operations': true,      // Bulk user operations
    'system-settings': true,      // System configuration
    'api-playground': false,      // API testing playground (under development)
    'audit-logs': false,          // Audit log viewer (under development)
  };

  return ADMIN_FEATURES[featureFlag] ?? false;
}

/**
 * Check if user should see admin navigation
 * Admin nav is shown only when in admin mode (not impersonating)
 * When impersonating, user sees the regular user navigation
 */
export function shouldShowAdminNav(
  user: User | null,
  impersonatedTier: SubscriptionTier | null
): boolean {
  return isInAdminMode(user, impersonatedTier);
}

/**
 * Check if user should see regular user navigation
 * User nav is shown when impersonating OR when user is not an admin
 */
export function shouldShowUserNav(
  user: User | null,
  impersonatedTier: SubscriptionTier | null
): boolean {
  return impersonatedTier !== null || user?.role !== 'admin';
}

/**
 * Get the appropriate dashboard path based on current mode
 * @returns '/admin/dashboard' if in admin mode, '/dashboard' if in user mode
 */
export function getDashboardPath(
  user: User | null,
  impersonatedTier: SubscriptionTier | null
): string {
  if (isInAdminMode(user, impersonatedTier)) {
    return '/admin/dashboard';
  }
  return '/dashboard';
}

/**
 * Check if current path is an admin path
 * @returns true if path starts with '/admin'
 */
export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/**
 * Check if user should be allowed to access admin paths
 * Only users in admin mode (not impersonating) can access admin paths
 */
export function canAccessAdminPath(
  user: User | null,
  impersonatedTier: SubscriptionTier | null
): boolean {
  return isInAdminMode(user, impersonatedTier);
}

// ============================================================================
// 263Tube Role-Based Access Control (RBAC)
// ============================================================================

/**
 * Role hierarchy for permission checks
 * user < sponsor < creator < admin
 */
type UserRole = 'user' | 'sponsor' | 'creator' | 'admin';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  sponsor: 1,
  creator: 2,
  admin: 3,
};

/**
 * Check if user has at least the required role level
 * Uses role hierarchy: user < client < creator < admin
 *
 * @param user - Current user
 * @param requiredRole - Minimum role required
 * @returns true if user meets the role requirement
 *
 * @example
 * ```tsx
 * // Check if user can access creator features
 * if (hasRole(user, 'creator')) {
 *   // Show creator dashboard
 * }
 * ```
 */
export function hasRole(user: User | null, requiredRole: UserRole): boolean {
  if (!user) return false;

  const userRole = user.role as UserRole;
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

  return userLevel >= requiredLevel;
}

/**
 * Check if user can edit a specific creator profile
 *
 * Access rules:
 * - Admins can edit any creator profile
 * - Creators can only edit their own profile (matched by creatorSlug)
 * - Other users cannot edit creator profiles
 *
 * @param user - Current user
 * @param creatorSlug - The slug of the creator profile
 * @returns true if user can edit the creator profile
 *
 * @example
 * ```tsx
 * // On creator profile page
 * {canEditCreator(user, creator.slug) && (
 *   <EditProfileButton />
 * )}
 * ```
 */
export function canEditCreator(user: User | null, creatorSlug: string): boolean {
  if (!user) return false;

  // Admins can edit any creator
  if (user.role === 'admin') return true;

  // Creators can edit their own profile
  if (user.role === 'creator' && user.creatorSlug === creatorSlug) {
    return true;
  }

  return false;
}

/**
 * Check if user can view analytics for a specific creator
 *
 * Access rules:
 * - Admins can view analytics for any creator
 * - Creators can view their own analytics
 * - Other users cannot view creator analytics
 *
 * @param user - Current user
 * @param creatorSlug - The slug of the creator profile
 * @returns true if user can view the creator's analytics
 *
 * @example
 * ```tsx
 * // On creator dashboard
 * {canViewCreatorAnalytics(user, creator.slug) && (
 *   <AnalyticsDashboard creatorSlug={creator.slug} />
 * )}
 * ```
 */
export function canViewCreatorAnalytics(
  user: User | null,
  creatorSlug: string
): boolean {
  if (!user) return false;

  // Admins can view any creator's analytics
  if (user.role === 'admin') return true;

  // Creators can view their own analytics
  if (user.role === 'creator' && user.creatorSlug === creatorSlug) {
    return true;
  }

  return false;
}

/**
 * Check if user can manage submissions (approve/reject)
 * Only admins can manage creator submissions
 *
 * @param user - Current user
 * @returns true if user can manage submissions
 */
export function canManageSubmissions(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user can view the admin dashboard
 * Only admins can access the admin dashboard
 *
 * @param user - Current user
 * @returns true if user can view admin dashboard
 */
export function canViewAdminDashboard(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Get the appropriate dashboard route for a user based on their role
 *
 * @param user - Current user
 * @returns The dashboard path the user should be redirected to
 */
export function getUserDashboardRoute(user: User | null): string {
  if (!user) return '/login';

  switch (user.role) {
    case 'admin':
      return '/admin/dashboard';
    case 'creator':
      return '/creator/dashboard'; // Creators go to their dashboard
    case 'sponsor':
      return '/sponsor/dashboard'; // Sponsors go to their dashboard
    default:
      return '/'; // Regular users go to home
  }
}

/**
 * Check if user is the owner of a creator profile
 *
 * @param user - Current user
 * @param creatorSlug - The slug to check ownership of
 * @returns true if user owns this creator profile
 */
export function isCreatorOwner(user: User | null, creatorSlug: string): boolean {
  if (!user) return false;
  return user.role === 'creator' && user.creatorSlug === creatorSlug;
}
