/**
 * Get Top Referrers Lambda
 *
 * Retrieves trending creators by weekly referral count from DynamoDB
 * Falls back to featured creators if no referral data exists
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
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : 10;

    // Query GSI_REFERRALS for weekly trending creators
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI_REFERRALS",
      KeyConditionExpression: "gsi3pk = :pk",
      ExpressionAttributeValues: {
        ":pk": "REFERRAL#WEEKLY",
      },
      ScanIndexForward: true, // Ascending because sort key is inverted
      Limit: limit,
    });

    const response = await docClient.send(command);

    let creators = (response.Items || []).map(mapToCreator);

    // Fall back to featured creators if no referral data
    if (creators.length === 0) {
      const fallbackCommand = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: {
          ":pk": "STATUS#FEATURED",
        },
        ScanIndexForward: false,
        Limit: limit,
      });

      const fallbackResponse = await docClient.send(fallbackCommand);
      creators = (fallbackResponse.Items || []).map(mapToCreator);
    }

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
    console.error("Error fetching top referrers:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: "Failed to fetch top referrers",
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
