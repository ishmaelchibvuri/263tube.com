import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DebtDatabaseHelpers } from "../../lib/debt-database";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { withCorsWrapper } from "../../lib/cors-wrapper";

/**
 * GET /budget
 * Get the user's budget
 */
const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;

    if (!userId) {
      console.error("❌ No userId found in authorizer context");
      return createErrorResponse(401, "Unauthorized", undefined, event);
    }

    // Get month from query parameters, default to current month
    const month = event.queryStringParameters?.month || new Date().toISOString().slice(0, 7);

    console.log("💰 Fetching budget for user:", userId, "month:", month);

    const budget = await DebtDatabaseHelpers.getUserBudget(userId, month);

    if (!budget) {
      console.log("📝 No budget found for user, returning empty budget");
      return createSuccessResponse({
        budget: null,
        message: "No budget found. Create one to get started.",
      }, 200, event);
    }

    console.log("✅ Budget retrieved successfully");

    return createSuccessResponse({
      budget,
    }, 200, event);
  } catch (error) {
    console.error("❌ Error getting budget:", error);

    if (error instanceof Error) {
      return createErrorResponse(500, error.message, undefined, event);
    }

    return createErrorResponse(
      500,
      "Internal server error while getting budget",
      undefined,
      event
    );
  }
};

export const handler = withCorsWrapper(baseHandler);
