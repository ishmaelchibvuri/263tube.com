/**
 * 263Tube - Seed YouTube Creators from YouTube API
 *
 * Fetches channel data from YouTube Data API v3, downloads profile images
 * locally, and writes creator records to DynamoDB.
 *
 * Usage:
 *   1. npm install (to get dependencies)
 *   2. node scripts/seed-youtube-creators.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// ============================================================================
// Load .env.local manually (no dotenv dependency needed)
// ============================================================================
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // File doesn't exist, skip
  }
}

loadEnv(resolve(__dirname, "../.env.local"));
loadEnv(resolve(__dirname, "../.env"));

// ============================================================================
// Configuration
// ============================================================================
const AWS_REGION = process.env.AWS_REGION || "af-south-1";
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "263tube-dev";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const IMAGES_DIR = resolve(PROJECT_ROOT, "public/images/creators");

if (!YOUTUBE_API_KEY) {
  console.error("YOUTUBE_API_KEY is not set in .env.local");
  process.exit(1);
}

// Ensure images directory exists
mkdirSync(IMAGES_DIR, { recursive: true });

console.log("\n========================================");
console.log("263Tube - YouTube Creator Seeder");
console.log("========================================");
console.log(`Region: ${AWS_REGION}`);
console.log(`Table: ${TABLE_NAME}`);
console.log(`Images: ${IMAGES_DIR}`);
console.log("========================================\n");

// DynamoDB client
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
  },
});

// ============================================================================
// YouTube channels to seed
// ============================================================================
const CHANNELS = [
  { handle: "263tube" },
  { handle: "travelbynature" },
  { handle: "tasteofhomeinsa" },
];

// ============================================================================
// Image download helper
// ============================================================================

async function downloadImage(url, slug, type) {
  if (!url) return null;

  const ext = "jpg";
  const filename = `${slug}-${type}.${ext}`;
  const filePath = resolve(IMAGES_DIR, filename);
  const publicPath = `/images/creators/${filename}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`    Warning: Failed to download ${type} for ${slug} (HTTP ${res.status})`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(filePath, buffer);
    console.log(`    Downloaded ${type}: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return publicPath;
  } catch (err) {
    console.warn(`    Warning: Could not download ${type} for ${slug}: ${err.message}`);
    return null;
  }
}

// ============================================================================
// YouTube API helpers
// ============================================================================

async function fetchYouTubeChannel(handle) {
  const url = `https://www.googleapis.com/youtube/v3/channels?forHandle=${handle}&part=snippet,statistics,brandingSettings&key=${YOUTUBE_API_KEY}`;

  console.log(`Fetching YouTube data for @${handle}...`);
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error for @${handle}: ${res.status} - ${body}`);
  }

  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    throw new Error(`No YouTube channel found for handle: @${handle}`);
  }

  return data.items[0];
}

function inferNiche(description, title) {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("travel") || text.includes("tourism") || text.includes("adventure")) return "travel";
  if (text.includes("cook") || text.includes("recipe") || text.includes("food") || text.includes("kitchen") || text.includes("taste")) return "cooking";
  if (text.includes("news") || text.includes("current affairs")) return "news";
  if (text.includes("comedy") || text.includes("funny") || text.includes("humor")) return "comedy";
  if (text.includes("music") || text.includes("song")) return "music";
  if (text.includes("tech") || text.includes("gadget") || text.includes("review")) return "technology";
  if (text.includes("farm") || text.includes("agriculture")) return "farming";
  if (text.includes("fitness") || text.includes("workout") || text.includes("gym")) return "fitness";
  if (text.includes("entertainment") || text.includes("culture") || text.includes("zimbabwe")) return "entertainment";
  if (text.includes("education") || text.includes("learn") || text.includes("tutorial")) return "education";
  if (text.includes("lifestyle") || text.includes("vlog") || text.includes("daily")) return "lifestyle";
  return "entertainment"; // default
}

function generateTags(description, niche) {
  const tags = [niche];
  const text = description.toLowerCase();

  const tagMap = {
    zimbabwe: "zimbabwe",
    africa: "africa",
    diaspora: "diaspora",
    culture: "culture",
    travel: "travel",
    food: "food",
    cooking: "cooking",
    music: "music",
    entertainment: "entertainment",
    education: "education",
    lifestyle: "lifestyle",
    nature: "nature",
    adventure: "adventure",
    vlog: "vlog",
    south_africa: "south-africa",
  };

  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (text.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 5);
}

function makeSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================================
// Build creator object from YouTube data
// ============================================================================

async function buildCreator(channel) {
  const { snippet, statistics, brandingSettings } = channel;

  const name = snippet.title;
  const slug = makeSlug(name);
  const bio = snippet.description || `${name} - Zimbabwean content creator on YouTube.`;
  const handle = snippet.customUrl?.replace("@", "") || slug;
  const subscriberCount = parseInt(statistics.subscriberCount || "0", 10);
  const viewCount = parseInt(statistics.viewCount || "0", 10);
  const videoCount = parseInt(statistics.videoCount || "0", 10);
  const niche = inferNiche(bio, name);
  const tags = generateTags(bio, niche);
  const ytProfilePicUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "";
  const ytBannerUrl = brandingSettings?.image?.bannerExternalUrl || "";
  const country = snippet.country || "";
  const publishedAt = snippet.publishedAt || "";
  const joinedYear = publishedAt ? new Date(publishedAt).getFullYear().toString() : "";

  // Download images locally
  console.log(`  Downloading images for ${name}...`);
  const localProfilePic = await downloadImage(ytProfilePicUrl, slug, "profile");
  const localBanner = await downloadImage(ytBannerUrl, slug, "banner");

  // Estimate monthly views
  let monthlyViews = 0;
  if (publishedAt) {
    const monthsSinceCreation = Math.max(1, Math.floor((Date.now() - new Date(publishedAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
    monthlyViews = Math.round(viewCount / monthsSinceCreation);
  }

  const now = new Date().toISOString();

  return {
    slug,
    name,
    bio: bio.length > 500 ? bio.slice(0, 497) + "..." : bio,
    profilePicUrl: localProfilePic || "",
    primaryProfileImage: localProfilePic || null,
    bannerUrl: localBanner || "",
    coverImageUrl: localBanner || null,
    niche,
    tags,
    location: country ? `${country}` : "Zimbabwe",
    status: "ACTIVE",
    verified: false,
    claimedBy: null,
    platforms: {
      youtube: [
        {
          label: "Main Channel",
          url: `https://youtube.com/@${handle}`,
          handle,
        },
      ],
    },
    metrics: {
      totalReach: subscriberCount,
      monthlyViews,
      totalVideos: videoCount,
      subscribers: {
        youtube: subscriberCount,
      },
    },
    referralStats: {
      currentWeek: 0,
      allTime: 0,
    },
    verifiedLinks: [
      {
        platform: "youtube",
        displayName: name,
        image: localProfilePic || null,
        followers: subscriberCount,
        verifiedAt: now,
      },
    ],
    joinedDate: joinedYear,
  };
}

// ============================================================================
// Write to DynamoDB
// ============================================================================

async function seedCreator(creator) {
  const now = new Date().toISOString();
  const reachSortKey = `${String(creator.metrics.totalReach).padStart(12, "0")}#${creator.slug}`;
  const invertedRefCount = 999999999 - creator.referralStats.currentWeek;
  const referralSortKey = `${String(invertedRefCount).padStart(9, "0")}#${creator.slug}`;

  const item = {
    pk: `CREATOR#${creator.slug}`,
    sk: "METADATA",
    gsi1pk: `STATUS#${creator.status}`,
    gsi1sk: reachSortKey,
    gsi2pk: `CATEGORY#${creator.niche}`,
    gsi2sk: reachSortKey,
    gsi3pk: "REFERRAL#WEEKLY",
    gsi3sk: referralSortKey,
    entityType: "CREATOR",
    ...creator,
    createdAt: now,
    updatedAt: now,
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  });

  await docClient.send(command);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const results = [];

  for (const { handle } of CHANNELS) {
    try {
      const channel = await fetchYouTubeChannel(handle);
      const creator = await buildCreator(channel);
      results.push(creator);

      console.log(`\n  Channel: ${creator.name}`);
      console.log(`  Slug: ${creator.slug}`);
      console.log(`  Niche: ${creator.niche}`);
      console.log(`  Profile: ${creator.profilePicUrl}`);
      console.log(`  Banner: ${creator.bannerUrl}`);
      console.log(`  Subscribers: ${creator.metrics.subscribers.youtube.toLocaleString()}`);
      console.log(`  Videos: ${creator.metrics.totalVideos}`);
      console.log(`  Joined: ${creator.joinedDate}`);
      console.log(`  Claimed: No (claimedBy: null)\n`);
    } catch (err) {
      console.error(`\n  Failed to fetch @${handle}: ${err.message}`);
    }
  }

  if (results.length === 0) {
    console.error("\nNo channels fetched. Aborting.");
    process.exit(1);
  }

  console.log(`\nWriting ${results.length} creators to DynamoDB (${TABLE_NAME})...\n`);

  for (const creator of results) {
    try {
      await seedCreator(creator);
      console.log(`  Written: ${creator.name} (${creator.slug})`);
    } catch (err) {
      console.error(`  Failed to write ${creator.name}: ${err.message}`);
    }
  }

  console.log("\n========================================");
  console.log(`Seeding complete! ${results.length} creators added.`);
  console.log("All profiles are UNCLAIMED (claimedBy: null)");
  console.log("Images saved to: public/images/creators/");
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
