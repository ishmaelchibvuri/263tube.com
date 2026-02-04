import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DatabaseHelpers } from "../../lib/database";
import {
  createSuccessResponse,
  createErrorResponse,
  requireAuth,
} from "../../lib/auth-middleware";
import { validateRequest } from "../../lib/zod-validation";
import * as z from "zod";
import { withCorsWrapper } from "../../lib/cors-wrapper";
import { addContactToBrevo } from "../../lib/brevo-service";

const verifyEmailSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 characters"),
});

interface VerifyEmailRequest {
  code: string;
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
    const body: VerifyEmailRequest = JSON.parse(event.body || "{}");
    const validatedData = validateRequest(verifyEmailSchema, body);

    const { code } = validatedData;

    console.log("📧 Email verification attempt for user:", userId);

    // Get user profile
    const userProfile = await DatabaseHelpers.getUserProfile(userId);
    if (!userProfile) {
      return createErrorResponse(404, "User profile not found", undefined, event);
    }

    // Check if user is a guest account
    if (userProfile.status !== "unverified_guest") {
      return createErrorResponse(
        400,
        "Email verification is only required for guest accounts"
      , undefined, event);
    }

    // Get stored verification code
    const verificationRecord = await DatabaseHelpers.getVerificationCode(userId);
    if (!verificationRecord) {
      return createErrorResponse(
        404,
        "No verification code found. Please request a new code."
      , undefined, event);
    }

    // Check if already verified
    if (verificationRecord.verified) {
      return createErrorResponse(
        400,
        "Email already verified. You can now complete your account setup."
      , undefined, event);
    }

    // Check if code has expired
    const now = new Date();
    const expiresAt = new Date(verificationRecord.expiresAt);
    if (now > expiresAt) {
      return createErrorResponse(
        400,
        "Verification code has expired. Please request a new code."
      , undefined, event);
    }

    // Verify the code (case-insensitive comparison)
    if (code.toUpperCase() !== verificationRecord.code.toUpperCase()) {
      console.log("❌ Invalid verification code provided");
      return createErrorResponse(
        400,
        "Invalid verification code. Please check and try again."
      , undefined, event);
    }

    // Mark email as verified in database
    console.log("✅ Verification code valid, marking email as verified");
    await DatabaseHelpers.markEmailAsVerified(userId);

    // Update user status to Free Tier (email verified = full Free Tier access)
    await DatabaseHelpers.updateUserProfile(userId, {
      status: "verified_free", // Email verified = Free Tier user with full access
      showOnLeaderboard: true, // Now can appear on leaderboard
      updatedAt: new Date().toISOString(),
    });

    console.log("✅ Email verified successfully - user now has Free Tier access");

    // Add user to Brevo email marketing list
    console.log("📧 Adding contact to Brevo email list");
    try {
      const brevoResult = await addContactToBrevo(userProfile.email, {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        accountStatus: "verified_free",
        signupSource: "email_verification",
      });

      if (brevoResult.success) {
        console.log("✅ Contact added to Brevo successfully:", brevoResult.contactId);
      } else {
        console.warn("⚠️  Failed to add contact to Brevo:", brevoResult.message);
      }
    } catch (brevoError) {
      console.error("❌ Error adding contact to Brevo:", brevoError);
      // Don't fail email verification if Brevo integration fails
    }

    return createSuccessResponse({
      message: "Email verified successfully! You now have full Free Tier access!",
      userId,
      email: userProfile.email,
      status: "verified_free",
      verified: true,
      showOnLeaderboard: true,
    }, event);
  } catch (error) {
    console.error("❌ Email verification error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Validation error")) {
        return createErrorResponse(400, error.message, undefined, event);
      }
    }

    return createErrorResponse(
      500,
      "Internal server error during email verification"
    , undefined, event);
  }
};

export const handler = withCorsWrapper(baseHandler);
