import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DatabaseHelpers } from "../../lib/database";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { validateRequest } from "../../lib/zod-validation";
import * as z from "zod";
import { withCorsWrapper } from "../../lib/cors-wrapper";
import { sendVerificationEmail, generateVerificationCode } from "../../lib/email-service";

const resendVerificationSchema = z.object({
  email: z.string().email("Valid email is required"),
});

interface ResendVerificationRequest {
  email: string;
}

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body: ResendVerificationRequest = JSON.parse(event.body || "{}");
    const validatedData = validateRequest(resendVerificationSchema, body);

    const { email } = validatedData;

    console.log("📧 Resend verification attempt for:", email);

    // Get user by email
    const userProfile = await DatabaseHelpers.getUserByEmail(email);
    if (!userProfile) {
      // Return success even if user not found for security (don't reveal if email exists)
      return createSuccessResponse({
        message: "If an account exists with this email, a verification code has been sent.",
      }, event);
    }

    const userId = userProfile.userId;
    const status = userProfile.status;

    // Check if user is a guest account that needs verification
    if (status !== "unverified_guest") {
      return createErrorResponse(
        400,
        "Account is already verified or does not require verification",
        undefined,
        event
      );
    }

    // Generate new verification code
    const verificationData = generateVerificationCode();

    console.log("🔑 Generated new verification code for user:", userId);

    // Store new verification code in DynamoDB
    await DatabaseHelpers.storeVerificationCode(
      userId,
      email,
      verificationData.code,
      verificationData.expiresAt
    );

    // Send verification email
    await sendVerificationEmail(email, verificationData.code);

    console.log("✅ Verification code resent successfully");

    return createSuccessResponse({
      message: "Verification code sent to your email",
      email,
    }, event);
  } catch (error) {
    console.error("❌ Resend verification error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Validation error")) {
        return createErrorResponse(400, error.message, undefined, event);
      }
    }

    return createErrorResponse(
      500,
      "Internal server error while resending verification code",
      undefined,
      event
    );
  }
};

export const handler = withCorsWrapper(baseHandler);
