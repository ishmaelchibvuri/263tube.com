/**
 * Get Creator By Slug Lambda
 *
 * Retrieves a single creator by their URL slug
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
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
    const slug = event.pathParameters?.slug;

    if (!slug) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Missing slug parameter",
        }),
      };
    }

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CREATOR#${slug}`,
        sk: "METADATA",
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Creator not found",
        }),
      };
    }

    const creator = mapToCreator(response.Item);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: creator,
      }),
    };
  } catch (error) {
    console.error("Error fetching creator:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: "Failed to fetch creator",
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
    contactEmail: item.contactEmail,
    bookingUrl: item.bookingUrl,
  };
}
