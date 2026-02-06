"use server";

import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { hashRequestId } from "@/lib/utils/hash";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "af-south-1",
});

const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
  },
});

const getTableName = (): string => {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.ENVIRONMENT || "dev";
  return process.env.DYNAMODB_TABLE_NAME || `263tube-${env}`;
};

export interface TrackingResult {
  creatorName: string;
  platforms: string[];
  status: string;
  verificationCode?: string | null;
  createdAt: string;
  submissionType: "self" | "other";
}

/**
 * Look up a pending request by its tracking ID (public, no auth required).
 * Returns minimal non-sensitive data.
 */
export async function getRequestByTrackingId(
  trackingId: string
): Promise<TrackingResult | null> {
  const tableName = getTableName();

  try {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: {
        ":pk": "PENDING_REQUEST",
      },
      ScanIndexForward: false,
    });

    const response = await docClient.send(command);
    const items = response.Items || [];

    const match = items.find(
      (item) => item.requestId && hashRequestId(item.requestId) === trackingId
    );

    if (!match) return null;

    return {
      creatorName: match.creatorName,
      platforms: match.platforms || [],
      status: match.status,
      verificationCode: match.verificationCode || null,
      createdAt: match.createdAt,
      submissionType: match.submissionType,
    };
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    return null;
  }
}
