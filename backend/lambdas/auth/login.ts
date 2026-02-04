import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AuthFlowType,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { validateRequest, userSchemas } from "../../lib/validation";
import { DatabaseHelpers } from "../../lib/database";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { LoginRequest } from "../../lib/types";
import { withCorsWrapper } from "../../lib/cors-wrapper";
import { trackUserActivity } from "../../lib/brevo-service";

const cognitoClient = new CognitoIdentityProviderClient({});
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const validatedData = validateRequest<LoginRequest>(userSchemas.login, body);

    const { email, password } = validatedData;

    console.log("🔐 Login attempt for:", email);

    // Authenticate with Cognito
    const authCommand = new InitiateAuthCommand({
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const authResult = await cognitoClient.send(authCommand);

    if (!authResult.AuthenticationResult) {
      return createErrorResponse(401, "Invalid email or password");
    }

    const { AccessToken, IdToken, RefreshToken } =
      authResult.AuthenticationResult;

    console.log("✅ Cognito authentication successful");

    // Get user details from Cognito
    const getUserCommand = new GetUserCommand({
      AccessToken: AccessToken,
    });

    const cognitoUser = await cognitoClient.send(getUserCommand);
    const userId = cognitoUser.UserAttributes?.find(
      (attr) => attr.Name === "sub"
    )?.Value;

    if (!userId) {
      throw new Error("Unable to get user ID from Cognito");
    }

    console.log("👤 User ID from Cognito:", userId);

    // 🔧 FIX: Check if user profile exists, create if not
    let userProfile = await DatabaseHelpers.getUserProfile(userId);

    if (!userProfile) {
      console.log("⚠️  User profile not found in database, creating...");

      // Extract user attributes from Cognito
      const attributes = cognitoUser.UserAttributes || [];
      const firstName =
        attributes.find((attr) => attr.Name === "given_name")?.Value || "";
      const lastName =
        attributes.find((attr) => attr.Name === "family_name")?.Value || "";
      const emailFromCognito =
        attributes.find((attr) => attr.Name === "email")?.Value || email;

      // Create user profile automatically
      await DatabaseHelpers.createUserProfile({
        userId,
        email: emailFromCognito,
        firstName: firstName || "User",
        lastName: lastName || "",
        role: "user", // Default role
        showOnLeaderboard: true,
        isActive: true,
        lastLoginAt: new Date().toISOString(),
      });

      console.log("✅ User profile created successfully");

      // Fetch the newly created profile
      userProfile = await DatabaseHelpers.getUserProfile(userId);
    } else {
      console.log("✅ User profile found, updating last login");
      // Update last login time
      await DatabaseHelpers.updateUserProfile(userId, {
        lastLoginAt: new Date().toISOString(),
      });
    }

    // Track user activity in Brevo
    console.log("📧 Tracking login activity in Brevo");
    try {
      await trackUserActivity(email);
    } catch (brevoError) {
      console.error("⚠️ Brevo tracking failed (non-critical):", brevoError);
      // Don't fail the request if Brevo fails
    }

    return createSuccessResponse({
      message: "Login successful",
      tokens: {
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken,
      },
      user: {
        userId: userProfile?.userId,
        email: userProfile?.email,
        firstName: userProfile?.firstName,
        lastName: userProfile?.lastName,
        role: userProfile?.role,
        showOnLeaderboard: userProfile?.showOnLeaderboard,
      },
    }, 200, event);
  } catch (error) {
    console.error("❌ Login error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Validation error")) {
        return createErrorResponse(400, error.message, undefined, event);
      }
      if (error.message.includes("NotAuthorizedException")) {
        return createErrorResponse(401, "Invalid email or password", undefined, event);
      }
      if (error.message.includes("UserNotConfirmedException")) {
        return createErrorResponse(
          401,
          "Please confirm your email address before logging in",
          undefined,
          event
        );
      }
    }

    return createErrorResponse(500, "Internal server error during login", undefined, event);
  }
};

export const handler = withCorsWrapper(baseHandler);
