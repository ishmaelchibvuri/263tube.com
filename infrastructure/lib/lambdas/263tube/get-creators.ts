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

    // Optional engagement score filtering (computed server-side)
    const minEngagement = event.queryStringParameters?.minEngagement
      ? parseFloat(event.queryStringParameters.minEngagement)
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

    // When filtering by engagement or reach range, paginate through all items
    // and apply server-side filters before returning
    if (hasReachRange || minEngagement !== undefined) {
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

        for (const item of response.Items || []) {
          if (minEngagement !== undefined) {
            const score = computeEngagement(item);
            if (score < minEngagement) continue;
          }
          allItems.push(item);
          if (allItems.length >= limit) break;
        }

        lastEvaluatedKey = response.LastEvaluatedKey;
      } while (lastEvaluatedKey && allItems.length < limit);

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

/**
 * Compute engagement score (0–10) from a DynamoDB item.
 * Mirrors the frontend calculateEngagementScore logic.
 */
function computeEngagement(item: Record<string, any>): number {
  const metrics = item.metrics || {};
  const platforms = item.platforms || {};

  const totalReach = metrics.totalReach || 0;
  const monthlyViews = metrics.rollingMonthlyViews ?? metrics.monthlyViews ?? 0;
  const totalContent =
    (metrics.videoCount || 0) + (metrics.postCount || 0) ||
    metrics.totalVideos ||
    0;

  let total = 0;

  // 1. Views-to-Reach Ratio (0–4 pts)
  if (totalReach > 0 && monthlyViews > 0) {
    const viewRatio = monthlyViews / totalReach;
    if (viewRatio >= 2.0) total += 4;
    else if (viewRatio >= 1.0) total += 3;
    else if (viewRatio >= 0.5) total += 2;
    else if (viewRatio >= 0.1) total += 1;
    else total += 0.5;
  }

  // 2. Content Volume (0–3 pts)
  if (totalContent >= 500) total += 3;
  else if (totalContent >= 200) total += 2.5;
  else if (totalContent >= 100) total += 2;
  else if (totalContent >= 50) total += 1.5;
  else if (totalContent >= 20) total += 1;
  else if (totalContent >= 5) total += 0.5;

  // 3. Audience Scale (0–2 pts)
  if (totalReach >= 1_000_000) total += 2;
  else if (totalReach >= 500_000) total += 1.75;
  else if (totalReach >= 100_000) total += 1.5;
  else if (totalReach >= 50_000) total += 1.25;
  else if (totalReach >= 10_000) total += 1;
  else if (totalReach >= 1_000) total += 0.5;

  // 4. Platform Diversity (0–1 pt)
  let platformCount = 0;
  for (const key of ["youtube", "instagram", "twitter", "facebook", "tiktok", "linkedin", "website"]) {
    if (platforms[key]?.length) platformCount++;
  }
  if (platformCount >= 4) total += 1;
  else if (platformCount >= 3) total += 0.75;
  else if (platformCount >= 2) total += 0.5;

  return Math.min(10, Math.max(0, Math.round(total * 10) / 10));
}

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
