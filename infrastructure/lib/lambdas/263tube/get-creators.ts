/**
 * Get Creators Lambda
 *
 * Retrieves all active or featured creators from DynamoDB
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Check if requesting featured creators
    const isFeatured = event.path.includes("/featured");
    const status = isFeatured ? "FEATURED" : "ACTIVE";
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : 50;

    // Optional reach range filtering (uses GSI1 sort key: paddedReach#slug)
    const minReach = event.queryStringParameters?.minReach
      ? parseInt(event.queryStringParameters.minReach)
      : undefined;
    const maxReach = event.queryStringParameters?.maxReach
      ? parseInt(event.queryStringParameters.maxReach)
      : undefined;

    const hasReachRange = minReach !== undefined || maxReach !== undefined;

    let keyCondition = "gsi1pk = :pk";
    const exprValues: Record<string, any> = {
      ":pk": `STATUS#${status}`,
    };

    if (hasReachRange) {
      const low = String(minReach ?? 0).padStart(12, "0") + "#";
      const high = String(maxReach ?? 999999999999).padStart(12, "0") + "#zzzzz";
      keyCondition += " AND gsi1sk BETWEEN :low AND :high";
      exprValues[":low"] = low;
      exprValues[":high"] = high;
    }

    // When using a reach range, paginate to collect all matching items
    // (they're typically a subset). Otherwise use the limit directly.
    if (hasReachRange) {
      const allItems: Record<string, any>[] = [];
      let lastEvaluatedKey: Record<string, any> | undefined;

      do {
        const command = new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI1",
          KeyConditionExpression: keyCondition,
          ExpressionAttributeValues: exprValues,
          ScanIndexForward: false,
          ExclusiveStartKey: lastEvaluatedKey,
        });

        const response = await docClient.send(command);
        allItems.push(...(response.Items || []));
        lastEvaluatedKey = response.LastEvaluatedKey;

        if (allItems.length >= limit) {
          allItems.length = limit;
          break;
        }
      } while (lastEvaluatedKey);

      const creators = allItems.map(mapToCreator);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: creators,
          count: creators.length,
        }),
      };
    }

    // Default: simple limited query (top N by reach)
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: exprValues,
      ScanIndexForward: false,
      Limit: limit,
    });

    const response = await docClient.send(command);
    const creators = (response.Items || []).map(mapToCreator);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: creators,
        count: creators.length,
      }),
    };
  } catch (error) {
    console.error("Error fetching creators:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: "Failed to fetch creators",
      }),
    };
  }
};

function mapToCreator(item: Record<string, any>) {
  return {
    slug: item.slug,
    name: item.name,
    bio: item.bio,
    profilePicUrl: item.profilePicUrl,
    bannerUrl: item.bannerUrl,
    coverImageUrl: item.coverImageUrl,
    niche: item.niche,
    tags: item.tags,
    location: item.location,
    status: item.status,
    verified: item.verified || false,
    platforms: item.platforms || {},
    metrics: item.metrics || { totalReach: 0 },
    referralStats: item.referralStats || { currentWeek: 0, allTime: 0 },
    topVideo: item.topVideo,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
