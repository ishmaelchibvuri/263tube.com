/**
 * Rename User in Leaderboards Script
 *
 * This script renames a user's firstName in all leaderboard entries
 * across all leaderboard types (DAILY, WEEKLY, MONTHLY, ALLTIME)
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";
const OLD_NAME = "Dragon";
const NEW_NAME = "Thabo";

async function findAndRenameLeaderboardEntries(): Promise<number> {
  console.log(`\n=== Finding all leaderboard entries with firstName="${OLD_NAME}" ===`);
  let updatedCount = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    const response = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :leaderboardPrefix) AND firstName = :oldName",
        ExpressionAttributeValues: {
          ":leaderboardPrefix": "LEADERBOARD#",
          ":oldName": OLD_NAME,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (response.Items && response.Items.length > 0) {
      console.log(`Found ${response.Items.length} entries in this batch`);

      for (const item of response.Items) {
        console.log(`Updating: ${item.PK} / ${item.SK}`);

        try {
          await docClient.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: item.PK,
                SK: item.SK,
              },
              UpdateExpression: "SET firstName = :newName",
              ExpressionAttributeValues: {
                ":newName": NEW_NAME,
              },
            })
          );
          updatedCount++;
        } catch (error) {
          console.error(`Error updating ${item.PK} / ${item.SK}:`, error);
        }
      }
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return updatedCount;
}

async function main() {
  console.log(`Renaming user "${OLD_NAME}" to "${NEW_NAME}" in all leaderboards`);
  console.log(`Target table: ${TABLE_NAME}`);

  try {
    const updatedCount = await findAndRenameLeaderboardEntries();

    console.log(`\n✅ Successfully updated ${updatedCount} leaderboard entries`);
    console.log(`All instances of "${OLD_NAME}" have been renamed to "${NEW_NAME}"`);
  } catch (error) {
    console.error("\n❌ Rename failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
