import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { validateRequest, userSchemas } from "../../lib/validation";
import { DatabaseHelpers } from "../../lib/database";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { RegisterRequest } from "../../lib/types";
import { withCorsWrapper } from "../../lib/cors-wrapper";
import { addContactToBrevo } from "../../lib/brevo-service";

const cognitoClient = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const validatedData = validateRequest<RegisterRequest>(userSchemas.register, body);

    const { email, password, firstName, lastName, role, showOnLeaderboard } =
      validatedData;

    console.log("📝 Registration attempt for:", email);

    // Create user in Cognito
    const signUpCommand = new SignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
    });

    const signUpResult = await cognitoClient.send(signUpCommand);

    if (!signUpResult.UserSub) {
      throw new Error("Failed to create user in Cognito");
    }

    const userId = signUpResult.UserSub;
    console.log("✅ Cognito user created with ID:", userId);

    // Auto-confirm user (for development - in production, use email verification)
    if (
      process.env.ENVIRONMENT === "dev" ||
      process.env.ENVIRONMENT === "development"
    ) {
      console.log("🔧 Auto-confirming user (dev mode)");
      const confirmCommand = new AdminConfirmSignUpCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      });

      await cognitoClient.send(confirmCommand);
      console.log("✅ User auto-confirmed");
    }

    // 🔧 FIX: Check if profile already exists before creating
    const existingProfile = await DatabaseHelpers.getUserProfile(userId);

    if (existingProfile) {
      console.log("⚠️  Profile already exists for this user");
      return createErrorResponse(400, "User profile already exists");
    }

    // Create user profile in database
    console.log("📝 Creating user profile in DynamoDB");
    await DatabaseHelpers.createUserProfile({
      userId,
      email,
      firstName,
      lastName,
      role: role || "user",
      showOnLeaderboard: showOnLeaderboard !== false, // Default to true
      isActive: true,
      lastLoginAt: new Date().toISOString(),
    });

    console.log("✅ User profile created successfully");

    // Add user to Brevo email marketing list
    console.log("📧 Adding contact to Brevo email list");
    try {
      const brevoResult = await addContactToBrevo(email, {
        firstName,
        lastName,
        signupSource: "registration_form",
        role: role || "user",
      });

      if (brevoResult.success) {
        console.log("✅ Contact added to Brevo successfully:", brevoResult.contactId);
      } else {
        console.warn("⚠️  Failed to add contact to Brevo:", brevoResult.message);
      }
    } catch (brevoError) {
      console.error("❌ Error adding contact to Brevo:", brevoError);
      // Don't fail registration if Brevo integration fails
    }

    return createSuccessResponse({
      message: "User registered successfully",
      userId,
      email,
      requiresConfirmation:
        process.env.ENVIRONMENT !== "dev" &&
        process.env.ENVIRONMENT !== "development",
    }, 200, event);
  } catch (error) {
    console.error("❌ Registration error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Validation error")) {
        return createErrorResponse(400, error.message, undefined, event);
      }
      if (error.message.includes("UsernameExistsException")) {
        return createErrorResponse(400, "User already exists with this email", undefined, event);
      }
      if (error.message.includes("already exists")) {
        return createErrorResponse(400, "User already exists with this email", undefined, event);
      }
    }

    return createErrorResponse(
      500,
      "Internal server error during registration",
      undefined,
      event
    );
  }
};

export const handler = withCorsWrapper(baseHandler);
