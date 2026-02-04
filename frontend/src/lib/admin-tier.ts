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
