/**
 * 263Tube - Discovery & Seed Script (v3 — 5000-channel scale)
 *
 * Designed for discovering and maintaining 5000+ Zimbabwean creators.
 *
 * Architecture:
 *   1. Separate Discovery from Sync
 *      - discoverAllChannelIds(): paginated search.list across 40+ queries
 *      - seedCreatorsToDynamo(): BatchWriteCommand in groups of 25
 *
 *   2. Batch Fetching
 *      - processChannelBatch(): up to 50 IDs per channels.list call (1 quota unit)
 *
 *   3. GSI2 for Niche Sorting
 *      - gsi2pk = CATEGORY#<niche>, gsi2sk = <paddedReach>#<slug>
 *      - Instant /categories/[niche] queries at any scale
 *
 *   4. ETag Support
 *      - Stores per-channel YouTube ETag in DynamoDB (youtubeEtag field)
 *      - On re-run, compares ETags to skip unchanged channels
 *      - Sync engine can use stored ETags with If-None-Match headers
 *
 * Quota Management (default 10,000 units/day):
 *   - search.list  = 100 units/call  (discovery)
 *   - channels.list = 1 unit/call    (batch fetch of 50 IDs)
 *   - playlistItems = 1 unit/call    (video highlights)
 *   - videos.list   = 1 unit/call    (video highlights)
 *
 *   Discovery is expensive, so IDs are cached to scripts/.discovery-cache.json
 *   and accumulate across runs. Video highlights are opt-in (--with-highlights).
 *
 * Usage:
 *   node scripts/seed-youtube-creators-with-niches.mjs                  # full run (discover + seed, no highlights)
 *   node scripts/seed-youtube-creators-with-niches.mjs --discover-only  # only discover IDs, save to cache
 *   node scripts/seed-youtube-creators-with-niches.mjs --seed-only      # seed from cache (skip discovery)
 *   node scripts/seed-youtube-creators-with-niches.mjs --with-highlights # include video highlights (costs ~2 units/channel)
 *   node scripts/seed-youtube-creators-with-niches.mjs --quota-limit 8000 # cap quota usage
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
  DeletePublicAccessBlockCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

// Load .env.local
const envPath = resolve(PROJECT_ROOT, ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch (e) {
  console.warn("Could not load .env.local:", e.message);
}

// ============================================================================
// CLI Flags
// ============================================================================

const args = process.argv.slice(2);
const FLAG_DISCOVER_ONLY = args.includes("--discover-only");
const FLAG_SEED_ONLY = args.includes("--seed-only");
const FLAG_WITH_HIGHLIGHTS = args.includes("--with-highlights");
const QUOTA_LIMIT = (() => {
  const idx = args.indexOf("--quota-limit");
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1]) : 9500;
})();

// ============================================================================
// Configuration
// ============================================================================

const SEARCH_QUERIES = [
  // Homesteading & Building
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
  // Agriculture & Farming
  "Zimbabwe Agriculture",
  "Zimbabwe farming",
  "pfumvudza farming Zimbabwe",
  "Zimbabwe livestock farming",
  "Zimbabwe gardening tips",
  // Music
  "ZimDancehall music",
  "Zimbabwe music artist",
  "Zim gospel music",
  "Zimbabwe hip hop",
  "Zim Afrobeats",
  "sungura music Zimbabwe",
  "Zim amapiano",
  // Comedy & Entertainment
  "Zim Comedy skits",
  "Zimbabwe comedy",
  "Zimbabwe entertainment",
  "Zim pranks funny",
  // News & Current Affairs
  "Zimbabwe News channel",
  "Zimbabwe politics",
  "Zimbabwe current affairs",
  "Zim diaspora news",
  // Technology
  "Zim Tech reviews",
  "Zimbabwe technology",
  "tech in Zimbabwe",
  // Vlogs & Lifestyle
  "Harare Vlogs",
  "Zimbabwe vlogs daily",
  "life in Zimbabwe",
  "Zimbabwe travel vlog",
  "Zimbabwe food cooking",
  "Bulawayo vlogs",
  "Zimbabwe lifestyle",
  // Education
  "Zimbabwe education channel",
  "learn Shona language",
  "Zimbabwe tutorials",
  // Sports
  "Zimbabwe cricket",
  "Zimbabwe football soccer",
  "Zimbabwe sports",
  // Business & Finance
  "Zimbabwe business",
  "Zimbabwe economy finance",
  "Zimbabwe investment",
  // Culture & Heritage
  "Zimbabwe culture heritage",
  "Shona culture traditions",
  "Ndebele culture",
  "Zimbabwe history documentary",
  // Diaspora
  "Zimbabwean in UK",
  "Zimbabwean in South Africa",
  "Zimbabwean in USA",
  "Zimbabwean in Australia",
  "Zim diaspora life",
  // Beauty & Fashion
  "Zimbabwe beauty fashion",
  "Zim makeup tutorial",
  // Motivation & Religion
  "Zimbabwe motivational speaker",
  "Zimbabwe pastor sermon",
  "Zim church worship",
  // Cultural & Vernacular (Diaspora reach)
  "Learn Shona",
  "Learn Zim Ndebele",
  "Zim Diaspora stories",
  "Kumusha lifestyle",
  "Zim-dancehall riddim 2026",
];

// Diaspora-specific queries that run WITHOUT regionCode so they capture
// Zimbabwean creators based anywhere in the world. Results are validated
// with hasZimbabweanMarkers() before being added to the discovery pool.
const DIASPORA_QUERIES = [
  "Zimbabwean in UK",
  "Zimbabwean in South Africa",
  "Zimbabwean in USA",
  "Zimbabwean in Australia",
  "Zim diaspora life",
  "Zim Diaspora stories",
  "Zim Diaspora Building",
  "Learn Shona",
  "Learn Zim Ndebele",
  "Kumusha lifestyle",
  "Relocating to Zimbabwe",
];

const DISCOVERY_LIMIT = 5000;
const PAGES_PER_QUERY = 3; // 3 pages x 50 results = 150 per query max
const CHANNEL_BATCH_SIZE = 50; // YouTube channels.list max per request
const DYNAMO_BATCH_SIZE = 25; // DynamoDB BatchWriteItem max
const VIDEO_CONCURRENCY = 5; // Parallel video highlight fetches
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "263tube-dev";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CACHE_PATH = resolve(__dirname, ".discovery-cache.json");

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION }),
  {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: { wrapNumbers: false },
  }
);

// ============================================================================
// Quota Tracker
// ============================================================================

let quotaUsed = 0;

function trackQuota(units, label) {
  quotaUsed += units;
  if (quotaUsed % 500 < units) {
    console.log(`  [Quota] ${quotaUsed}/${QUOTA_LIMIT} units used (${label})`);
  }
}

function hasQuota(units) {
  return quotaUsed + units <= QUOTA_LIMIT;
}

// ============================================================================
// Discovery Cache — persists channel IDs across runs
// ============================================================================

function loadDiscoveryCache() {
  try {
    if (existsSync(CACHE_PATH)) {
      const data = JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
      return {
        channelIds: new Set(data.channelIds || []),
        completedQueries: new Set(data.completedQueries || []),
        lastRun: data.lastRun || null,
      };
    }
  } catch (err) {
    console.warn("Could not load discovery cache:", err.message);
  }
  return { channelIds: new Set(), completedQueries: new Set(), lastRun: null };
}

function saveDiscoveryCache(channelIds, completedQueries) {
  const data = {
    channelIds: Array.from(channelIds),
    completedQueries: Array.from(completedQueries),
    lastRun: new Date().toISOString(),
    count: channelIds.size,
  };
  writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
  console.log(`  Cache saved: ${channelIds.size} IDs -> ${CACHE_PATH}`);
}

// ============================================================================
// Cultural Markers — identify Zimbabwean creators regardless of country code
// ============================================================================

const CULTURAL_MARKERS = [
  "zim",
  "zimbabwe",
  "harare",
  "bulawayo",
  "shona",
  "ndebele",
  "kumusha",
  "mushamukadzi",
  "diaspora",
];

/**
 * Returns true if the channel's title or description contains any Zimbabwean
 * cultural marker. Used to tag diaspora creators who may not have country=ZW.
 */
function hasZimbabweanMarkers(description, title) {
  const text = `${title} ${description}`.toLowerCase();
  return CULTURAL_MARKERS.some((marker) => text.includes(marker));
}

// ============================================================================
// Niche Inference
// ============================================================================

function inferNiche(description, title) {
  const text = `${title} ${description}`.toLowerCase();

  if (
    text.includes("homestead") ||
    text.includes("building") ||
    text.includes("construction") ||
    text.includes("rural home")
  )
    return "homesteading";
  if (
    text.includes("farm") ||
    text.includes("agriculture") ||
    text.includes("pfumvudza")
  )
    return "farming";
  if (
    text.includes("music") ||
    text.includes("dancehall") ||
    text.includes("riddim") ||
    text.includes("sungura") ||
    text.includes("amapiano") ||
    text.includes("afrobeat")
  )
    return "music";
  if (
    text.includes("comedy") ||
    text.includes("skit") ||
    text.includes("funny") ||
    text.includes("prank")
  )
    return "comedy";
  if (
    text.includes("news") ||
    text.includes("politics") ||
    text.includes("263chat") ||
    text.includes("current affairs")
  )
    return "news";
  if (
    text.includes("tech") ||
    text.includes("review") ||
    text.includes("gadget") ||
    text.includes("software")
  )
    return "technology";
  if (
    text.includes("beauty") ||
    text.includes("fashion") ||
    text.includes("makeup")
  )
    return "beauty";
  if (
    text.includes("sport") ||
    text.includes("cricket") ||
    text.includes("football") ||
    text.includes("soccer")
  )
    return "sports";
  if (
    text.includes("cook") ||
    text.includes("food") ||
    text.includes("recipe") ||
    text.includes("sadza")
  )
    return "food";
  if (
    text.includes("travel") ||
    text.includes("tourism") ||
    text.includes("safari")
  )
    return "travel";
  if (
    text.includes("pastor") ||
    text.includes("church") ||
    text.includes("sermon") ||
    text.includes("worship") ||
    text.includes("gospel")
  )
    return "religion";
  if (
    text.includes("education") ||
    text.includes("tutorial") ||
    text.includes("learn") ||
    text.includes("school")
  )
    return "education";
  if (
    text.includes("business") ||
    text.includes("invest") ||
    text.includes("economy") ||
    text.includes("finance")
  )
    return "business";
  if (
    text.includes("vlog") ||
    text.includes("daily life") ||
    text.includes("lifestyle") ||
    text.includes("diaspora")
  )
    return "lifestyle";
  if (
    text.includes("shona") ||
    text.includes("ndebele") ||
    text.includes("kumusha") ||
    text.includes("mushamukadzi") ||
    text.includes("totem") ||
    text.includes("chimurenga") ||
    text.includes("mbira")
  )
    return "culture";
  return "entertainment";
}

// ============================================================================
// Phase 1: Discovery — search.list with pagination + cache resumption
// ============================================================================

async function discoverAllChannelIds() {
  const cache = loadDiscoveryCache();
  const uniqueIds = cache.channelIds;
  const completedQueries = cache.completedQueries;

  if (uniqueIds.size > 0) {
    console.log(
      `  Resuming from cache: ${uniqueIds.size} IDs, ${completedQueries.size}/${SEARCH_QUERIES.length + DIASPORA_QUERIES.length} queries completed`
    );
  }

  let searchCalls = 0;

  // ── Pass 1: Region-locked queries (regionCode=ZW) ──
  console.log("  Pass 1: Region-locked search (regionCode=ZW)...");
  searchCalls = await _runSearchPass(
    SEARCH_QUERIES,
    uniqueIds,
    completedQueries,
    searchCalls,
    { regionCode: "ZW" }
  );

  // ── Pass 2: Global diaspora queries (NO regionCode) ──
  // Results are validated with hasZimbabweanMarkers() so only channels
  // with Zim cultural signals in their title/description are kept.
  console.log("  Pass 2: Global diaspora search (no region filter)...");
  searchCalls = await _runSearchPass(
    DIASPORA_QUERIES,
    uniqueIds,
    completedQueries,
    searchCalls,
    { regionCode: null, validateMarkers: true }
  );

  saveDiscoveryCache(uniqueIds, completedQueries);

  const ids = Array.from(uniqueIds).slice(0, DISCOVERY_LIMIT);
  console.log(
    `\nDiscovery complete: ${ids.length} unique channel IDs (${searchCalls} search calls, ${quotaUsed} quota units)\n`
  );
  return ids;
}

/**
 * Run a paginated search.list pass for the given queries.
 * Options:
 *   regionCode  — "ZW" for local, null to omit (global)
 *   validateMarkers — when true, only add channels whose snippet matches
 *                     hasZimbabweanMarkers() (used for global searches)
 */
async function _runSearchPass(
  queries,
  uniqueIds,
  completedQueries,
  searchCalls,
  { regionCode = "ZW", validateMarkers = false } = {}
) {
  for (const query of queries) {
    if (uniqueIds.size >= DISCOVERY_LIMIT) break;
    if (completedQueries.has(query)) continue;
    if (!hasQuota(100)) {
      console.log(
        `  Quota limit reached (${quotaUsed}/${QUOTA_LIMIT}). Saving progress...`
      );
      break;
    }

    let pageToken = null;
    let queryDone = true;

    for (
      let page = 0;
      page < PAGES_PER_QUERY && uniqueIds.size < DISCOVERY_LIMIT;
      page++
    ) {
      if (!hasQuota(100)) {
        queryDone = false;
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
      trackQuota(100, `search: "${query}" p${page}${regionCode ? "" : " (global)"}`);
      searchCalls++;

      if (!res.ok) {
        console.warn(
          `  Search failed for "${query}" page ${page}: ${res.status}`
        );
        if (res.status === 403) {
          console.error(
            "  YouTube API quota exceeded. Re-run tomorrow to continue."
          );
          saveDiscoveryCache(uniqueIds, completedQueries);
          return searchCalls;
        }
        break;
      }

      const data = await res.json();
      const items = data.items || [];

      for (const item of items) {
        const id = item.snippet?.channelId || item.id?.channelId;
        if (!id) continue;

        // For global (diaspora) searches, only accept channels whose
        // snippet text contains Zimbabwean cultural markers.
        if (validateMarkers) {
          const desc = item.snippet?.description || "";
          const title = item.snippet?.title || "";
          if (!hasZimbabweanMarkers(desc, title)) continue;
        }

        uniqueIds.add(id);
      }

      pageToken = data.nextPageToken || null;
      if (!pageToken) break;

      await sleep(150);
    }

    if (queryDone) completedQueries.add(query);

    console.log(
      `  "${query}" -> ${uniqueIds.size} unique IDs (${searchCalls} API calls)`
    );

    // Save cache every 5 queries in case of interruption
    if (searchCalls % 5 === 0) {
      saveDiscoveryCache(uniqueIds, completedQueries);
    }
  }

  return searchCalls;
}

// ============================================================================
// Phase 2: Batch Fetch — channels.list with up to 50 IDs per call
// ============================================================================

/**
 * Fetch channel data for up to 50 IDs in a single API call.
 * Compares per-item ETags with existingETags to skip unchanged channels.
 * Returns { creators, featuredChannelIds } where featuredChannelIds are
 * related channels extracted from brandingSettings for the crawl pass.
 */
async function processChannelBatch(channelIds, existingETags = {}) {
  if (channelIds.length === 0) return { creators: [], featuredChannelIds: [] };

  const url = `https://www.googleapis.com/youtube/v3/channels?id=${channelIds.join(",")}&part=snippet,statistics,brandingSettings,contentDetails&key=${YOUTUBE_API_KEY}`;

  const res = await fetch(url);
  trackQuota(1, "channels.list batch");

  if (!res.ok) {
    console.warn(`  Batch channel fetch failed: ${res.status}`);
    return { creators: [], featuredChannelIds: [] };
  }

  const data = await res.json();
  const items = data.items || [];
  const creators = [];
  const featuredChannelIds = [];

  for (const channel of items) {
    const channelId = channel.id;
    const itemEtag = channel.etag;

    // Collect featured/related channels for the crawl pass
    const featured =
      channel.brandingSettings?.channel?.featuredChannelsUrls || [];
    featuredChannelIds.push(...featured);

    // ETag comparison: skip unchanged channels on re-run
    if (existingETags[channelId] && existingETags[channelId] === itemEtag) {
      continue;
    }

    const creator = buildCreatorItem(channel);
    if (creator) {
      creator.youtubeEtag = itemEtag;
      // Temp fields for video highlight enrichment (cleaned up before DB write)
      creator._uploadsPlaylistId =
        channel.contentDetails?.relatedPlaylists?.uploads;
      creators.push(creator);
    }
  }

  return { creators, featuredChannelIds };
}

/**
 * Related Channel Crawl — discover new channels by checking the
 * featuredChannelsUrls from already-fetched channels. Fetches each
 * candidate in batches and validates with hasZimbabweanMarkers().
 * Only adds channels not already in the known set.
 */
async function discoverRelatedChannels(
  featuredIds,
  knownChannelIds,
  existingETags = {}
) {
  // Deduplicate and exclude already-known channels
  const candidateIds = [...new Set(featuredIds)].filter(
    (id) => !knownChannelIds.has(id)
  );

  if (candidateIds.length === 0) return { newCreators: [], newIds: [] };

  console.log(
    `  Related channel crawl: ${candidateIds.length} candidates from featured channels...`
  );

  const newCreators = [];
  const newIds = [];

  for (let i = 0; i < candidateIds.length; i += CHANNEL_BATCH_SIZE) {
    if (!hasQuota(1)) {
      console.log("  Quota limit reached during related channel crawl.");
      break;
    }

    const batch = candidateIds.slice(i, i + CHANNEL_BATCH_SIZE);
    const url = `https://www.googleapis.com/youtube/v3/channels?id=${batch.join(",")}&part=snippet,statistics,brandingSettings,contentDetails&key=${YOUTUBE_API_KEY}`;

    const res = await fetch(url);
    trackQuota(1, "channels.list (related crawl)");

    if (!res.ok) continue;

    const data = await res.json();
    for (const channel of data.items || []) {
      const desc = channel.snippet?.description || "";
      const title = channel.snippet?.title || "";

      // Only accept channels that have Zimbabwean cultural markers
      if (!hasZimbabweanMarkers(desc, title)) continue;

      const channelId = channel.id;
      const itemEtag = channel.etag;
      newIds.push(channelId);

      if (existingETags[channelId] && existingETags[channelId] === itemEtag) {
        continue;
      }

      const creator = buildCreatorItem(channel);
      if (creator) {
        creator.youtubeEtag = itemEtag;
        creator._uploadsPlaylistId =
          channel.contentDetails?.relatedPlaylists?.uploads;
        newCreators.push(creator);
      }
    }

    await sleep(100);
  }

  console.log(
    `  Related crawl: ${newIds.length} new Zim channels found, ${newCreators.length} new/updated creators`
  );
  return { newCreators, newIds };
}

/**
 * Build a DynamoDB creator item from a YouTube channel API response object.
 * Populates both GSI1 (status+reach) and GSI2 (category+reach) for queries.
 */
function buildCreatorItem(channel) {
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
    // GSI1: query all active creators sorted by reach
    gsi1pk: "STATUS#ACTIVE",
    gsi1sk: reachSortKey,
    // GSI2: query by niche/category sorted by reach
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
      youtube: [
        {
          label: name,
          url: youtubeUrl,
          handle: youtubeHandle,
        },
      ],
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
  };
}

// ============================================================================
// Video Highlights — parallel enrichment (opt-in via --with-highlights)
// ============================================================================

async function enrichWithVideoHighlights(creators) {
  let enriched = 0;
  for (let i = 0; i < creators.length; i += VIDEO_CONCURRENCY) {
    if (!hasQuota(VIDEO_CONCURRENCY * 2)) {
      console.log(
        `  Quota limit reached at ${enriched}/${creators.length} highlights. Stopping enrichment.`
      );
      break;
    }

    const batch = creators.slice(i, i + VIDEO_CONCURRENCY);
    await Promise.all(
      batch.map(async (creator) => {
        if (!creator._uploadsPlaylistId) return;
        if (!hasQuota(2)) return;
        const highlights = await fetchVideoHighlights(
          creator._uploadsPlaylistId
        );
        if (highlights.length > 0) {
          creator.videoHighlights = highlights;
          enriched++;
        }
      })
    );

    // Progress every 50 creators
    if ((i + VIDEO_CONCURRENCY) % 50 < VIDEO_CONCURRENCY) {
      console.log(`  Highlights: ${enriched} enriched, ${quotaUsed} quota used`);
    }
  }

  // Clean up temp fields before DynamoDB write
  for (const creator of creators) {
    delete creator._uploadsPlaylistId;
  }

  return enriched;
}

async function fetchVideoHighlights(uploadsPlaylistId) {
  try {
    const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`;
    const plRes = await fetch(plUrl);
    trackQuota(1, "playlistItems");
    if (!plRes.ok) return [];
    const plData = await plRes.json();
    const videoIds = (plData.items || []).map((i) => i.contentDetails.videoId);
    if (videoIds.length === 0) return [];

    const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(",")}&key=${YOUTUBE_API_KEY}`;
    const vRes = await fetch(vUrl);
    trackQuota(1, "videos.list");
    if (!vRes.ok) return [];
    const vData = await vRes.json();
    const videos = (vData.items || []).map((v) => ({
      videoId: v.id,
      title: v.snippet.title || "",
      thumbnail:
        v.snippet.thumbnails?.medium?.url ||
        v.snippet.thumbnails?.default?.url ||
        null,
      views: parseInt(v.statistics.viewCount) || 0,
      likes: parseInt(v.statistics.likeCount) || 0,
      publishedAt: v.snippet.publishedAt,
    }));

    const highlights = [];
    const addUnique = (v) => {
      if (v && !highlights.some((h) => h.videoId === v.videoId))
        highlights.push(v);
    };

    addUnique([...videos].sort((a, b) => b.views - a.views)[0]);
    addUnique([...videos].sort((a, b) => b.likes - a.likes)[0]);
    addUnique(
      [...videos].sort(
        (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
      )[0]
    );
    addUnique(
      [...videos].sort(
        (a, b) => new Date(a.publishedAt) - new Date(b.publishedAt)
      )[0]
    );

    return highlights;
  } catch {
    return [];
  }
}

// ============================================================================
// Phase 3: Batch Write to DynamoDB (25 items per BatchWriteCommand)
// ============================================================================

async function seedCreatorsToDynamo(creators) {
  let written = 0;

  for (let i = 0; i < creators.length; i += DYNAMO_BATCH_SIZE) {
    const batch = creators.slice(i, i + DYNAMO_BATCH_SIZE);
    const putRequests = batch.map((item) => ({
      PutRequest: { Item: item },
    }));

    try {
      let unprocessed = { [TABLE_NAME]: putRequests };
      let retries = 0;

      // Retry unprocessed items with exponential backoff
      while (unprocessed[TABLE_NAME]?.length > 0 && retries < 3) {
        const result = await docClient.send(
          new BatchWriteCommand({ RequestItems: unprocessed })
        );
        const remaining = result.UnprocessedItems?.[TABLE_NAME]?.length || 0;
        written += (unprocessed[TABLE_NAME]?.length || 0) - remaining;
        unprocessed = result.UnprocessedItems || {};

        if (unprocessed[TABLE_NAME]?.length > 0) {
          retries++;
          await sleep(1000 * retries);
        }
      }

      if (unprocessed[TABLE_NAME]?.length > 0) {
        console.warn(
          `  ${unprocessed[TABLE_NAME].length} items failed after retries at offset ${i}`
        );
      }
    } catch (err) {
      console.error(`  Batch write failed at offset ${i}: ${err.message}`);
    }

    // Progress every 250 items
    if ((i + DYNAMO_BATCH_SIZE) % 250 < DYNAMO_BATCH_SIZE) {
      console.log(`  DynamoDB: ${written}/${creators.length} written...`);
    }
  }

  return written;
}

// ============================================================================
// ETag Helpers — Load existing ETags from DynamoDB for delta detection
// ============================================================================

/**
 * Query all active + featured creators and build a channelId -> etag map.
 * Paginated to handle 5000+ items. On re-run, channels whose ETag hasn't
 * changed are skipped, saving YouTube video-highlight calls and DynamoDB writes.
 */
async function loadExistingETags() {
  const etagMap = {};

  const statusPartitions = ["STATUS#ACTIVE", "STATUS#FEATURED"];

  try {
    for (const partition of statusPartitions) {
      let lastKey = undefined;

      do {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "gsi1pk = :pk",
            ExpressionAttributeValues: { ":pk": partition },
            ProjectionExpression: "youtubeEtag, verifiedLinks",
            ExclusiveStartKey: lastKey,
          })
        );

        for (const item of result.Items || []) {
          if (!item.youtubeEtag) continue;
          const ytLink = (item.verifiedLinks || []).find(
            (l) => l.platform === "youtube"
          );
          if (ytLink?.channelId) {
            etagMap[ytLink.channelId] = item.youtubeEtag;
          }
        }

        lastKey = result.LastEvaluatedKey;
      } while (lastKey);
    }
  } catch (err) {
    console.warn(
      "Could not load existing ETags (table may be empty):",
      err.message
    );
  }

  console.log(`Loaded ${Object.keys(etagMap).length} existing ETags\n`);
  return etagMap;
}

// ============================================================================
// Utility
// ============================================================================

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================================
// Main Orchestrator
// ============================================================================

async function main() {
  if (!YOUTUBE_API_KEY) {
    console.error("YOUTUBE_API_KEY is not set. Exiting.");
    process.exit(1);
  }

  console.log("=== 263Tube Seed Script (v3 — 5000 scale) ===");
  console.log(
    `Mode: ${FLAG_DISCOVER_ONLY ? "discover-only" : FLAG_SEED_ONLY ? "seed-only" : "full"} | Highlights: ${FLAG_WITH_HIGHLIGHTS ? "ON" : "OFF"} | Quota limit: ${QUOTA_LIMIT}\n`
  );

  // Estimate quota cost
  const totalQueries = SEARCH_QUERIES.length + DIASPORA_QUERIES.length;
  const estDiscovery = totalQueries * PAGES_PER_QUERY * 100;
  const estChannelFetch = Math.ceil(DISCOVERY_LIMIT / CHANNEL_BATCH_SIZE);
  const estHighlights = FLAG_WITH_HIGHLIGHTS ? DISCOVERY_LIMIT * 2 : 0;
  console.log("Estimated max quota cost:");
  console.log(`  Discovery:  ~${estDiscovery} units (${totalQueries} queries x ${PAGES_PER_QUERY} pages x 100)`);
  console.log(`  Channels:   ~${estChannelFetch} units (${Math.ceil(DISCOVERY_LIMIT / CHANNEL_BATCH_SIZE)} batches x 1)`);
  if (FLAG_WITH_HIGHLIGHTS) {
    console.log(`  Highlights: ~${estHighlights} units (${DISCOVERY_LIMIT} channels x 2)`);
  }
  console.log(`  Total max:  ~${estDiscovery + estChannelFetch + estHighlights} units\n`);

  // ── Phase 1: Discovery ──
  let channelIds;

  if (FLAG_SEED_ONLY) {
    const cache = loadDiscoveryCache();
    channelIds = Array.from(cache.channelIds).slice(0, DISCOVERY_LIMIT);
    console.log(
      `Loaded ${channelIds.length} channel IDs from cache (last run: ${cache.lastRun || "never"})\n`
    );
  } else {
    console.log("Phase 1: Discovering channel IDs via search.list...");
    channelIds = await discoverAllChannelIds();
  }

  if (channelIds.length === 0) {
    console.log("No channels discovered. Exiting.");
    return;
  }

  if (FLAG_DISCOVER_ONLY) {
    console.log(
      `\nDiscovery-only mode complete. ${channelIds.length} IDs cached.`
    );
    console.log(`Quota used: ${quotaUsed} units`);
    console.log("Run without --discover-only to seed to DynamoDB.");
    return;
  }

  // ── Load existing ETags for delta detection ──
  console.log("Loading existing ETags from DynamoDB...");
  const existingETags = await loadExistingETags();

  // ── Phase 2: Batch fetch channel data ──
  console.log(
    `Phase 2: Fetching channel data in batches of ${CHANNEL_BATCH_SIZE}...`
  );
  const allCreators = [];
  const allFeaturedIds = [];
  const knownChannelIds = new Set(channelIds);
  const totalBatches = Math.ceil(channelIds.length / CHANNEL_BATCH_SIZE);
  let etagSkipped = 0;

  for (let i = 0; i < channelIds.length; i += CHANNEL_BATCH_SIZE) {
    if (!hasQuota(1)) {
      console.log(
        `  Quota limit reached at batch ${Math.floor(i / CHANNEL_BATCH_SIZE) + 1}. Stopping fetch.`
      );
      break;
    }

    const batch = channelIds.slice(i, i + CHANNEL_BATCH_SIZE);
    const batchNum = Math.floor(i / CHANNEL_BATCH_SIZE) + 1;

    const { creators, featuredChannelIds } = await processChannelBatch(
      batch,
      existingETags
    );
    etagSkipped += batch.length - creators.length;
    allCreators.push(...creators);
    allFeaturedIds.push(...featuredChannelIds);

    // Progress every 10 batches (500 channels)
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(
        `  Batch ${batchNum}/${totalBatches}: ${allCreators.length} new/updated, ${etagSkipped} skipped`
      );
    }

    await sleep(100);
  }

  console.log(
    `\nBatch fetch complete: ${allCreators.length} new/updated, ${etagSkipped} unchanged (ETag match)\n`
  );

  // ── Phase 2b: Related Channel Crawl ──
  if (allFeaturedIds.length > 0 && hasQuota(1)) {
    console.log("Phase 2b: Related channel crawl (featured channels)...");
    const { newCreators, newIds } = await discoverRelatedChannels(
      allFeaturedIds,
      knownChannelIds,
      existingETags
    );
    allCreators.push(...newCreators);
    for (const id of newIds) knownChannelIds.add(id);
    console.log(
      `  Total after crawl: ${allCreators.length} creators, ${knownChannelIds.size} known IDs\n`
    );
  }

  if (allCreators.length === 0) {
    console.log("All channels unchanged. Nothing to seed.");
    console.log(`Quota used: ${quotaUsed} units`);
    return;
  }

  // ── Enrich with video highlights (opt-in) ──
  if (FLAG_WITH_HIGHLIGHTS) {
    console.log(
      `Fetching video highlights for ${allCreators.length} creators (${VIDEO_CONCURRENCY} parallel)...`
    );
    const enriched = await enrichWithVideoHighlights(allCreators);
    console.log(`Video highlights complete: ${enriched} enriched\n`);
  } else {
    // Still need to clean up temp fields
    for (const creator of allCreators) {
      delete creator._uploadsPlaylistId;
    }
    console.log(
      "Skipping video highlights (use --with-highlights to enable)\n"
    );
  }

  // ── Phase 3: Batch write to DynamoDB ──
  console.log(
    `Phase 3: Writing ${allCreators.length} creators to DynamoDB in batches of ${DYNAMO_BATCH_SIZE}...`
  );
  const written = await seedCreatorsToDynamo(allCreators);

  // ── Summary ──
  const nicheBreakdown = {};
  for (const c of allCreators) {
    nicheBreakdown[c.niche] = (nicheBreakdown[c.niche] || 0) + 1;
  }

  console.log("\n=== Seed Complete ===");
  console.log(`Discovered:        ${channelIds.length} channel IDs`);
  console.log(`New/Updated:       ${allCreators.length}`);
  console.log(`Skipped (ETag):    ${etagSkipped}`);
  console.log(`Written to Dynamo: ${written}`);
  console.log(`Quota used:        ${quotaUsed}/${QUOTA_LIMIT} units`);
  console.log("Niche breakdown:", nicheBreakdown);

  if (channelIds.length < DISCOVERY_LIMIT) {
    console.log(
      `\nTip: ${channelIds.length}/${DISCOVERY_LIMIT} IDs discovered. Run again tomorrow to discover more (cache is cumulative).`
    );
  }
}

main().catch(console.error);
