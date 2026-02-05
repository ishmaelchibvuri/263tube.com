/**
 * Track Referral Lambda
 *
 * Tracks a referral click for a creator using atomic counters
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
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

    const now = new Date().toISOString();

    // Use atomic increment to update referral counts
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CREATOR#${slug}`,
        sk: "METADATA",
      },
      UpdateExpression: `
        SET referralStats.currentWeek = if_not_exists(referralStats.currentWeek, :zero) + :inc,
            referralStats.allTime = if_not_exists(referralStats.allTime, :zero) + :inc,
            referralStats.lastReferralAt = :now,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":inc": 1,
        ":zero": 0,
        ":now": now,
      },
      ReturnValues: "ALL_NEW",
      ConditionExpression: "attribute_exists(pk)",
    });

    const response = await docClient.send(command);

    if (!response.Attributes) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Creator not found",
        }),
      };
    }

    const referralStats = response.Attributes.referralStats;

    // Update the GSI3 sort key for leaderboard
    await updateReferralLeaderboardIndex(slug, referralStats.currentWeek);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: {
          slug,
          referralStats,
        },
      }),
    };
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Creator not found",
        }),
      };
    }

    console.error("Error tracking referral:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: "Failed to track referral",
      }),
    };
  }
};

async function updateReferralLeaderboardIndex(
  slug: string,
  currentWeekCount: number
): Promise<void> {
  // Pad the count for proper string sorting (descending)
  // Use 999999999 - count to sort descending (higher counts first)
  const sortValue = 999999999 - currentWeekCount;
  const gsi3sk = `${String(sortValue).padStart(9, "0")}#${slug}`;

  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CREATOR#${slug}`,
        sk: "METADATA",
      },
      UpdateExpression: "SET gsi3pk = :pk, gsi3sk = :sk",
      ExpressionAttributeValues: {
        ":pk": "REFERRAL#WEEKLY",
        ":sk": gsi3sk,
      },
    });

    await docClient.send(command);
  } catch (error) {
    console.error("Error updating referral leaderboard index:", error);
    // Non-critical, don't throw
  }
}
