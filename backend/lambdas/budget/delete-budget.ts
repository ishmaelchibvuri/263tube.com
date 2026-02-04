import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DebtDatabaseHelpers } from "../../lib/debt-database";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { withCorsWrapper } from "../../lib/cors-wrapper";

/**
 * DELETE /budget
 * Delete the user's budget for a specific month
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

    // Get month from query parameters
    const month = event.queryStringParameters?.month;

    if (!month) {
      return createErrorResponse(
        400,
        "Month parameter is required",
        undefined,
        event
      );
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return createErrorResponse(
        400,
        "Invalid month format. Expected YYYY-MM",
        undefined,
        event
      );
    }

    console.log("🗑️ Deleting budget for user:", userId, "month:", month);

    // Delete the budget (DynamoDB won't fail if it doesn't exist)
    await DebtDatabaseHelpers.deleteBudget(userId, month);

    console.log("✅ Budget deleted successfully");

    return createSuccessResponse({
      message: "Budget deleted successfully",
    }, 200, event);
  } catch (error) {
    console.error("❌ Error deleting budget:", error);

    if (error instanceof Error) {
      return createErrorResponse(500, error.message, undefined, event);
    }

    return createErrorResponse(
      500,
      "Internal server error while deleting budget",
      undefined,
      event
    );
  }
};

export const handler = withCorsWrapper(baseHandler);
