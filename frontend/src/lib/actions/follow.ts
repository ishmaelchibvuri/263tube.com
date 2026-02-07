"use server";

import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/creators";

const getTableName = (): string => {
  const env =
    process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.ENVIRONMENT || "dev";
  return process.env.DYNAMODB_TABLE_NAME || `263tube-${env}`;
};

/**
 * Atomically increment the follow count for a creator.
 * Returns the new follow count.
 */
export async function followCreator(
  slug: string
): Promise<{ followCount: number }> {
  const tableName = getTableName();

  try {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        pk: `CREATOR#${slug}`,
        sk: "METADATA",
      },
      UpdateExpression:
        "SET followCount = if_not_exists(followCount, :zero) + :inc, updatedAt = :now",
      ExpressionAttributeValues: {
        ":inc": 1,
        ":zero": 0,
        ":now": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
      ConditionExpression: "attribute_exists(pk)",
    });

    const response = await docClient.send(command);
    const newCount = (response.Attributes?.followCount as number) ?? 1;
    return { followCount: newCount };
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      throw new Error("Creator not found");
    }
    console.error("Error following creator:", error);
    throw new Error("Failed to follow creator");
  }
}
