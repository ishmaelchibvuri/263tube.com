import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  AuthenticatedUser,
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { validateQueryParams, userStatsSchemas } from "../../lib/validation";
import { UserHistoryParams } from "../../lib/types";
import { DatabaseHelpers } from "../../lib/database";
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
    // Get user ID from authorizer context
    const userId = event.requestContext?.authorizer?.userId;

    if (!userId) {
      console.error("No userId in authorizer context");
      return createErrorResponse(401, "Authentication required", undefined, event);
    }

    console.log("User ID from authorizer:", userId);

    // Get user profile from database
    const userProfile = await DatabaseHelpers.getUserProfile(userId);
    if (!userProfile) {
      console.error("User profile not found for userId:", userId);
      return createErrorResponse(404, "User profile not found", undefined, event);
    }

    const user: AuthenticatedUser = {
      userId: userProfile.userId,
      email: userProfile.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      role: userProfile.role || "student",
      showOnLeaderboard: userProfile.showOnLeaderboard !== false,
    };

    const validatedParams = validateQueryParams<UserHistoryParams>(
      userStatsSchemas.getHistory,
      event.queryStringParameters
    );

    const { limit, examId, startDate, endDate } = validatedParams;

    // Get user's exam attempts
    let attempts = await DatabaseHelpers.getUserAttempts(user.userId, limit);

    // Filter by exam if specified
    if (examId) {
      attempts = attempts.filter((attempt) => attempt.examId === examId);
    }

    // Filter by date range if specified
    if (startDate || endDate) {
      attempts = attempts.filter((attempt) => {
        const attemptDate = attempt.date;
        if (startDate && attemptDate < startDate) return false;
        if (endDate && attemptDate > endDate) return false;
        return true;
      });
    }

    // Format response
    const formattedAttempts = attempts.map((attempt) => ({
      attemptId: attempt.attemptId,
      examId: attempt.examId,
      examTitle: attempt.examTitle,
      score: attempt.score,
      percentage: attempt.percentage,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      timeTaken: attempt.timeTaken,
      isPassed: attempt.isPassed,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      date: attempt.date,
    }));

    return createSuccessResponse({
      attempts: formattedAttempts,
      total: formattedAttempts.length,
      userId: user.userId,
    }, event);
  } catch (error) {
    console.error("Get user history error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Validation error")) {
        return createErrorResponse(400, error.message, undefined, event);
      }
      if (error.message.includes("No authorization token")) {
        return createErrorResponse(401, "Authentication required", undefined, event);
      }
      if (error.message.includes("Invalid or expired token")) {
        return createErrorResponse(401, "Invalid or expired token", undefined, event);
      }
    }

    return createErrorResponse(
      500,
      "Internal server error while fetching user history"
    , undefined, event);
  }
};

export const handler = withCorsWrapper(baseHandler);
