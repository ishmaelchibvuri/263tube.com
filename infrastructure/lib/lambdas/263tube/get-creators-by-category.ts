/**
 * Get Creators By Category Lambda
 *
 * Retrieves creators filtered by niche/category
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
    const category = event.pathParameters?.category;

    if (!category) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Missing category parameter",
        }),
      };
    }

    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : 50;

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "gsi2pk = :pk",
      ExpressionAttributeValues: {
        ":pk": `CATEGORY#${category}`,
      },
      ScanIndexForward: false, // Sort by reach descending
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
        category: category,
      }),
    };
  } catch (error) {
    console.error("Error fetching creators by category:", error);
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
