/**
 * 263Tube - Discovery & Seed Script
 * Purpose: Automatically discovers 500 Zim-related channels and seeds them to DynamoDB.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

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
// Enhanced Discovery Configuration
// ============================================================================
const SEARCH_QUERIES = [
  "Zimbabwe Homesteading",
  "Building in Zimbabwe",
  "Zimbabwe Agriculture",
  "Rural Home Zimbabwe",
  "Zim Diaspora Building",
  "ZimDancehall 2026",
  "Zim Comedy skits",
  "Zimbabwe News",
  "Harare Vlogs",
  "Zim Tech reviews",
];

const MAX_TOTAL_CREATORS = 500;
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "263tube-dev";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const IMAGES_DIR = resolve(PROJECT_ROOT, "public/images/creators");

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

// ============================================================================
// Discovery & Categorization Logic
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
    text.includes("riddim")
  )
    return "music";
  if (
    text.includes("comedy") ||
    text.includes("skit") ||
    text.includes("funny")
  )
    return "comedy";
  if (
    text.includes("news") ||
    text.includes("politics") ||
    text.includes("263chat")
  )
    return "news";
  if (
    text.includes("tech") ||
    text.includes("review") ||
    text.includes("gadget")
  )
    return "technology";
  return "entertainment"; // Default
}

async function discoverChannelIds(query) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query
  )}&type=channel&regionCode=ZW&maxResults=50&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items ? data.items.map((item) => item.snippet.channelId) : [];
}

// ============================================================================
// Build & Seed Logic
// ============================================================================

async function fetchVideoHighlights(uploadsPlaylistId) {
  try {
    const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`;
    const plRes = await fetch(plUrl);
    if (!plRes.ok) return [];
    const plData = await plRes.json();
    const videoIds = (plData.items || []).map((i) => i.contentDetails.videoId);
    if (videoIds.length === 0) return [];

    const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(",")}&key=${YOUTUBE_API_KEY}`;
    const vRes = await fetch(vUrl);
    if (!vRes.ok) return [];
    const vData = await vRes.json();
    const videos = (vData.items || []).map((v) => ({
      videoId: v.id,
      title: v.snippet.title || "",
      thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || null,
      views: parseInt(v.statistics.viewCount) || 0,
      likes: parseInt(v.statistics.likeCount) || 0,
      publishedAt: v.snippet.publishedAt,
    }));

    const highlights = [];
    const mostViewed = [...videos].sort((a, b) => b.views - a.views)[0];
    if (mostViewed) highlights.push(mostViewed);

    const mostLiked = [...videos].sort((a, b) => b.likes - a.likes)[0];
    if (mostLiked && mostLiked.videoId !== mostViewed?.videoId) highlights.push(mostLiked);

    const latest = [...videos].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0];
    if (latest && !highlights.some((v) => v.videoId === latest.videoId)) highlights.push(latest);

    const oldest = [...videos].sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt))[0];
    if (oldest && !highlights.some((v) => v.videoId === oldest.videoId)) highlights.push(oldest);

    return highlights;
  } catch {
    return [];
  }
}

async function processChannel(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=snippet,statistics,brandingSettings,contentDetails&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const { items } = await res.json();
  if (!items?.[0]) return null;

  const { snippet, statistics, brandingSettings, contentDetails } = items[0];
  const name = snippet.title;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
  const niche = inferNiche(snippet.description, name);

  // Image logic: use the high-res YouTube logo + banner
  const profileUrl = snippet.thumbnails?.high?.url;
  const bannerUrl = brandingSettings?.image?.bannerExternalUrl || null;

  // Fetch video highlights from uploads playlist
  const uploadsPlaylistId = contentDetails?.relatedPlaylists?.uploads;
  const videoHighlights = uploadsPlaylistId
    ? await fetchVideoHighlights(uploadsPlaylistId)
    : [];

  const now = new Date().toISOString();
  const totalReach = parseInt(statistics.subscriberCount || "0");
  const reachSortKey = `${String(totalReach).padStart(12, "0")}#${slug}`;

  return {
    pk: `CREATOR#${slug}`,
    sk: "METADATA",
    entityType: "CREATOR",
    // GSI keys required for app queries
    gsi1pk: "STATUS#ACTIVE",
    gsi1sk: reachSortKey,
    gsi2pk: `CATEGORY#${niche}`,
    gsi2sk: reachSortKey,
    name,
    slug,
    bio: snippet.description?.slice(0, 500) || "",
    profilePicUrl: profileUrl,
    primaryProfileImage: profileUrl,
    bannerUrl: bannerUrl,
    coverImageUrl: bannerUrl,
    niche,
    status: "ACTIVE",
    verified: false,
    platforms: {
      youtube: [
        {
          label: name,
          url: `https://www.youtube.com/channel/${channelId}`,
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
    videoHighlights: videoHighlights.length > 0 ? videoHighlights : undefined,
    verifiedLinks: [
      {
        platform: "youtube",
        displayName: name,
        followers: parseInt(statistics.subscriberCount || "0"),
        image: profileUrl,
        channelId: channelId,
        verifiedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const uniqueIds = new Set();

  for (const query of SEARCH_QUERIES) {
    if (uniqueIds.size >= MAX_TOTAL_CREATORS) break;
    const ids = await discoverChannelIds(query);
    ids.forEach((id) => uniqueIds.add(id));
  }

  console.log(`Discovered ${uniqueIds.size} channels. Starting seed...`);

  let count = 0;
  for (const id of Array.from(uniqueIds).slice(0, MAX_TOTAL_CREATORS)) {
    const creator = await processChannel(id);
    if (creator) {
      await docClient.send(
        new PutCommand({ TableName: TABLE_NAME, Item: creator })
      );
      count++;
      console.log(`[${count}] Seeded: ${creator.name} (#${creator.niche})`);
    }
    await new Promise((r) => setTimeout(r, 100)); // Rate limit protection
  }
}

main().catch(console.error);
