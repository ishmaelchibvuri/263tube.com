/**
 * 263Tube — Recursive Vercel Sync Engine
 *
 * POST /api/cron/sync
 *
 * Runs as a Vercel Cron Job to keep 5,000+ creator profiles in sync
 * with YouTube. Uses a recursive batching pattern to work within
 * Vercel's 300-second execution limit.
 *
 * Architecture:
 *   1. Each "tick" processes up to 100 channel IDs (~4 min budget).
 *   2. When the time budget runs out, the tick fires a new request
 *      to itself using waitUntil() and returns immediately.
 *   3. State (discovered IDs, current index, quota) is persisted
 *      in DynamoDB between ticks.
 *
 * Phases:
 *   - Discovery (discoveryMode=true):  YouTube search.list to find
 *     channel IDs, saved to DynamoDB sync state.
 *   - Sync (discoveryMode=false):  Batch-fetch channel data from
 *     YouTube, compare ETags, upload images to S3, write to DynamoDB.
 *
 * Body: { currentIdIndex?: number, discoveryMode?: boolean }
 * Auth: Bearer <CRON_SECRET> header
 */

import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { docClient } from "@/lib/creators";
import {
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  loadSyncState,
  saveSyncState,
  type SyncJobState,
} from "@/lib/sync-state";

// ============================================================================
// Force dynamic — no edge caching for cron endpoint
// ============================================================================
export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Pro: 300s max

// ============================================================================
// Config
// ============================================================================

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "263tube-dev";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "263tube-creator-images";
const S3_REGION =
  process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "af-south-1";
const CRON_SECRET = process.env.CRON_SECRET;

const CHANNEL_BATCH_SIZE = 50; // YouTube channels.list max per request
const CHUNK_SIZE = 100; // Channel IDs to process per tick
const DYNAMO_BATCH_SIZE = 25;
const TIME_BUDGET_MS = 240_000; // 4 minutes — leave 1 min buffer
const DISCOVERY_LIMIT = 5000;
const PAGES_PER_QUERY = 3;
const QUOTA_LIMIT = 9500;

const s3Client = new S3Client({ region: S3_REGION });

// ============================================================================
// Search Queries (ported from seed script)
// ============================================================================

const SEARCH_QUERIES = [
  "Zimbabwe Homesteading",
  "Building in Zimbabwe",
  "Rural Home Zimbabwe",
  "Zim Diaspora Building",
  "Zimbabwe construction vlog",
  "Zimbabwe house build",
  "Relocating to Zimbabwe",
  "Zimbabwe Agriculture",
  "Zimbabwe farming",
  "pfumvudza farming Zimbabwe",
  "ZimDancehall music",
  "Zimbabwe music artist",
  "Zim gospel music",
  "Zimbabwe hip hop",
  "Zim Afrobeats",
  "sungura music Zimbabwe",
  "Zim Comedy skits",
  "Zimbabwe comedy",
  "Zimbabwe entertainment",
  "Zimbabwe News channel",
  "Zimbabwe politics",
  "Zimbabwe current affairs",
  "Zim Tech reviews",
  "Zimbabwe technology",
  "Harare Vlogs",
  "Zimbabwe vlogs daily",
  "life in Zimbabwe",
  "Zimbabwe travel vlog",
  "Zimbabwe food cooking",
  "Bulawayo vlogs",
  "Zimbabwe lifestyle",
  "Zimbabwe education channel",
  "learn Shona language",
  "Zimbabwe cricket",
  "Zimbabwe football soccer",
  "Zimbabwe business",
  "Zimbabwe economy finance",
  "Zimbabwe culture heritage",
  "Shona culture traditions",
  "Ndebele culture",
  "Zimbabwean in UK",
  "Zimbabwean in South Africa",
  "Zimbabwean in USA",
  "Zimbabwean in Australia",
  "Zim diaspora life",
  "Zimbabwe beauty fashion",
  "Zimbabwe motivational speaker",
  "Zimbabwe pastor sermon",
  "Learn Shona",
  "Zim Diaspora stories",
  "Kumusha lifestyle",
];

const DIASPORA_QUERIES = [
  "Zimbabwean in UK",
  "Zimbabwean in South Africa",
  "Zimbabwean in USA",
  "Zimbabwean in Australia",
  "Zim diaspora life",
  "Zim Diaspora stories",
  "Zim Diaspora Building",
  "Learn Shona",
  "Kumusha lifestyle",
  "Relocating to Zimbabwe",
];

// ============================================================================
// Cultural Markers & Niche Inference (ported from seed script)
// ============================================================================

const CULTURAL_MARKERS = [
  "zim", "zimbabwe", "harare", "bulawayo",
  "shona", "ndebele", "kumusha", "mushamukadzi", "diaspora",
];

function hasZimbabweanMarkers(description: string, title: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return CULTURAL_MARKERS.some((m) => text.includes(m));
}

function inferNiche(description: string, title: string): string {
  const t = `${title} ${description}`.toLowerCase();
  if (/homestead|building|construction|rural home/.test(t)) return "homesteading";
  if (/farm|agriculture|pfumvudza/.test(t)) return "farming";
  if (/music|dancehall|riddim|sungura|amapiano|afrobeat/.test(t)) return "music";
  if (/comedy|skit|funny|prank/.test(t)) return "comedy";
  if (/news|politics|263chat|current affairs/.test(t)) return "news";
  if (/tech|review|gadget|software/.test(t)) return "technology";
  if (/beauty|fashion|makeup/.test(t)) return "beauty";
  if (/sport|cricket|football|soccer/.test(t)) return "sports";
  if (/cook|food|recipe|sadza/.test(t)) return "food";
  if (/travel|tourism|safari/.test(t)) return "travel";
  if (/pastor|church|sermon|worship|gospel/.test(t)) return "religion";
  if (/education|tutorial|learn|school/.test(t)) return "education";
  if (/business|invest|economy|finance/.test(t)) return "business";
  if (/vlog|daily life|lifestyle|diaspora/.test(t)) return "lifestyle";
  if (/shona|ndebele|kumusha|mushamukadzi|totem|chimurenga|mbira/.test(t)) return "culture";
  return "entertainment";
}

// ============================================================================
// Time Budget Helper
// ============================================================================

let tickStartTime = 0;

function hasTimeBudget(): boolean {
  return Date.now() - tickStartTime < TIME_BUDGET_MS;
}

// ============================================================================
// Quota Tracker (per-tick, accumulated in state)
// ============================================================================

let tickQuotaUsed = 0;

function trackQuota(units: number): void {
  tickQuotaUsed += units;
}

function hasQuota(units: number, totalUsed: number): boolean {
  return totalUsed + tickQuotaUsed + units <= QUOTA_LIMIT;
}

// ============================================================================
// YouTube API Helpers
// ============================================================================

interface YouTubeChannel {
  id: string;
  etag: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails?: { high?: { url: string } };
    publishedAt?: string;
  };
  statistics: {
    subscriberCount?: string;
    videoCount?: string;
    viewCount?: string;
  };
  brandingSettings?: {
    channel?: { featuredChannelsUrls?: string[] };
    image?: { bannerExternalUrl?: string };
  };
  contentDetails?: {
    relatedPlaylists?: { uploads?: string };
  };
}

// ============================================================================
// S3 Image Upload (ported from seed script)
// ============================================================================

async function uploadToS3(
  imageUrl: string | null,
  slug: string,
  type: "profile" | "banner"
): Promise<string | null> {
  if (!imageUrl) return null;

  const key = `creators/${slug}/${type}.jpg`;
  const s3Url = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${key}`;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok || !response.body) return null;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: response.body as unknown as ReadableStream,
        ContentType: "image/jpeg",
      },
    });

    await upload.done();
    return s3Url;
  } catch {
    return null;
  }
}

// ============================================================================
// Build Creator Item (ported from seed script)
// ============================================================================

interface CreatorItem {
  pk: string;
  sk: string;
  entityType: string;
  gsi1pk: string;
  gsi1sk: string;
  gsi2pk: string;
  gsi2sk: string;
  name: string;
  slug: string;
  bio: string;
  profilePicUrl: string | null;
  primaryProfileImage: string | null;
  bannerUrl: string | null;
  coverImageUrl: string | null;
  niche: string;
  status: string;
  verified: boolean;
  platforms: Record<string, unknown>;
  metrics: Record<string, unknown>;
  verifiedLinks: unknown[];
  createdAt: string;
  updatedAt: string;
  youtubeEtag?: string;
  // Temp fields
  _youtubeProfileUrl?: string | null;
  _youtubeBannerUrl?: string | null;
}

function buildCreatorItem(channel: YouTubeChannel): CreatorItem {
  const { snippet, statistics, brandingSettings } = channel;
  const channelId = channel.id;
  const name = snippet.title;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const niche = inferNiche(snippet.description || "", name);

  const rawCustomUrl = snippet.customUrl || "";
  const youtubeHandle = rawCustomUrl.startsWith("@")
    ? rawCustomUrl.slice(1)
    : rawCustomUrl || null;

  const profileUrl = snippet.thumbnails?.high?.url || null;
  const bannerUrl = brandingSettings?.image?.bannerExternalUrl || null;

  const now = new Date().toISOString();
  const totalReach = parseInt(statistics.subscriberCount || "0");
  const reachSortKey = `${String(totalReach).padStart(12, "0")}#${slug}`;

  const youtubeUrl = youtubeHandle
    ? `https://www.youtube.com/@${youtubeHandle}`
    : `https://www.youtube.com/channel/${channelId}`;

  return {
    pk: `CREATOR#${slug}`,
    sk: "METADATA",
    entityType: "CREATOR",
    gsi1pk: "STATUS#ACTIVE",
    gsi1sk: reachSortKey,
    gsi2pk: `CATEGORY#${niche}`,
    gsi2sk: reachSortKey,
    name,
    slug,
    bio: snippet.description?.slice(0, 500) || "",
    profilePicUrl: profileUrl,
    primaryProfileImage: profileUrl,
    bannerUrl,
    coverImageUrl: bannerUrl,
    niche,
    status: "ACTIVE",
    verified: false,
    platforms: {
      youtube: [{ label: name, url: youtubeUrl, handle: youtubeHandle }],
    },
    metrics: {
      totalReach,
      totalVideos: parseInt(statistics.videoCount || "0"),
      totalViews: parseInt(statistics.viewCount || "0"),
      channelStartDate: snippet.publishedAt || null,
      monthlyViews: Math.round(parseInt(statistics.viewCount || "0") / 12),
    },
    verifiedLinks: [
      {
        platform: "youtube",
        displayName: name,
        followers: totalReach,
        image: profileUrl,
        channelId,
        verifiedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
    _youtubeProfileUrl: profileUrl,
    _youtubeBannerUrl: bannerUrl,
  };
}

// ============================================================================
// Upload Creator Images + Clean Temp Fields
// ============================================================================

async function uploadCreatorImages(creator: CreatorItem): Promise<void> {
  const [profileS3, bannerS3] = await Promise.all([
    uploadToS3(creator._youtubeProfileUrl ?? null, creator.slug, "profile"),
    uploadToS3(creator._youtubeBannerUrl ?? null, creator.slug, "banner"),
  ]);

  const finalProfile = profileS3 || creator._youtubeProfileUrl || null;
  creator.profilePicUrl = finalProfile;
  creator.primaryProfileImage = finalProfile;
  if (
    Array.isArray(creator.verifiedLinks) &&
    creator.verifiedLinks.length > 0
  ) {
    (creator.verifiedLinks[0] as Record<string, unknown>).image = finalProfile;
  }

  const finalBanner = bannerS3 || creator._youtubeBannerUrl || null;
  creator.bannerUrl = finalBanner;
  creator.coverImageUrl = finalBanner;

  // Clean temp fields before DB write
  delete creator._youtubeProfileUrl;
  delete creator._youtubeBannerUrl;
}

// ============================================================================
// Load Existing ETags from DynamoDB
// ============================================================================

async function loadExistingETags(): Promise<Record<string, string>> {
  const etagMap: Record<string, string> = {};
  const partitions = ["STATUS#ACTIVE", "STATUS#FEATURED"];

  try {
    for (const pk of partitions) {
      let lastKey: Record<string, unknown> | undefined;
      do {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "gsi1pk = :pk",
            ExpressionAttributeValues: { ":pk": pk },
            ProjectionExpression: "youtubeEtag, verifiedLinks",
            ExclusiveStartKey: lastKey,
          })
        );
        for (const item of result.Items || []) {
          if (!item.youtubeEtag) continue;
          const ytLink = ((item.verifiedLinks || []) as Record<string, unknown>[]).find(
            (l) => l.platform === "youtube"
          );
          if (ytLink?.channelId) {
            etagMap[ytLink.channelId as string] = item.youtubeEtag as string;
          }
        }
        lastKey = result.LastEvaluatedKey as
          | Record<string, unknown>
          | undefined;
      } while (lastKey);
    }
  } catch (err) {
    console.warn("Could not load existing ETags:", err);
  }

  return etagMap;
}

// ============================================================================
// Process Channel Batch (50 IDs) — fetch + ETag gate + S3 + build item
// ============================================================================

async function processChannelBatch(
  channelIds: string[],
  existingETags: Record<string, string>
): Promise<{ creators: CreatorItem[]; etagSkipped: number }> {
  if (channelIds.length === 0) return { creators: [], etagSkipped: 0 };

  const url = `https://www.googleapis.com/youtube/v3/channels?id=${channelIds.join(
    ","
  )}&part=snippet,statistics,brandingSettings,contentDetails&key=${YOUTUBE_API_KEY}`;

  const res = await fetch(url);
  trackQuota(1);

  if (!res.ok) {
    console.warn(`Batch channel fetch failed: ${res.status}`);
    return { creators: [], etagSkipped: 0 };
  }

  const data = await res.json();
  const items: YouTubeChannel[] = data.items || [];
  const creators: CreatorItem[] = [];
  let skipped = 0;

  for (const channel of items) {
    const channelId = channel.id;
    const itemEtag = channel.etag;

    // ETag gatekeeper — skip unchanged channels
    if (existingETags[channelId] && existingETags[channelId] === itemEtag) {
      skipped++;
      continue;
    }

    const creator = buildCreatorItem(channel);
    creator.youtubeEtag = itemEtag;
    creators.push(creator);
  }

  // Parallel S3 image uploads
  if (creators.length > 0) {
    await Promise.all(creators.map((c) => uploadCreatorImages(c)));
  }

  return { creators, etagSkipped: skipped };
}

// ============================================================================
// Batch Write to DynamoDB (25 items per BatchWriteCommand)
// ============================================================================

async function batchWriteCreators(creators: CreatorItem[]): Promise<number> {
  let written = 0;

  for (let i = 0; i < creators.length; i += DYNAMO_BATCH_SIZE) {
    const batch = creators.slice(i, i + DYNAMO_BATCH_SIZE);
    const putRequests = batch.map((item) => ({
      PutRequest: { Item: item },
    }));

    try {
      let unprocessed: Record<string, unknown[]> | undefined = {
        [TABLE_NAME]: putRequests,
      };
      let retries = 0;

      while ((unprocessed?.[TABLE_NAME]?.length ?? 0) > 0 && retries < 3) {
        const result = await docClient.send(
          new BatchWriteCommand({ RequestItems: unprocessed as never })
        );
        const remaining = result.UnprocessedItems?.[TABLE_NAME]?.length ?? 0;
        written += (unprocessed![TABLE_NAME]?.length ?? 0) - remaining;
        unprocessed = result.UnprocessedItems as Record<string, unknown[]> | undefined;

        if ((unprocessed?.[TABLE_NAME]?.length ?? 0) > 0) {
          retries++;
          await new Promise((r) => setTimeout(r, 1000 * retries));
        }
      }
    } catch (err) {
      console.error(`Batch write failed at offset ${i}:`, err);
    }
  }

  return written;
}

// ============================================================================
// Discovery Phase — YouTube search.list with time budget
// ============================================================================

async function runDiscoveryTick(
  state: SyncJobState
): Promise<{ ids: string[]; completedQueries: string[]; done: boolean }> {
  const uniqueIds = new Set<string>(state.channelIds);
  const completedQueries = new Set<string>(state.completedQueries);

  const allQueries = [
    ...SEARCH_QUERIES.map((q) => ({ query: q, regionCode: "ZW" as const, validate: false })),
    ...DIASPORA_QUERIES.map((q) => ({ query: q, regionCode: null, validate: true })),
  ];

  let allDone = true;

  for (const { query, regionCode, validate } of allQueries) {
    if (uniqueIds.size >= DISCOVERY_LIMIT) break;
    if (completedQueries.has(query)) continue;
    if (!hasTimeBudget()) { allDone = false; break; }
    if (!hasQuota(100, state.quotaUsed)) { allDone = false; break; }

    let pageToken: string | null = null;
    let queryDone = true;

    for (let page = 0; page < PAGES_PER_QUERY && uniqueIds.size < DISCOVERY_LIMIT; page++) {
      if (!hasTimeBudget() || !hasQuota(100, state.quotaUsed)) {
        queryDone = false;
        allDone = false;
        break;
      }

      const params = new URLSearchParams({
        part: "snippet",
        q: query,
        type: "channel",
        maxResults: "50",
        key: YOUTUBE_API_KEY,
      });
      if (regionCode) params.set("regionCode", regionCode);
      if (pageToken) params.set("pageToken", pageToken);

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`
      );
      trackQuota(100);

      if (!res.ok) {
        if (res.status === 403) {
          console.error("YouTube API quota exceeded during discovery.");
          return {
            ids: Array.from(uniqueIds),
            completedQueries: Array.from(completedQueries),
            done: false,
          };
        }
        break;
      }

      const data = await res.json();
      for (const item of data.items || []) {
        const id =
          item.snippet?.channelId || item.id?.channelId;
        if (!id) continue;

        if (validate) {
          const desc = item.snippet?.description || "";
          const title = item.snippet?.title || "";
          if (!hasZimbabweanMarkers(desc, title)) continue;
        }

        uniqueIds.add(id);
      }

      pageToken = data.nextPageToken || null;
      if (!pageToken) break;

      await new Promise((r) => setTimeout(r, 150));
    }

    if (queryDone) completedQueries.add(query);
  }

  return {
    ids: Array.from(uniqueIds).slice(0, DISCOVERY_LIMIT),
    completedQueries: Array.from(completedQueries),
    done: allDone,
  };
}

// ============================================================================
// Sync Phase — batch fetch + ETag gate + S3 + DynamoDB write
// ============================================================================

async function runSyncTick(
  state: SyncJobState,
  existingETags: Record<string, string>
): Promise<{ nextIndex: number; written: number; etagSkipped: number; done: boolean }> {
  const { channelIds, currentIndex } = state;
  const endIndex = Math.min(currentIndex + CHUNK_SIZE, channelIds.length);

  let totalWritten = 0;
  let totalSkipped = 0;

  for (let i = currentIndex; i < endIndex; i += CHANNEL_BATCH_SIZE) {
    if (!hasTimeBudget()) {
      return { nextIndex: i, written: totalWritten, etagSkipped: totalSkipped, done: false };
    }

    const batch = channelIds.slice(i, Math.min(i + CHANNEL_BATCH_SIZE, endIndex));

    const { creators, etagSkipped } = await processChannelBatch(batch, existingETags);
    totalSkipped += etagSkipped;

    if (creators.length > 0) {
      const written = await batchWriteCreators(creators);
      totalWritten += written;
    }

    // Small delay to avoid YouTube rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  const done = endIndex >= channelIds.length;
  return { nextIndex: endIndex, written: totalWritten, etagSkipped: totalSkipped, done };
}

// ============================================================================
// Self-Call — fire the next tick via waitUntil
// ============================================================================

function triggerNextTick(body: { currentIdIndex: number; discoveryMode: boolean }): void {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  const nextFetch = fetch(`${baseUrl}/api/cron/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRON_SECRET}`,
    },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.error("Failed to trigger next tick:", err);
  });

  waitUntil(nextFetch);
}

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(req: NextRequest) {
  tickStartTime = Date.now();
  tickQuotaUsed = 0;

  // ── Auth ──
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { currentIdIndex?: number; discoveryMode?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine — use defaults
  }

  const discoveryMode = body.discoveryMode ?? false;
  const currentIdIndex = body.currentIdIndex ?? 0;

  console.log(
    `[Sync Tick] mode=${discoveryMode ? "discovery" : "sync"} index=${currentIdIndex}`
  );

  try {
    // ── Load persisted state ──
    let state = await loadSyncState();

    // ── Fresh run: reset state if starting from scratch ──
    if (currentIdIndex === 0 && discoveryMode) {
      state = {
        channelIds: [],
        currentIndex: 0,
        discoveryComplete: false,
        completedQueries: [],
        quotaUsed: 0,
        etagSkipped: 0,
        written: 0,
        status: "discovering",
        startedAt: new Date().toISOString(),
        lastTickAt: new Date().toISOString(),
        tickCount: 0,
      };
    }

    state.tickCount++;

    // ════════════════════════════════════════════════════════════════════
    // DISCOVERY PHASE
    // ════════════════════════════════════════════════════════════════════
    if (discoveryMode && !state.discoveryComplete) {
      state.status = "discovering";

      const result = await runDiscoveryTick(state);

      state.channelIds = result.ids;
      state.completedQueries = result.completedQueries;
      state.quotaUsed += tickQuotaUsed;
      state.discoveryComplete = result.done;

      await saveSyncState(state);

      if (!result.done) {
        // More discovery needed — fire next tick
        console.log(
          `[Discovery] ${state.channelIds.length} IDs found so far, ${state.completedQueries.length} queries done. Firing next tick...`
        );

        triggerNextTick({ currentIdIndex: 0, discoveryMode: true });

        return NextResponse.json({
          status: "processing",
          phase: "discovery",
          discovered: state.channelIds.length,
          queriesComplete: state.completedQueries.length,
          tickCount: state.tickCount,
          quotaUsed: state.quotaUsed,
        });
      }

      // Discovery complete — fall through to sync phase
      console.log(
        `[Discovery Complete] ${state.channelIds.length} channel IDs discovered. Starting sync...`
      );
    }

    // ════════════════════════════════════════════════════════════════════
    // SYNC PHASE
    // ════════════════════════════════════════════════════════════════════
    state.status = "syncing";
    state.currentIndex = currentIdIndex;

    if (state.channelIds.length === 0) {
      state.status = "complete";
      await saveSyncState(state);
      return NextResponse.json({
        status: "complete",
        message: "No channel IDs to sync.",
        tickCount: state.tickCount,
      });
    }

    // Load existing ETags for delta detection
    const existingETags = await loadExistingETags();

    const result = await runSyncTick(state, existingETags);

    state.currentIndex = result.nextIndex;
    state.written += result.written;
    state.etagSkipped += result.etagSkipped;
    state.quotaUsed += tickQuotaUsed;

    if (!result.done) {
      // More sync work needed — fire next tick
      await saveSyncState(state);

      console.log(
        `[Sync] Processed ${result.nextIndex}/${state.channelIds.length} (${result.written} written, ${result.etagSkipped} skipped). Firing next tick...`
      );

      triggerNextTick({
        currentIdIndex: result.nextIndex,
        discoveryMode: false,
      });

      return NextResponse.json({
        status: "processing",
        phase: "sync",
        processed: result.nextIndex,
        total: state.channelIds.length,
        written: state.written,
        etagSkipped: state.etagSkipped,
        nextIndex: result.nextIndex,
        tickCount: state.tickCount,
        quotaUsed: state.quotaUsed,
      });
    }

    // ── All done ──
    state.status = "complete";
    await saveSyncState(state);

    console.log(
      `[Sync Complete] ${state.channelIds.length} channels processed. ${state.written} written, ${state.etagSkipped} ETag skipped. ${state.tickCount} ticks. Quota: ${state.quotaUsed}`
    );

    return NextResponse.json({
      status: "complete",
      processed: state.channelIds.length,
      written: state.written,
      etagSkipped: state.etagSkipped,
      tickCount: state.tickCount,
      quotaUsed: state.quotaUsed,
    });
  } catch (error) {
    console.error(`[Sync Error] at index ${currentIdIndex}:`, error);

    // Persist error state so we can resume manually
    try {
      const errState = await loadSyncState();
      errState.status = "error";
      errState.errorMessage = error instanceof Error ? error.message : String(error);
      errState.currentIndex = currentIdIndex;
      await saveSyncState(errState);
    } catch {
      // Double fault — just log
    }

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        currentIdIndex,
        message: `Sync failed at index ${currentIdIndex}. State saved — can resume from this index.`,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET — Vercel Cron entry point + status check
//
// Vercel Cron sends GET requests. When triggered by cron (with the
// CRON_SECRET), it kicks off a full discovery+sync run by self-calling
// POST. When called with ?status=true, it returns current state.
// ============================================================================

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  // Status-only check
  if (searchParams.get("status") === "true") {
    const state = await loadSyncState();
    return NextResponse.json({
      status: state.status,
      channelCount: state.channelIds.length,
      currentIndex: state.currentIndex,
      discoveryComplete: state.discoveryComplete,
      written: state.written,
      etagSkipped: state.etagSkipped,
      quotaUsed: state.quotaUsed,
      tickCount: state.tickCount,
      startedAt: state.startedAt,
      lastTickAt: state.lastTickAt,
      errorMessage: state.errorMessage,
    });
  }

  // Cron trigger — kick off a fresh discovery+sync run
  console.log("[Cron GET] Triggering discovery+sync run...");

  triggerNextTick({ currentIdIndex: 0, discoveryMode: true });

  return NextResponse.json({
    status: "triggered",
    message: "Sync run initiated. Discovery phase starting.",
  });
}
