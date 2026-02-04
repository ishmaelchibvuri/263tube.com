import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DatabaseHelpers } from "./database";

const cognitoClient = new CognitoIdentityProviderClient({});

export interface AuthenticatedUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "student" | "admin";
  showOnLeaderboard: boolean;
  impersonatedTier?: "guest" | "free" | "premium" | "pro";
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user: AuthenticatedUser;
}

export class AuthMiddleware {
  static async authenticate(
    event: APIGatewayProxyEvent
  ): Promise<AuthenticatedUser> {
    const token = this.extractToken(event);
    if (!token) {
      throw new Error("No authorization token provided");
    }

    try {
      // Get user info from Cognito
      const command = new GetUserCommand({
        AccessToken: token,
      });

      const cognitoUser = await cognitoClient.send(command);

      if (!cognitoUser.Username) {
        throw new Error("Invalid token");
      }

      // Get user profile from database
      const userProfile = await DatabaseHelpers.getUserProfile(
        cognitoUser.Username
      );
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      // Extract impersonation tier if user is admin
      const impersonatedTier = this.extractImpersonatedTier(event, userProfile.role);

      return {
        userId: userProfile.userId,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        role: userProfile.role || "user",
        showOnLeaderboard: userProfile.showOnLeaderboard !== false,
        impersonatedTier,
      };
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Invalid or expired token");
    }
  }

  static async requireAdmin(user: AuthenticatedUser): Promise<void> {
    if (user.role !== "admin") {
      throw new Error("Admin access required");
    }
  }

  static async requireStudent(user: AuthenticatedUser): Promise<void> {
    if (user.role !== "user" && user.role !== "student" && user.role !== "admin") {
      throw new Error("Student access required");
    }
  }

  static async requireOwnership(
    user: AuthenticatedUser,
    resourceUserId: string
  ): Promise<void> {
    if (user.userId !== resourceUserId && user.role !== "admin") {
      throw new Error("Access denied: You can only access your own resources");
    }
  }

  private static extractToken(event: APIGatewayProxyEvent): string | null {
    const authHeader =
      event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return null;
    }

    // Handle both "Bearer token" and direct token formats
    if (authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    return authHeader;
  }

  /**
   * Extract impersonated tier from request headers
   * Only allows admins to impersonate tiers
   */
  private static extractImpersonatedTier(
    event: APIGatewayProxyEvent,
    userRole: string
  ): "guest" | "free" | "premium" | "pro" | undefined {
    // Only admins can impersonate tiers
    if (userRole !== "admin") {
      return undefined;
    }

    const impersonateHeader =
      event.headers["X-Impersonate-Tier"] ||
      event.headers["x-impersonate-tier"];

    if (!impersonateHeader) {
      return undefined;
    }

    const tier = impersonateHeader.toLowerCase();
    const validTiers = ["guest", "free", "premium", "pro"];

    if (validTiers.includes(tier)) {
      console.log(`Admin impersonating tier: ${tier}`);
      return tier as "guest" | "free" | "premium" | "pro";
    }

    return undefined;
  }
}

export function createResponse(
  statusCode: number,
  body: any,
  headers: Record<string, string> = {},
  event?: APIGatewayProxyEvent
): APIGatewayProxyResult {
  // Import getCorsHeaders dynamically to avoid circular dependency
  let corsHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Impersonate-Tier",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };

  // If event is provided, use origin-specific CORS headers
  if (event) {
    try {
      const { getCorsHeaders } = require('./cors');
      corsHeaders = getCorsHeaders(event);
    } catch (error) {
      console.warn('Could not load CORS headers from config, using defaults');
    }
  }

  return {
    statusCode,
    headers: {
      ...corsHeaders,
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: any,
  event?: APIGatewayProxyEvent
): APIGatewayProxyResult {
  return createResponse(statusCode, {
    error: message,
    details,
    timestamp: new Date().toISOString(),
  }, {}, event);
}

export function createSuccessResponse(
  data: any,
  event?: APIGatewayProxyEvent
): APIGatewayProxyResult;
export function createSuccessResponse(
  data: any,
  statusCode: number,
  event?: APIGatewayProxyEvent
): APIGatewayProxyResult;
export function createSuccessResponse(
  data: any,
  statusCodeOrEvent?: number | APIGatewayProxyEvent,
  event?: APIGatewayProxyEvent
): APIGatewayProxyResult {
  let statusCode = 200;
  let actualEvent: APIGatewayProxyEvent | undefined;

  if (typeof statusCodeOrEvent === 'number') {
    statusCode = statusCodeOrEvent;
    actualEvent = event;
  } else {
    actualEvent = statusCodeOrEvent;
  }

  return createResponse(statusCode, {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }, {}, actualEvent);
}

// Helper functions for simpler authentication in lambdas
export interface AuthResult {
  authorized: boolean;
  userId?: string;
  user?: AuthenticatedUser;
}

export async function requireAuth(
  event: APIGatewayProxyEvent
): Promise<AuthResult> {
  try {
    const user = await AuthMiddleware.authenticate(event);
    return { authorized: true, userId: user.userId, user };
  } catch (error) {
    return { authorized: false };
  }
}

export async function requireAdmin(
  event: APIGatewayProxyEvent
): Promise<AuthResult> {
  try {
    const user = await AuthMiddleware.authenticate(event);
    if (user.role !== "admin") {
      return { authorized: false };
    }
    return { authorized: true, userId: user.userId, user };
  } catch (error) {
    return { authorized: false };
  }
}
