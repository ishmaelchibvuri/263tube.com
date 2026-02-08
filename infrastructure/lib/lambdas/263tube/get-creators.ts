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
    const limitParam = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : undefined;

    const allItems: Record<string, any>[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    // Paginate through all results from DynamoDB
    do {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: {
          ":pk": `STATUS#${status}`,
        },
        ScanIndexForward: false, // Sort by reach descending
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response = await docClient.send(command);
      allItems.push(...(response.Items || []));
      lastEvaluatedKey = response.LastEvaluatedKey;

      // If a limit was specified and we've collected enough, stop early
      if (limitParam && allItems.length >= limitParam) {
        allItems.length = limitParam;
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
