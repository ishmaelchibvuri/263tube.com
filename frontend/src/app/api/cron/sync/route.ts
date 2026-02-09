/**
 * 263Tube — Recursive Vercel Sync Engine
 *
 * POST /api/cron/sync
 *
 * Runs as a Vercel Cron Job to keep 10,000+ creator profiles in sync
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
  UpdateCommand,
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

const MIN_REACH = 100; // Skip creators with fewer than 100 subscribers
const CHANNEL_BATCH_SIZE = 50; // YouTube channels.list max per request
const CHUNK_SIZE = 100; // Channel IDs to process per tick
const DYNAMO_BATCH_SIZE = 25;
const TIME_BUDGET_MS = 240_000; // 4 minutes — leave 1 min buffer
const DISCOVERY_LIMIT = 10000;
const PAGES_PER_QUERY = 3;
const QUOTA_LIMIT = 9500;

const s3Client = new S3Client({ region: S3_REGION });

// ============================================================================
// Search Queries (ported from seed script)
// ============================================================================

const SEARCH_QUERIES = [
  // --- HOMESTEADING, BUILDING & PROPERTY ---
  "Zimbabwe Homesteading",
  "Building in Zimbabwe",
  "Rural Home Zimbabwe",
  "Zim Diaspora Building",
  "Zimbabwe construction vlog",
  "Zimbabwe house build",
  "Murewa building",
  "Modern cottage Zim",
  "Relocating to Zimbabwe",
  "Zimbabwe land restoration",
  "Harare outskirts house tour",
  "Modern rural home Zimbabwe",
  "Murewa cottage project",
  "Building in Dema Zimbabwe",
  "Zim property development vlog",
  "Solar power for rural Zim",
  "Security fencing Harare rural",
  "Harare outskirts stand prices",
  "Dema and Murewa house tours",
  "Goromonzi plot development vlogs",
  "Domboshava Building in Zimbabwe",
  "Ruwa lifestyle and building projects",
  "VakaWise real estate Zimbabwe guide",
  "The Elands building our dream home Zimbabwe",
  "Harare Property Insider",
  "Modern Zim Homestead",

  // --- AGRICULTURE & FARMING ---
  "Zimbabwe Agriculture",
  "Zimbabwe farming",
  "pfumvudza farming Zimbabwe",
  "Zimbabwe livestock farming",
  "Zimbabwe gardening tips",
  "Poultry project Dema Zimbabwe",
  "Road runner chicken farming Zim",
  "Rural homestead Zimbabwe tour",
  "Mwana Wevhu Zim untold",
  "Arizona Poultry & Horticultural Produce",

  // --- MUSIC & ARTS ---
  "ZimDancehall music",
  "Zimbabwe music artist",
  "Zim gospel music",
  "Zimbabwe hip hop",
  "Zim Afrobeats",
  "sungura music Zimbabwe",
  "Zim amapiano",
  "Zim-dancehall riddim",
  "Enzo Ishall",
  "Winky D",
  "Jah Prayzah",
  "Baba Harare",
  "Janet Manyowa",
  "Minister Mahendere",
  "Holy Ten",
  "Voltz JT",
  "Killer T",
  "Feli Nandi",
  "Gemma Griffiths",
  "CKay",
  "Busiswa",
  "Stunner",
  "Mudiwa Hood",
  "EarGROUND",
  "iTAP Media",
  "NashTV",

  // --- COMEDY & ENTERTAINMENT ---
  "Zim Comedy skits",
  "Zimbabwe comedy",
  "Zimbabwe entertainment",
  "Zim pranks funny",
  "Prosper the Comic Pastor",
  "Madam Boss",
  "Mai TT",
  "Tyra Chikocho",
  "Supa Kasu",
  "Naiza Boom",
  "Zimcelebs",

  // --- NEWS, POLITICS & CURRENT AFFAIRS ---
  "Zimbabwe News channel",
  "Zimbabwe politics",
  "Zimbabwe current affairs",
  "Zim diaspora news",
  "Hopewell Chin'ono",
  "H-Metro",
  "Kukurigo",
  "Pindula",
  "ZBC News Online",
  "Zimbuzz",

  // --- TECHNOLOGY & BUSINESS ---
  "Zim Tech reviews",
  "Zimbabwe technology",
  "tech in Zimbabwe",
  "Zimbabwe business",
  "Zimbabwe economy finance",
  "Zimbabwe investment",
  "TechnoMag",
  "Techzim",
  "ZimPriceCheck",
  "Tinashe Mutarisi",

  // --- LIFESTYLE, FOOD & VLOGS ---
  "Harare Vlogs",
  "Zimbabwe vlogs daily",
  "life in Zimbabwe",
  "Zimbabwe travel vlog",
  "Zimbabwe food cooking",
  "Bulawayo vlogs",
  "Zimbabwe lifestyle",
  "Zimbo Kitchen",
  "Arthur C. Evans",
  "Tashas World",
  "MisRed",
  "Zim Returnee Diaries",
  "Village Life with Vusa",

  // --- EDUCATION & VERNACULAR ---
  "Zimbabwe education channel",
  "learn Shona language",
  "Zimbabwe tutorials",
  "Learn Shona",
  "Learn Zim Ndebele",
  "Shona culture traditions",
  "Ndebele culture",
  "Zimbabwe history documentary",
  "Zimbabwe culture heritage",

  // --- BEAUTY, FASHION & CELEBRITY ---
  "Zimbabwe beauty fashion",
  "Zim makeup tutorial",
  "Jacque Mgido",
  "Pokello Nare",
  "Olinda Chapel",

  // --- RELIGION & MOTIVATION ---
  "Zimbabwe motivational speaker",
  "Zimbabwe pastor sermon",
  "Zim church worship",
  "Prophet Magaya",
  "Prophet Makandiwa",
  "Apostle Chiwenga",
  "Prophet Passion Java",
  "Baba Guti",
  "Dj Sparks Zw",

  // --- SPORTS ---
  "Zimbabwe cricket",
  "Zimbabwe football soccer",
  "Zimbabwe sports",

  // --- KEY INFLUENCERS & BRANDS (Direct Search) ---
  "Taste of Home in SA",
  "Shelton and Charmaine",
  "Tari Mac",
  "VakaWise",
  "Mugove and Wife",
  "Kim and Tanaka",
  "Kundai Chitima",
  "Mhiribidi House",
  "Godwin Chirume",
  "Mapepa Homestead",
  "Kaya's Gogo",
  "Lynn Matsa",
  "Kudzie Nicolle Mapiye",
  "Clara & Wellington",
  "Mwana Wevhu",
  "Drewmas Media",
  "Miss Vee",
  "Kelvin Birioti",
  "Sirkund",
  "Mr Chipangamazano",
  "Outback Homestead",
  "Homesteading with Grace",
  "Saruh Pamoja",
  "Trend Setter Guy",
  "Building with the Sibandas",
];

const DIASPORA_QUERIES = [
  "Zimbabwean in UK",
  "Zimbabwean in South Africa",
  "Zimbabwean in USA",
  "Zimbabwean in Australia",
  "Zim diaspora life",
  "Zim Diaspora stories",
  "Zim Diaspora Building",
  "Kumusha lifestyle",
  "Relocating to Zimbabwe mistakes",
  "Hard truths about moving back to Zim",
  "Zimbabwean diaspora returnee stories",
  "Shipping a car from UK to Zimbabwe vlogs",
  "Life in Zimbabwe after 20 years abroad",
  "Building in Zimbabwe from the UK lessons",
  "Diaspora dream vs reality Zimbabwe building",
  "Remote project management Zimbabwe tips",
  "Buying land in Zimbabwe from the diaspora",
  "Zimbabwe house finishing costs",
  "Zimbabwean nurse in Australia building vlogs",
  "Zimbabwean teacher in USA relocating home",
  "Zimbos in Canada investing back home",
  "Groceries to Zim from SA logistics",
  "Cross-border investment for Zimbabweans",
  "Zimbabwean couple building back home",
  "Relocating from SA to Zimbabwe homestead",
  "Zimbos in UK building modern cottages",
  "Diaspora house projects Zimbabwe",
  "Investing in Zimbabwe property vlogs",
];

// ============================================================================
// Zim-Score — weighted cultural markers (ported from seed script)
// ============================================================================

const WEIGHTED_MARKERS: Record<string, number> = {
  // +2: Strong Zimbabwean indicators
  "bulawayo": 2,
  "harare": 2,
  "shona": 2,
  "ndebele": 2,
  "pfumvudza": 2,
  "zim-dancehall": 2,
  "zimdancehall": 2,
  // +1: General Zimbabwean indicators
  "zim": 1,
  "zimbabwe": 1,
  "kumusha": 1,
  "mushamukadzi": 1,
  "diaspora": 1,
};

const NEGATIVE_MARKERS = [
  "lagos", "nollywood", "kenya", "nairobi",
  "ghana", "accra", "nigerian",
];

/**
 * Returns a numeric Zim-Score based on weighted cultural markers.
 * Higher scores = stronger Zimbabwean signal.
 * Negative markers (non-Zimbabwean African terms) reduce the score.
 */
function hasZimbabweanMarkers(description: string, title: string): number {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;

  for (const [marker, weight] of Object.entries(WEIGHTED_MARKERS)) {
    if (text.includes(marker)) score += weight;
  }

  for (const marker of NEGATIVE_MARKERS) {
    if (text.includes(marker)) score -= 1;
  }

  return score;
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
  zimScore: number;
  status: string;
  verified: boolean;
  platforms: Record<string, unknown>;
  metrics: Record<string, unknown>;
  verifiedLinks: unknown[];
  createdAt: string;
  updatedAt: string;
  youtubeEtag?: string;
  videoHighlights?: {
    videoId: string;
    title: string;
    thumbnail: string | null;
    views: number;
    likes: number;
    publishedAt: string;
  }[];
  // Temp fields
  _youtubeProfileUrl?: string | null;
  _youtubeBannerUrl?: string | null;
  _uploadsPlaylistId?: string;
  _isUpdate?: boolean;
  _existingPk?: string;
  _existingSk?: string;
}

function buildCreatorItem(channel: YouTubeChannel): (CreatorItem & { _uploadsPlaylistId?: string }) | null {
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

  // Skip creators with reach below minimum threshold
  if (totalReach < MIN_REACH) return null;

  const reachSortKey = `${String(totalReach).padStart(12, "0")}#${slug}`;

  const youtubeUrl = youtubeHandle
    ? `https://www.youtube.com/@${youtubeHandle}`
    : `https://www.youtube.com/channel/${channelId}`;

  // Compute Zim-Score to determine status
  const zimScore = hasZimbabweanMarkers(snippet.description || "", name);
  const status = zimScore >= 2 ? "ACTIVE" : "PENDING_REVIEW";

  return {
    pk: `CREATOR#${slug}`,
    sk: "METADATA",
    entityType: "CREATOR",
    gsi1pk: `STATUS#${status}`,
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
    zimScore,
    status,
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
    _uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
  };
}

// ============================================================================
// Video Highlights — fetch top videos for embedding on creator profiles
// ============================================================================

async function fetchVideoHighlights(
  uploadsPlaylistId: string
): Promise<CreatorItem["videoHighlights"]> {
  try {
    const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`;
    const plRes = await fetch(plUrl);
    trackQuota(1);
    if (!plRes.ok) return [];
    const plData = await plRes.json();
    const videoIds = (plData.items || []).map(
      (i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId
    );
    if (videoIds.length === 0) return [];

    const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(
      ","
    )}&key=${YOUTUBE_API_KEY}`;
    const vRes = await fetch(vUrl);
    trackQuota(1);
    if (!vRes.ok) return [];
    const vData = await vRes.json();
    const videos = (vData.items || []).map(
      (v: {
        id: string;
        snippet: {
          title: string;
          thumbnails?: { medium?: { url: string }; default?: { url: string } };
          publishedAt: string;
        };
        statistics: { viewCount?: string; likeCount?: string };
      }) => ({
        videoId: v.id,
        title: v.snippet.title || "",
        thumbnail:
          v.snippet.thumbnails?.medium?.url ||
          v.snippet.thumbnails?.default?.url ||
          null,
        views: parseInt(v.statistics.viewCount || "0") || 0,
        likes: parseInt(v.statistics.likeCount || "0") || 0,
        publishedAt: v.snippet.publishedAt,
      })
    );

    const highlights: NonNullable<CreatorItem["videoHighlights"]> = [];
    const addUnique = (v: (typeof highlights)[number] | undefined) => {
      if (v && !highlights.some((h) => h.videoId === v.videoId))
        highlights.push(v);
    };

    // Most viewed
    addUnique([...videos].sort((a: { views: number }, b: { views: number }) => b.views - a.views)[0]);
    // Most liked
    addUnique([...videos].sort((a: { likes: number }, b: { likes: number }) => b.likes - a.likes)[0]);
    // Latest
    addUnique(
      [...videos].sort(
        (a: { publishedAt: string }, b: { publishedAt: string }) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )[0]
    );
    // Oldest
    addUnique(
      [...videos].sort(
        (a: { publishedAt: string }, b: { publishedAt: string }) =>
          new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      )[0]
    );

    return highlights;
  } catch {
    return [];
  }
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

interface ETagEntry {
  etag: string;
  pk: string;
  sk: string;
}

async function loadExistingETags(): Promise<Record<string, ETagEntry>> {
  const etagMap: Record<string, ETagEntry> = {};
  const partitions = [
    "STATUS#ACTIVE",
    "STATUS#FEATURED",
    "STATUS#INACTIVE",
    "STATUS#PENDING_REVIEW",
  ];

  try {
    for (const partition of partitions) {
      let lastKey: Record<string, unknown> | undefined;
      do {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "gsi1pk = :pk",
            ExpressionAttributeValues: { ":pk": partition },
            ProjectionExpression: "pk, sk, youtubeEtag, verifiedLinks",
            ExclusiveStartKey: lastKey,
          })
        );
        for (const item of result.Items || []) {
          if (!item.youtubeEtag) continue;
          const ytLink = ((item.verifiedLinks || []) as Record<string, unknown>[]).find(
            (l) => l.platform === "youtube"
          );
          if (ytLink?.channelId) {
            etagMap[ytLink.channelId as string] = {
              etag: item.youtubeEtag as string,
              pk: item.pk as string,
              sk: item.sk as string,
            };
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
  existingETags: Record<string, ETagEntry>
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

    // ETag comparison: skip unchanged channels
    if (existingETags[channelId]?.etag === itemEtag) {
      skipped++;
      continue;
    }

    const creator = buildCreatorItem(channel);
    if (!creator) continue; // Skip low-reach creators
    creator.youtubeEtag = itemEtag;
    // Tag as update if this channel already exists in the database
    if (existingETags[channelId]) {
      creator._isUpdate = true;
      creator._existingPk = existingETags[channelId].pk;
      creator._existingSk = existingETags[channelId].sk;
    }
    creators.push(creator);
  }

  // Parallel S3 image uploads + video highlight enrichment
  if (creators.length > 0) {
    await Promise.all(
      creators.map(async (c) => {
        await uploadCreatorImages(c);
        // Fetch video highlights for embedding on creator profiles
        if (c._uploadsPlaylistId) {
          const highlights = await fetchVideoHighlights(c._uploadsPlaylistId);
          if (highlights && highlights.length > 0) {
            c.videoHighlights = highlights;
          }
        }
        delete c._uploadsPlaylistId;
      })
    );
  }

  return { creators, etagSkipped: skipped };
}

// ============================================================================
// Write to DynamoDB — update existing, insert new
// ============================================================================

/**
 * Update an existing creator in DynamoDB, preserving admin-managed fields
 * (status, gsi1pk, verified, createdAt) while updating YouTube-sourced data.
 */
async function updateExistingCreator(creator: CreatorItem): Promise<void> {
  const { _existingPk, _existingSk } = creator;
  if (!_existingPk || !_existingSk) return;

  // Use the existing slug (from pk) for sort key consistency
  const existingSlug = _existingPk.replace("CREATOR#", "");
  const totalReach = (creator.metrics as Record<string, number>)?.totalReach || 0;
  const reachSortKey = `${String(totalReach).padStart(12, "0")}#${existingSlug}`;

  const now = new Date().toISOString();

  const setClauses = [
    "#n = :name",
    "bio = :bio",
    "profilePicUrl = :profilePicUrl",
    "primaryProfileImage = :primaryProfileImage",
    "bannerUrl = :bannerUrl",
    "coverImageUrl = :coverImageUrl",
    "niche = :niche",
    "zimScore = :zimScore",
    "gsi1sk = :gsi1sk",
    "gsi2pk = :gsi2pk",
    "gsi2sk = :gsi2sk",
    "metrics = :metrics",
    "platforms = :platforms",
    "verifiedLinks = :verifiedLinks",
    "youtubeEtag = :youtubeEtag",
    "updatedAt = :updatedAt",
  ];

  const expressionValues: Record<string, unknown> = {
    ":name": creator.name,
    ":bio": creator.bio,
    ":profilePicUrl": creator.profilePicUrl,
    ":primaryProfileImage": creator.primaryProfileImage,
    ":bannerUrl": creator.bannerUrl,
    ":coverImageUrl": creator.coverImageUrl,
    ":niche": creator.niche,
    ":zimScore": creator.zimScore,
    ":gsi1sk": reachSortKey,
    ":gsi2pk": `CATEGORY#${creator.niche}`,
    ":gsi2sk": reachSortKey,
    ":metrics": creator.metrics,
    ":platforms": creator.platforms,
    ":verifiedLinks": creator.verifiedLinks,
    ":youtubeEtag": creator.youtubeEtag,
    ":updatedAt": now,
  };

  if (creator.videoHighlights) {
    setClauses.push("videoHighlights = :videoHighlights");
    expressionValues[":videoHighlights"] = creator.videoHighlights;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: _existingPk, sk: _existingSk },
      UpdateExpression: `SET ${setClauses.join(", ")}`,
      ExpressionAttributeNames: { "#n": "name" },
      ExpressionAttributeValues: expressionValues,
    })
  );
}

async function batchWriteCreators(creators: CreatorItem[]): Promise<number> {
  let inserted = 0;
  let updated = 0;

  // Pre-write validation: filter out creators with invalid key fields
  const KEY_FIELDS = ["pk", "sk", "gsi1pk", "gsi1sk"] as const;
  const newCreators: CreatorItem[] = [];
  const existingCreators: CreatorItem[] = [];
  let validationSkipped = 0;

  for (const creator of creators) {
    const invalidFields = KEY_FIELDS.filter(
      (f) => typeof creator[f] !== "string" || (creator[f] as string).trim() === ""
    );
    if (invalidFields.length > 0) {
      validationSkipped++;
      console.warn(
        `[SKIP] Creator "${creator.slug || "unknown"}" has invalid key fields: ${invalidFields.join(", ")}`
      );
      continue;
    }

    if (creator._isUpdate) {
      existingCreators.push(creator);
    } else {
      newCreators.push(creator);
    }
  }

  if (validationSkipped > 0) {
    console.warn(`Validation: skipped ${validationSkipped} creators with invalid keys`);
  }
  console.log(`Split: ${newCreators.length} new inserts, ${existingCreators.length} updates`);

  // --- Update existing creators (preserve admin fields like status, verified) ---
  for (const creator of existingCreators) {
    try {
      await updateExistingCreator(creator);
      updated++;
    } catch (err) {
      const error = err as Error;
      console.error(`Update failed for "${creator.slug}": ${error.message}`);
    }
  }
  if (existingCreators.length > 0) {
    console.log(`Updates complete: ${updated}/${existingCreators.length}`);
  }

  // --- Insert new creators (full item write) ---
  for (let i = 0; i < newCreators.length; i += DYNAMO_BATCH_SIZE) {
    const batch = newCreators.slice(i, i + DYNAMO_BATCH_SIZE);
    const putRequests = batch.map((item) => {
      // Clean up internal tagging fields before DB write
      const clean = { ...item };
      delete clean._isUpdate;
      delete clean._existingPk;
      delete clean._existingSk;
      return { PutRequest: { Item: clean } };
    });

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
        inserted += (unprocessed![TABLE_NAME]?.length ?? 0) - remaining;
        unprocessed = result.UnprocessedItems as Record<string, unknown[]> | undefined;

        if ((unprocessed?.[TABLE_NAME]?.length ?? 0) > 0) {
          retries++;
          await new Promise((r) => setTimeout(r, 1000 * retries));
        }
      }

      if ((unprocessed?.[TABLE_NAME]?.length ?? 0) > 0) {
        console.warn(
          `${unprocessed?.[TABLE_NAME]?.length ?? 0} items failed after retries at offset ${i}`
        );
      }
    } catch (err) {
      const error = err as Error & { $metadata?: { httpStatusCode?: number; requestId?: string } };
      console.error(`Batch write failed at offset ${i}:`);
      console.error(`  Error: ${error.name}: ${error.message}`);
      if (error.$metadata) {
        console.error(`  HTTP status: ${error.$metadata.httpStatusCode}`);
        console.error(`  Request ID: ${error.$metadata.requestId}`);
      }
      const firstItem = batch[0];
      if (firstItem) {
        const itemJson = JSON.stringify(firstItem);
        console.error(`  First item slug: "${firstItem.slug}"`);
        console.error(`  First item JSON size: ${itemJson.length} bytes (${(itemJson.length / 1024).toFixed(1)} KB, limit 400 KB)`);
      }
    }
  }

  console.log(`Write complete: ${inserted} inserted, ${updated} updated`);
  return inserted + updated;
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
          if (hasZimbabweanMarkers(desc, title) < 1) continue;
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
  existingETags: Record<string, ETagEntry>
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
