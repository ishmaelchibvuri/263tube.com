import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DatabaseHelpers } from "../../lib/database";
import {
  createSuccessResponse,
  createErrorResponse,
  requireAuth,
} from "../../lib/auth-middleware";
import { withCorsWrapper } from "../../lib/cors-wrapper";

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      },
      body: "",
    };
  }

  try {
    // Require authentication
    const authResult = await requireAuth(event);
    if (!authResult.authorized || !authResult.userId) {
      return createErrorResponse(401, "Unauthorized", undefined, event);
    }

    const userId = authResult.userId;

    console.log("📝 User passed exam declaration for:", userId);

    // Get user profile
    const userProfile = await DatabaseHelpers.getUserProfile(userId);
    if (!userProfile) {
      return createErrorResponse(404, "User profile not found", undefined, event);
    }

    // Check if user already marked as passed
    if (userProfile.hasPassed) {
      return createErrorResponse(
        400,
        "You've already declared passing your exam. Congratulations again!"
      , undefined, event);
    }

    // Update user profile with passed status
    const passedDate = new Date().toISOString();
    await DatabaseHelpers.updateUserProfile(userId, {
      hasPassed: true,
      passedDate: passedDate,
      updatedAt: passedDate,
    });

    console.log("✅ User marked as passed:", userId);

    // TODO: Implement email automation with SQS/EventBridge
    // For now, just log what would happen:
    console.log("📧 Email automation would be triggered:");
    console.log("  - Testimonial request email (1 hour delay)");
    console.log("  - Referral program email (24 hour delay)");

    // In production, this would:
    // 1. Send message to SQS queue with 1-hour delay for testimonial email
    // 2. Send message to SQS queue with 24-hour delay for referral email
    // Example (not implemented):
    // await sqsClient.send(new SendMessageCommand({
    //   QueueUrl: process.env.EMAIL_QUEUE_URL,
    //   MessageBody: JSON.stringify({
    //     type: 'testimonial_request',
    //     userId,
    //     email: userProfile.email,
    //     firstName: userProfile.firstName,
    //   }),
    //   DelaySeconds: 3600, // 1 hour
    // }));

    return createSuccessResponse({
      message: "Congratulations on passing your RE5 exam! 🎉",
      userId,
      hasPassed: true,
      passedDate,
      nextSteps: [
        "Check your email in 1 hour for a testimonial request",
        "Refer friends in 24 hours to unlock the RE5 Pro Career Kit",
      ],
    }, event);
  } catch (error) {
    console.error("❌ User passed declaration error:", error);

    return createErrorResponse(
      500,
      "Internal server error while processing your declaration"
    , undefined, event);
  }
};

export const handler = withCorsWrapper(baseHandler);
