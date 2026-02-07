/**
 * 263Tube - Engagement Score Formula
 *
 * Calculates a 0–10 engagement score for creators based on available metrics.
 *
 * Components (weighted):
 * 1. Views-to-Reach Ratio (0–4 pts) — how effectively they convert followers to viewers
 * 2. Content Volume (0–3 pts) — how much content they've produced
 * 3. Audience Scale (0–2 pts) — size-tier bonus
 * 4. Platform Diversity (0–1 pt) — presence across multiple platforms
 *
 * The score is intentionally generous for smaller creators so everyone
 * lands somewhere meaningful on the scale rather than clustering at 0.
 */

import type { CreatorMetrics, CreatorPlatforms } from "@/lib/creators";

export interface EngagementResult {
  /** Numeric score from 0 to 10 (one decimal) */
  score: number;
  /** Human-readable label */
  label: string;
  /** Tailwind-friendly color class for the label */
  color: string;
}

/**
 * Count the number of active platforms (platforms with at least one link).
 */
function countActivePlatforms(platforms: CreatorPlatforms | undefined): number {
  if (!platforms) return 0;
  let count = 0;
  if (platforms.youtube?.length) count++;
  if (platforms.instagram?.length) count++;
  if (platforms.twitter?.length) count++;
  if (platforms.facebook?.length) count++;
  if (platforms.tiktok?.length) count++;
  if (platforms.linkedin?.length) count++;
  if (platforms.website?.length) count++;
  return count;
}

/**
 * Map a numeric score to a human-readable label and color.
 */
function scoreToLabel(score: number): { label: string; color: string } {
  if (score >= 9) return { label: "Exceptional", color: "text-emerald-400" };
  if (score >= 7) return { label: "Very High", color: "text-green-400" };
  if (score >= 5) return { label: "High", color: "text-[#FFD200]" };
  if (score >= 3) return { label: "Moderate", color: "text-orange-400" };
  if (score >= 1) return { label: "Growing", color: "text-slate-400" };
  return { label: "New", color: "text-slate-500" };
}

/**
 * Calculate the engagement score for a creator.
 */
export function calculateEngagementScore(
  metrics: CreatorMetrics,
  platforms?: CreatorPlatforms,
): EngagementResult {
  let total = 0;

  const totalReach = metrics.totalReach || 0;
  const monthlyViews = metrics.rollingMonthlyViews ?? metrics.monthlyViews ?? 0;
  const totalContent =
    (metrics.videoCount || 0) + (metrics.postCount || 0) ||
    metrics.totalVideos ||
    0;

  // ---------------------------------------------------------------
  // 1. Views-to-Reach Ratio (0–4 points)
  //    Measures how effectively the creator converts followers to viewers.
  // ---------------------------------------------------------------
  if (totalReach > 0 && monthlyViews > 0) {
    const viewRatio = monthlyViews / totalReach;
    if (viewRatio >= 2.0) total += 4;
    else if (viewRatio >= 1.0) total += 3;
    else if (viewRatio >= 0.5) total += 2;
    else if (viewRatio >= 0.1) total += 1;
    else total += 0.5; // At least some views
  }

  // ---------------------------------------------------------------
  // 2. Content Volume (0–3 points)
  //    More content = more active and committed creator.
  // ---------------------------------------------------------------
  if (totalContent >= 500) total += 3;
  else if (totalContent >= 200) total += 2.5;
  else if (totalContent >= 100) total += 2;
  else if (totalContent >= 50) total += 1.5;
  else if (totalContent >= 20) total += 1;
  else if (totalContent >= 5) total += 0.5;

  // ---------------------------------------------------------------
  // 3. Audience Scale (0–2 points)
  //    Larger audiences receive a modest boost.
  // ---------------------------------------------------------------
  if (totalReach >= 1_000_000) total += 2;
  else if (totalReach >= 500_000) total += 1.75;
  else if (totalReach >= 100_000) total += 1.5;
  else if (totalReach >= 50_000) total += 1.25;
  else if (totalReach >= 10_000) total += 1;
  else if (totalReach >= 1_000) total += 0.5;

  // ---------------------------------------------------------------
  // 4. Platform Diversity (0–1 point)
  //    Presence across multiple platforms signals broader engagement.
  // ---------------------------------------------------------------
  const platformCount = countActivePlatforms(platforms);
  if (platformCount >= 4) total += 1;
  else if (platformCount >= 3) total += 0.75;
  else if (platformCount >= 2) total += 0.5;

  // Clamp to 0–10 and round to one decimal
  const score = Math.min(10, Math.max(0, Math.round(total * 10) / 10));
  const { label, color } = scoreToLabel(score);

  return { score, label, color };
}
