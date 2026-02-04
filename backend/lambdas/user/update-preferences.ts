import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  AuthMiddleware,
  AuthenticatedEvent,
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { validateRequest, userStatsSchemas } from "../../lib/validation";
import { DatabaseHelpers } from "../../lib/database";
import { UpdatePreferencesRequest } from "../../lib/types";
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

    const body = JSON.parse(event.body || "{}");
    const validatedData = validateRequest<UpdatePreferencesRequest>(
      userStatsSchemas.updatePreferences,
      body
    );

    const { showOnLeaderboard, emailNotifications, theme } = validatedData;

    // Update user preferences
    const updateData: any = {};
    if (showOnLeaderboard !== undefined)
      updateData.showOnLeaderboard = showOnLeaderboard;
    if (emailNotifications !== undefined)
      updateData.emailNotifications = emailNotifications;
    if (theme !== undefined) updateData.theme = theme;

    updateData.updatedAt = new Date().toISOString();

    await DatabaseHelpers.updateUserProfile(user.userId, updateData);

    return createSuccessResponse({
      message: "Preferences updated successfully",
      updatedFields: Object.keys(updateData),
    }, event);
  } catch (error) {
    console.error("Update preferences error:", error);

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
      "Internal server error while updating preferences"
    , undefined, event);
  }
};

export const handler = withCorsWrapper(baseHandler);
