import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  AuthMiddleware,
  AuthenticatedEvent,
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
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
    // Authenticate user
    const user = await AuthMiddleware.authenticate(event);
    const authenticatedEvent = event as AuthenticatedEvent;
    authenticatedEvent.user = user;

    // Get user statistics
    const userStats = await DatabaseHelpers.getUserStats(user.userId);

    if (!userStats) {
      return createSuccessResponse({
        userId: user.userId,
        stats: {
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          totalTimePracticed: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastAttemptDate: null,
          categoryStats: {},
        },
      }, event);
    }

    // Get recent attempts for trend analysis
    const recentAttempts = await DatabaseHelpers.getUserAttempts(
      user.userId,
      10
    );

    // Calculate improvement trend
    const trend = calculateImprovementTrend(recentAttempts);

    // Calculate category performance
    const categoryPerformance = calculateCategoryPerformance(recentAttempts);

    return createSuccessResponse({
      userId: user.userId,
      stats: {
        totalAttempts: userStats.totalAttempts || 0,
        averageScore: userStats.averageScore || 0,
        highestScore: userStats.highestScore || 0,
        totalTimePracticed: userStats.totalTimePracticed || 0,
        currentStreak: userStats.currentStreak || 0,
        longestStreak: userStats.longestStreak || 0,
        lastAttemptDate: userStats.lastAttemptDate || null,
        categoryStats: userStats.categoryStats || {},
        trend,
        categoryPerformance,
      },
    }, event);
  } catch (error) {
    console.error("Get user stats error:", error);

    if (error instanceof Error) {
      if (error.message.includes("No authorization token")) {
        return createErrorResponse(401, "Authentication required", undefined, event);
      }
      if (error.message.includes("Invalid or expired token")) {
        return createErrorResponse(401, "Invalid or expired token", undefined, event);
      }
    }

    return createErrorResponse(
      500,
      "Internal server error while fetching user stats"
    , undefined, event);
  }
};

function calculateImprovementTrend(attempts: any[]): {
  direction: "improving" | "declining" | "stable";
  percentage: number;
} {
  if (attempts.length < 2) {
    return { direction: "stable", percentage: 0 };
  }

  const sortedAttempts = attempts.sort(
    (a, b) =>
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );
  const firstHalf = sortedAttempts.slice(
    0,
    Math.floor(sortedAttempts.length / 2)
  );
  const secondHalf = sortedAttempts.slice(
    Math.floor(sortedAttempts.length / 2)
  );

  const firstHalfAvg =
    firstHalf.reduce((sum, attempt) => sum + attempt.percentage, 0) /
    firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, attempt) => sum + attempt.percentage, 0) /
    secondHalf.length;

  const improvement = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  if (improvement > 5) {
    return { direction: "improving", percentage: Math.round(improvement) };
  } else if (improvement < -5) {
    return {
      direction: "declining",
      percentage: Math.round(Math.abs(improvement)),
    };
  } else {
    return { direction: "stable", percentage: 0 };
  }
}

function calculateCategoryPerformance(attempts: any[]): Record<
  string,
  {
    attempts: number;
    averageScore: number;
    bestScore: number;
  }
> {
  const categoryStats: Record<
    string,
    { attempts: number; totalScore: number; bestScore: number }
  > = {};

  attempts.forEach((attempt) => {
    const category = attempt.examTitle || "Unknown"; // This would need to be stored in the attempt
    if (!categoryStats[category]) {
      categoryStats[category] = { attempts: 0, totalScore: 0, bestScore: 0 };
    }

    categoryStats[category].attempts++;
    categoryStats[category].totalScore += attempt.percentage;
    categoryStats[category].bestScore = Math.max(
      categoryStats[category].bestScore,
      attempt.percentage
    );
  });

  const result: Record<
    string,
    { attempts: number; averageScore: number; bestScore: number }
  > = {};

  for (const [category, stats] of Object.entries(categoryStats)) {
    result[category] = {
      attempts: stats.attempts,
      averageScore: Math.round((stats.totalScore / stats.attempts) * 100) / 100,
      bestScore: stats.bestScore,
    };
  }

  return result;
}

export const handler = withCorsWrapper(baseHandler);
