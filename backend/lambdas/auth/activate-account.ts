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
} from "../../lib/auth-middleware";
import { validateRequest } from "../../lib/zod-validation";
import * as z from "zod";
import { withCorsWrapper } from "../../lib/cors-wrapper";
import { sendWelcomeEmail } from "../../lib/email-service";
import { addContactToBrevo } from "../../lib/brevo-service";

const cognitoClient = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;

const activateAccountSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  activationCode: z.string().length(6, "Activation code must be 6 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

interface ActivateAccountRequest {
  email: string;
  firstName: string;
  lastName: string;
  activationCode: string;
  password: string;
}

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body: ActivateAccountRequest = JSON.parse(event.body || "{}");
    const validatedData = validateRequest(activateAccountSchema, body);

    const { email, firstName, lastName, activationCode, password } = validatedData;

    console.log("🔑 Account activation attempt for:", email, `(${firstName} ${lastName})`);

    // Get user by email
    const userProfile = await DatabaseHelpers.getUserByEmail(email);
    if (!userProfile) {
      return createErrorResponse(404, "User account not found", undefined, event);
    }

    const userId = userProfile.userId;

    // Check if user is a guest account
    if (userProfile.status !== "unverified_guest") {
      return createErrorResponse(
        400,
        "Account activation is only available for unverified guest accounts"
      , undefined, event);
    }

    // Get stored verification code
    const verificationRecord = await DatabaseHelpers.getVerificationCode(userId);
    if (!verificationRecord) {
      return createErrorResponse(
        404,
        "No activation code found. Please request a new code."
      , undefined, event);
    }

    // Check if already verified
    if (verificationRecord.verified) {
      return createErrorResponse(
        400,
        "Account already activated. Please log in."
      , undefined, event);
    }

    // Check if code has expired
    const now = new Date();
    const expiresAt = new Date(verificationRecord.expiresAt);
    if (now > expiresAt) {
      return createErrorResponse(
        400,
        "Activation code has expired. Please request a new code."
      , undefined, event);
    }

    // Verify the code (case-insensitive comparison)
    if (activationCode.toUpperCase() !== verificationRecord.code.toUpperCase()) {
      console.log("❌ Invalid activation code provided");
      return createErrorResponse(
        400,
        "Invalid activation code. Please check and try again."
      , undefined, event);
    }

    console.log("✅ Activation code valid, proceeding with account activation");

    // Set the permanent password in Cognito
    try {
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      });
      await cognitoClient.send(setPasswordCommand);
      console.log("✅ Password set successfully in Cognito");
    } catch (cognitoError) {
      console.error("❌ Failed to set password in Cognito:", cognitoError);
      return createErrorResponse(
        500,
        "Failed to set password. Please try again."
      , undefined, event);
    }

    // Update Cognito user attributes with first and last name
    try {
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: "given_name", Value: firstName },
          { Name: "family_name", Value: lastName },
        ],
      });
      await cognitoClient.send(updateAttributesCommand);
      console.log("✅ User attributes updated in Cognito");
    } catch (cognitoError) {
      console.error("⚠️  Failed to update user attributes in Cognito:", cognitoError);
      // Don't fail activation if attribute update fails
    }

    // Mark email as verified in database
    console.log("✅ Marking email as verified");
    await DatabaseHelpers.markEmailAsVerified(userId);

    // Update user status to verified_free (full Free Tier access) with name
    await DatabaseHelpers.updateUserProfile(userId, {
      firstName,
      lastName,
      status: "verified_free",
      showOnLeaderboard: true, // Now can appear on leaderboard
      updatedAt: new Date().toISOString(),
    });

    console.log("✅ Account activated successfully - user now has Free Tier access");

    // Add user to Brevo email marketing list
    console.log("📧 Adding contact to Brevo email list");
    try {
      const brevoResult = await addContactToBrevo(email, {
        firstName,
        lastName,
        accountStatus: "verified_free",
        signupSource: "account_activation",
      });

      if (brevoResult.success) {
        console.log("✅ Contact added to Brevo successfully:", brevoResult.contactId);
      } else {
        console.warn("⚠️  Failed to add contact to Brevo:", brevoResult.message);
      }
    } catch (brevoError) {
      console.error("❌ Error adding contact to Brevo:", brevoError);
      // Don't fail activation if Brevo integration fails
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(email, firstName);
      console.log("✅ Welcome email sent successfully");
    } catch (emailError) {
      console.error("⚠️  Failed to send welcome email:", emailError);
      // Don't fail the activation if email fails
    }

    return createSuccessResponse({
      success: true,
      message: "Account activated successfully! You can now log in with your new password.",
      userId,
      email,
      status: "verified_free",
      verified: true,
      showOnLeaderboard: true,
    }, event);
  } catch (error) {
    console.error("❌ Account activation error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Validation error")) {
        return createErrorResponse(400, error.message, undefined, event);
      }
    }

    return createErrorResponse(
      500,
      "Internal server error during account activation"
    , undefined, event);
  }
};

export const handler = withCorsWrapper(baseHandler);
