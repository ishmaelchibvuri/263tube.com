/**
 * 263Tube - Route Protection Middleware
 *
 * Protects routes based on authentication and role requirements:
 * - /admin/* routes require ADMIN role
 * - /dashboard/* routes require authentication
 * - Redirects unauthorized users appropriately
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route configuration
const PROTECTED_ROUTES = {
  admin: "/admin",
  dashboard: "/dashboard",
  creatorDashboard: "/creator/dashboard",
  creatorEdit: "/creator/*/edit",
  sponsorDashboard: "/sponsor/dashboard",
};

const REDIRECT_PATHS = {
  login: "/login",
  unauthorized: "/unauthorized",
  home: "/",
};

/**
 * Extract user info from Cognito ID token in cookies
 * This is a lightweight check for middleware - full validation happens server-side
 */
function getUserFromCookies(request: NextRequest): {
  isAuthenticated: boolean;
  role: string | null;
} {
  // Look for Amplify auth cookies
  const cookies = request.cookies.getAll();

  // Find ID token cookie (Amplify v6 format)
  const idTokenCookie = cookies.find(
    (cookie) =>
      cookie.name.includes("idToken") ||
      (cookie.name.includes("CognitoIdentityServiceProvider") &&
        cookie.name.includes("idToken"))
  );

  if (!idTokenCookie?.value) {
    return { isAuthenticated: false, role: null };
  }

  try {
    // Decode JWT payload (lightweight check - not verifying signature in middleware)
    const parts = idTokenCookie.value.split(".");
    if (parts.length !== 3) {
      return { isAuthenticated: false, role: null };
    }

    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64").toString("utf-8")
    );

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { isAuthenticated: false, role: null };
    }

    // Extract role from Cognito groups
    let role = "user";
    if (payload["cognito:groups"]) {
      const groups = payload["cognito:groups"] as string[];
      if (groups.includes("admin") || groups.includes("admins")) {
        role = "admin";
      } else if (groups.includes("creator") || groups.includes("creators")) {
        role = "creator";
      } else if (groups.includes("sponsor") || groups.includes("sponsors")) {
        role = "sponsor";
      }
    }

    // Check custom:role attribute as fallback
    if (role === "user" && payload["custom:role"]) {
      const customRole = payload["custom:role"].toLowerCase();
      if (["admin", "creator", "sponsor"].includes(customRole)) {
        role = customRole;
      }
    }

    return { isAuthenticated: true, role };
  } catch {
    return { isAuthenticated: false, role: null };
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { isAuthenticated, role } = getUserFromCookies(request);

  // ============================================================================
  // Admin Routes Protection
  // ============================================================================
  if (pathname.startsWith(PROTECTED_ROUTES.admin)) {
    // Not authenticated -> redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL(REDIRECT_PATHS.login, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated but not admin -> redirect to unauthorized
    if (role !== "admin") {
      return NextResponse.redirect(
        new URL(REDIRECT_PATHS.unauthorized, request.url)
      );
    }

    // Admin user -> allow access
    return NextResponse.next();
  }

  // ============================================================================
  // User Dashboard Protection (any authenticated user)
  // ============================================================================
  if (pathname.startsWith(PROTECTED_ROUTES.dashboard)) {
    if (!isAuthenticated) {
      const loginUrl = new URL(REDIRECT_PATHS.login, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ============================================================================
  // Creator Dashboard Protection (Creators only)
  // ============================================================================
  if (pathname.startsWith(PROTECTED_ROUTES.creatorDashboard)) {
    // Not authenticated -> redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL(REDIRECT_PATHS.login, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Only creators and admins can access creator dashboard
    if (role !== "creator" && role !== "admin") {
      return NextResponse.redirect(
        new URL(REDIRECT_PATHS.unauthorized, request.url)
      );
    }

    // Creator or Admin user -> allow access
    return NextResponse.next();
  }

  // ============================================================================
  // Sponsor Dashboard Protection (Sponsors only)
  // ============================================================================
  if (pathname.startsWith("/sponsor/dashboard")) {
    // Not authenticated -> redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL(REDIRECT_PATHS.login, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Only sponsors and admins can access sponsor dashboard
    if (role !== "sponsor" && role !== "admin") {
      return NextResponse.redirect(
        new URL(REDIRECT_PATHS.unauthorized, request.url)
      );
    }

    // Sponsor or Admin user -> allow access
    return NextResponse.next();
  }

  // ============================================================================
  // Creator Profile Edit Protection
  // ============================================================================
  if (pathname.match(/^\/creator\/[^/]+\/edit/)) {
    // Not authenticated -> redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL(REDIRECT_PATHS.login, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Only creators and admins can edit profiles
    if (role !== "creator" && role !== "admin") {
      return NextResponse.redirect(
        new URL(REDIRECT_PATHS.unauthorized, request.url)
      );
    }

    return NextResponse.next();
  }

  // ============================================================================
  // Public Routes
  // ============================================================================
  return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    // Match admin routes
    "/admin/:path*",
    // Match user dashboard (any authenticated user)
    "/dashboard/:path*",
    // Match creator dashboard (creator-only)
    "/creator/dashboard/:path*",
    // Match creator edit pages (creator-only)
    "/creator/:slug/edit/:path*",
    // Match sponsor dashboard (sponsor-only)
    "/sponsor/dashboard/:path*",
  ],
};
