"use server";

import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "@/lib/auth-server";

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

export interface ActivityItem {
  pk: string;
  requestId: string;
  creatorName: string;
  slug: string;
  platforms: string[];
  status: string;
  verificationCode?: string | null;
  createdAt: string;
  updatedAt: string;
  submissionType: "self" | "other";
}

/**
 * Get all pending requests submitted by the current authenticated user.
 */
export async function getMyActivity(): Promise<ActivityItem[]> {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return [];
  }

  const userEmail = session.user.email.toLowerCase();
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

    return items
      .filter((item) => item.submitterEmail?.toLowerCase() === userEmail)
      .map((item) => ({
        pk: item.pk,
        requestId: item.requestId,
        creatorName: item.creatorName,
        slug: item.slug,
        platforms: item.platforms || [],
        status: item.status,
        verificationCode: item.verificationCode || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        submissionType: item.submissionType,
      }));
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return [];
  }
}
