import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DatabaseHelpers } from "../../lib/database";
import {
  createSuccessResponse,
  createErrorResponse,
  requireAuth,
} from "../../lib/auth-middleware";
import { validateRequest } from "../../lib/zod-validation";
import * as z from "zod";
import { withCorsWrapper } from "../../lib/cors-wrapper";
import { sendWelcomeEmail } from "../../lib/email-service";
import { addContactToBrevo } from "../../lib/brevo-service";

const cognitoClient = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;

const completeAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface CompleteAccountRequest {
  firstName: string;
  lastName: string;
  password: string;
}

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Require authentication
    const authResult = await requireAuth(event);
    if (!authResult.authorized || !authResult.userId) {
      return createErrorResponse(401, "Unauthorized", undefined, event);
    }

    const userId = authResult.userId;
    const body: CompleteAccountRequest = JSON.parse(event.body || "{}");
    const validatedData = validateRequest(completeAccountSchema, body);

    const { firstName, lastName, password } = validatedData;

    console.log("📝 Account completion attempt for user:", userId);

    // Get user profile
    const userProfile = await DatabaseHelpers.getUserProfile(userId);
    if (!userProfile) {
      return createErrorResponse(404, "User profile not found", undefined, event);
    }

    // Check if user is a guest account
    if (userProfile.status !== "unverified_guest") {
      return createErrorResponse(
        400,
        "Account is already complete or not a guest account"
      , undefined, event);
    }

    const email = userProfile.email;

    // Update Cognito user with new password
    console.log("🔒 Setting new password in Cognito");
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    });
    await cognitoClient.send(setPasswordCommand);
    console.log("✅ Password set successfully");

    // Update Cognito user attributes with name
    console.log("📝 Updating Cognito user attributes");
    const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
    });
    await cognitoClient.send(updateAttributesCommand);
    console.log("✅ User attributes updated");

    // Update user profile in DynamoDB
    console.log("📝 Updating user profile in DynamoDB");
    await DatabaseHelpers.updateUserProfile(userId, {
      firstName,
      lastName,
      status: "verified_free",
      showOnLeaderboard: true, // Now that account is complete, show on leaderboard
      updatedAt: new Date().toISOString(),
    });
    console.log("✅ User profile updated successfully");

    // Add user to Brevo email marketing list
    console.log("📧 Adding contact to Brevo email list");
    try {
      const brevoResult = await addContactToBrevo(email, {
        firstName,
        lastName,
        accountStatus: "verified_free",
        signupSource: "account_completion",
      });

      if (brevoResult.success) {
        console.log("✅ Contact added to Brevo successfully:", brevoResult.contactId);
      } else {
        console.warn("⚠️  Failed to add contact to Brevo:", brevoResult.message);
      }
    } catch (brevoError) {
      console.error("❌ Error adding contact to Brevo:", brevoError);
      // Don't fail account completion if Brevo integration fails
    }

    // Send welcome email (don't await to avoid blocking response)
    sendWelcomeEmail(email, firstName)
      .then(() => console.log("✅ Welcome email sent"))
      .catch((err) => console.error("❌ Failed to send welcome email:", err));

    return createSuccessResponse({
      message: "Account completed successfully! You're now on the leaderboard!",
      userId,
      email,
      firstName,
      lastName,
      status: "verified_free",
      showOnLeaderboard: true,
    }, event);
  } catch (error) {
    console.error("❌ Account completion error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Validation error")) {
        return createErrorResponse(400, error.message, undefined, event);
      }
    }

    return createErrorResponse(
      500,
      "Internal server error during account completion"
    , undefined, event);
  }
};

export const handler = withCorsWrapper(baseHandler);
