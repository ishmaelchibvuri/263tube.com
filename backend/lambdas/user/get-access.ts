import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { withCorsWrapper } from "../../lib/cors-wrapper";

/**
 * GET /user/access
 * Get user's subscription access level
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

    console.log("📋 Fetching access for user:", userId);

    // For now, return a simple free tier access
    // TODO: Implement proper subscription checking from DynamoDB
    const subscription = {
      tier: 'free' as const,
      status: 'active' as const,
      features: [
        'basic_debt_tracking',
        'budget_planning',
        'debt_free_calculator',
        'in_duplum_audit'
      ]
    };

    return createSuccessResponse({ subscription }, 200, event);
  } catch (error) {
    console.error("❌ Error getting user access:", error);

    if (error instanceof Error) {
      return createErrorResponse(500, error.message, undefined, event);
    }

    return createErrorResponse(
      500,
      "Internal server error while getting user access",
      undefined,
      event
    );
  }
};

export const handler = withCorsWrapper(baseHandler);
