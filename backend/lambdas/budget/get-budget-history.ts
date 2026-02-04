import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { withCorsWrapper } from "../../lib/cors-wrapper";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * GET /budget/history
 * Get list of months that have budgets
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

    console.log("📊 Fetching budget history for user:", userId);

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "BUDGET#",
      },
      ProjectionExpression: "#month",
      ExpressionAttributeNames: {
        "#month": "month",
      },
      ScanIndexForward: false, // Newest first
    });

    const response = await docClient.send(command);
    const months = (response.Items || [])
      .map(item => item.month)
      .filter(Boolean)
      .sort()
      .reverse(); // Sort descending (newest first)

    console.log("✅ Found budgets for months:", months);

    return createSuccessResponse({
      months,
      count: months.length,
    }, 200, event);
  } catch (error) {
    console.error("❌ Error getting budget history:", error);

    if (error instanceof Error) {
      return createErrorResponse(500, error.message, undefined, event);
    }

    return createErrorResponse(
      500,
      "Internal server error while getting budget history",
      undefined,
      event
    );
  }
};

export const handler = withCorsWrapper(baseHandler);
