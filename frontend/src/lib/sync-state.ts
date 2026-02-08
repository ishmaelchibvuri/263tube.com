/**
 * 263Tube - Sync Job State Manager
 *
 * Persists sync job state in DynamoDB so the recursive Vercel cron
 * can resume across multiple 5-minute "ticks".
 *
 * DynamoDB item:
 *   PK = SYNC_JOB#latest
 *   SK = STATE
 *
 * Stores discovered channel IDs, current processing index,
 * completed search queries, and run metadata.
 */

import { docClient } from "@/lib/creators";
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const getTableName = (): string => {
  const env =
    process.env.NEXT_PUBLIC_ENVIRONMENT ||
    process.env.ENVIRONMENT ||
    "dev";
  return process.env.DYNAMODB_TABLE_NAME || `263tube-${env}`;
};

// ============================================================================
// Types
// ============================================================================

export interface SyncJobState {
  /** All discovered YouTube channel IDs */
  channelIds: string[];
  /** Current processing index into channelIds (sync phase) */
  currentIndex: number;
  /** Whether discovery phase is complete */
  discoveryComplete: boolean;
  /** Queries already completed during discovery */
  completedQueries: string[];
  /** YouTube API quota units consumed this run */
  quotaUsed: number;
  /** Channels skipped due to matching ETag */
  etagSkipped: number;
  /** Channels written / updated in DynamoDB */
  written: number;
  /** Run status */
  status: "idle" | "discovering" | "syncing" | "complete" | "error";
  /** ISO timestamp when the run started */
  startedAt: string;
  /** ISO timestamp of the last tick */
  lastTickAt: string;
  /** Number of recursive ticks so far */
  tickCount: number;
  /** Error message if status === "error" */
  errorMessage?: string;
}

const DEFAULT_STATE: SyncJobState = {
  channelIds: [],
  currentIndex: 0,
  discoveryComplete: false,
  completedQueries: [],
  quotaUsed: 0,
  etagSkipped: 0,
  written: 0,
  status: "idle",
  startedAt: "",
  lastTickAt: "",
  tickCount: 0,
};

// ============================================================================
// CRUD
// ============================================================================

/**
 * Load the current sync job state from DynamoDB.
 * Returns default idle state if none exists.
 */
export async function loadSyncState(): Promise<SyncJobState> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: getTableName(),
        Key: { pk: "SYNC_JOB#latest", sk: "STATE" },
      })
    );

    if (!result.Item) return { ...DEFAULT_STATE };

    return {
      channelIds: result.Item.channelIds ?? [],
      currentIndex: result.Item.currentIndex ?? 0,
      discoveryComplete: result.Item.discoveryComplete ?? false,
      completedQueries: result.Item.completedQueries ?? [],
      quotaUsed: result.Item.quotaUsed ?? 0,
      etagSkipped: result.Item.etagSkipped ?? 0,
      written: result.Item.written ?? 0,
      status: result.Item.status ?? "idle",
      startedAt: result.Item.startedAt ?? "",
      lastTickAt: result.Item.lastTickAt ?? "",
      tickCount: result.Item.tickCount ?? 0,
      errorMessage: result.Item.errorMessage,
    };
  } catch (err) {
    console.error("Failed to load sync state:", err);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Save the full sync job state to DynamoDB (full overwrite).
 */
export async function saveSyncState(state: SyncJobState): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: getTableName(),
      Item: {
        pk: "SYNC_JOB#latest",
        sk: "STATE",
        entityType: "SYNC_JOB",
        ...state,
        lastTickAt: new Date().toISOString(),
      },
    })
  );
}

/**
 * Reset sync state to idle for a fresh run.
 */
export async function resetSyncState(): Promise<SyncJobState> {
  const fresh: SyncJobState = {
    ...DEFAULT_STATE,
    startedAt: new Date().toISOString(),
    lastTickAt: new Date().toISOString(),
    status: "idle",
  };
  await saveSyncState(fresh);
  return fresh;
}

/**
 * Atomically increment the written counter (for concurrent safety).
 */
export async function incrementWritten(count: number): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: getTableName(),
        Key: { pk: "SYNC_JOB#latest", sk: "STATE" },
        UpdateExpression:
          "SET written = written + :c, lastTickAt = :now",
        ExpressionAttributeValues: {
          ":c": count,
          ":now": new Date().toISOString(),
        },
      })
    );
  } catch {
    // Non-critical — main state save will capture final count
  }
}
