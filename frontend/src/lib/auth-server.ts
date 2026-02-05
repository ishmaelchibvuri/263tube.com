/**
 * 263Tube - Server-Side Authentication Helper
 *
 * Provides utilities for server-side authentication using AWS Amplify/Cognito.
 * Used in Server Components, Server Actions, and Middleware.
 */

import { cookies } from "next/headers";
import { User, UserRole } from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface ServerSession {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  client: 1,
  creator: 2,
  admin: 3,
};

// ============================================================================
// Session Functions
// ============================================================================

/**
 * Get the current user session from server-side context
 * Extracts user information from Cognito tokens stored in cookies
 *
 * @returns ServerSession with user data or null if not authenticated
 */
export async function getServerSession(): Promise<ServerSession> {
  try {
    const cookieStore = await cookies();

    // Look for Amplify auth tokens in cookies
    // Amplify v6 stores tokens with prefix based on UserPool config
    const allCookies = cookieStore.getAll();

    // Find the ID token cookie (contains user claims)
    const idTokenCookie = allCookies.find(
      (cookie) =>
        cookie.name.includes("idToken") ||
        cookie.name.includes("CognitoIdentityServiceProvider") &&
          cookie.name.includes("idToken")
    );

    if (!idTokenCookie?.value) {
      return { user: null, isAuthenticated: false };
    }

    // Decode the JWT to extract user claims
    const user = parseIdToken(idTokenCookie.value);

    if (!user) {
      return { user: null, isAuthenticated: false };
    }

    return { user, isAuthenticated: true };
  } catch (error) {
    console.error("Error getting server session:", error);
    return { user: null, isAuthenticated: false };
  }
}

/**
 * Parse the Cognito ID token to extract user information
 * JWT format: header.payload.signature
 */
function parseIdToken(token: string): User | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64").toString("utf-8")
    );

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    // Extract user role from Cognito groups or custom attributes
    let role: UserRole = "user";
    if (payload["cognito:groups"]) {
      const groups = payload["cognito:groups"] as string[];
      if (groups.includes("admin") || groups.includes("admins")) {
        role = "admin";
      } else if (groups.includes("creator") || groups.includes("creators")) {
        role = "creator";
      } else if (groups.includes("client") || groups.includes("clients")) {
        role = "client";
      }
    }

    // Also check custom:role attribute if groups not set
    if (role === "user" && payload["custom:role"]) {
      const customRole = payload["custom:role"].toLowerCase();
      if (["admin", "creator", "client"].includes(customRole)) {
        role = customRole as UserRole;
      }
    }

    // Extract creator slug if present (for creator-linked users)
    const creatorSlug = payload["custom:creatorSlug"] || undefined;

    return {
      userId: payload.sub,
      email: payload.email,
      firstName: payload.given_name || payload.name?.split(" ")[0] || "",
      lastName: payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "",
      emailVerified: payload.email_verified,
      role,
      creatorSlug,
      createdAt: payload["custom:createdAt"],
      lastLoginAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error parsing ID token:", error);
    return null;
  }
}

// ============================================================================
// Authorization Functions
// ============================================================================

/**
 * Require authentication - throws if user is not logged in
 * Use in Server Components and Server Actions
 *
 * @throws Error if user is not authenticated
 * @returns The authenticated user
 */
export async function requireAuth(): Promise<User> {
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.user) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }

  return session.user;
}

/**
 * Require admin role - throws if user is not an admin
 * Use to protect admin-only routes and actions
 *
 * @throws Error if user is not an admin
 * @returns The authenticated admin user
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    throw new Error("FORBIDDEN: Admin access required");
  }

  return user;
}

/**
 * Require a minimum role level - throws if user doesn't meet requirement
 * Uses role hierarchy: user < client < creator < admin
 *
 * @param requiredRole The minimum role required
 * @throws Error if user doesn't have sufficient permissions
 * @returns The authenticated user
 */
export async function requireRole(requiredRole: UserRole): Promise<User> {
  const user = await requireAuth();

  const userLevel = ROLE_HIERARCHY[user.role];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  if (userLevel < requiredLevel) {
    throw new Error(`FORBIDDEN: ${requiredRole} access required`);
  }

  return user;
}

/**
 * Require creator access to a specific creator profile
 * Either the user must be an admin OR be the creator who owns the profile
 *
 * @param creatorSlug The slug of the creator profile
 * @throws Error if user doesn't have access
 * @returns The authenticated user
 */
export async function requireCreatorAccess(creatorSlug: string): Promise<User> {
  const user = await requireAuth();

  // Admins can access any creator profile
  if (user.role === "admin") {
    return user;
  }

  // Creators can only access their own profile
  if (user.role === "creator" && user.creatorSlug === creatorSlug) {
    return user;
  }

  throw new Error("FORBIDDEN: You don't have access to this creator profile");
}

// ============================================================================
// Check Functions (non-throwing)
// ============================================================================

/**
 * Check if the current user is authenticated (non-throwing)
 * @returns true if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession();
  return session.isAuthenticated;
}

/**
 * Check if the current user has admin role (non-throwing)
 * @returns true if user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession();
  return session.isAuthenticated && session.user?.role === "admin";
}

/**
 * Check if current user has at least the specified role (non-throwing)
 * @param requiredRole The minimum role to check
 * @returns true if user meets the role requirement
 */
export async function hasMinimumRole(requiredRole: UserRole): Promise<boolean> {
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.user) {
    return false;
  }

  const userLevel = ROLE_HIERARCHY[session.user.role];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  return userLevel >= requiredLevel;
}

/**
 * Check if current user can access a specific creator profile (non-throwing)
 * @param creatorSlug The slug of the creator profile
 * @returns true if user has access
 */
export async function canAccessCreator(creatorSlug: string): Promise<boolean> {
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.user) {
    return false;
  }

  // Admins can access any creator
  if (session.user.role === "admin") {
    return true;
  }

  // Creators can access their own profile
  if (session.user.role === "creator" && session.user.creatorSlug === creatorSlug) {
    return true;
  }

  return false;
}
