/**
 * 263Tube - YouTube Insights
 *
 * Pure utility that derives creative, display-ready YouTube stats
 * from stored creator metrics. No API calls — everything is computed
 * from data already in the database.
 */

import type { CreatorMetrics, CreatorPlatforms, VerifiedLink } from "@/lib/creators";

// ============================================================================
// Types
// ============================================================================

export interface YouTubeInsights {
  totalViews: string | null;
  totalViewsRaw: number;
  avgViewsPerVideo: string | null;
  uploadPace: string | null;
  viewsPerSub: string | null;
  viewsPerSubLabel: string | null;
  channelAge: string | null;
  channelAgeLabel: string | null;
  contentMilestone: string | null;
  contentMilestoneIcon: string;
  engagementRateDisplay: string | null;
  estWatchTimeHours: string | null;
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

// ============================================================================
// Main Derivation
// ============================================================================

export function deriveYouTubeInsights(
  metrics: CreatorMetrics,
  platforms?: CreatorPlatforms,
  verifiedLinks?: VerifiedLink[],
): YouTubeInsights | null {
  // Check for YouTube presence via platforms OR verifiedLinks
  const hasYouTubePlatform = platforms?.youtube && platforms.youtube.length > 0;
  const hasYouTubeVerified = verifiedLinks?.some(
    (l) => l.platform.toLowerCase() === "youtube"
  );
  const hasYouTube = hasYouTubePlatform || hasYouTubeVerified;
  const hasTotalVideos = typeof metrics.totalVideos === "number" && metrics.totalVideos > 0;

  if (!hasYouTube && !hasTotalVideos) {
    return null;
  }

  // Estimate totalViews: use stored value, or derive from monthlyViews * 12
  const totalViews = (metrics.totalViews && metrics.totalViews > 0)
    ? metrics.totalViews
    : (metrics.monthlyViews ? metrics.monthlyViews * 12 : 0);
  const totalVideos = metrics.totalVideos ?? 0;
  const subscribers = metrics.subscribers?.youtube ?? metrics.totalReach ?? 0;

  // --- Total Views ---
  const totalViewsDisplay = totalViews > 0 ? formatCompact(totalViews) : null;

  // --- Avg Views Per Video ---
  let avgViewsPerVideo: string | null = null;
  if (totalViews > 0 && totalVideos > 0) {
    avgViewsPerVideo = formatCompact(Math.round(totalViews / totalVideos));
  }

  // --- Channel Age ---
  let channelAge: string | null = null;
  let channelAgeLabel: string | null = null;
  let channelAgeMonths = 0;

  if (metrics.channelStartDate) {
    const start = new Date(metrics.channelStartDate);
    const now = new Date();
    channelAgeMonths = monthsBetween(start, now);
    const years = Math.floor(channelAgeMonths / 12);

    if (years >= 1) {
      channelAge = `${years} ${years === 1 ? "year" : "years"}`;
      channelAgeLabel = `Creating since '${String(start.getFullYear()).slice(2)}`;
    } else if (channelAgeMonths > 0) {
      channelAge = `${channelAgeMonths} months`;
      channelAgeLabel = `Started ${start.getFullYear()}`;
    }
  }

  // --- Upload Pace ---
  let uploadPace: string | null = null;
  if (totalVideos > 0 && channelAgeMonths > 0) {
    const pace = totalVideos / channelAgeMonths;
    if (pace >= 1) {
      uploadPace = `~${Math.round(pace)}/mo`;
    } else {
      // Less than 1 per month — show as per year
      const yearly = Math.round(pace * 12);
      uploadPace = `~${yearly}/yr`;
    }
  }

  // --- Views-per-Sub Ratio ---
  let viewsPerSub: string | null = null;
  let viewsPerSubLabel: string | null = null;
  if (totalViews > 0 && subscribers > 0) {
    const ratio = totalViews / subscribers;
    viewsPerSub = `${ratio.toFixed(1).replace(/\.0$/, "")}x`;

    if (ratio >= 20) viewsPerSubLabel = "Viral";
    else if (ratio >= 8) viewsPerSubLabel = "Strong Discovery";
    else if (ratio >= 3) viewsPerSubLabel = "Loyal";
    else viewsPerSubLabel = "Growing";
  }

  // --- Content Milestone ---
  let contentMilestone: string | null = null;
  let contentMilestoneIcon = "";
  if (totalVideos >= 500) {
    contentMilestone = "Powerhouse";
    contentMilestoneIcon = "trophy";
  } else if (totalVideos >= 200) {
    contentMilestone = "Prolific";
    contentMilestoneIcon = "trophy";
  } else if (totalVideos >= 50) {
    contentMilestone = "Rising Star";
    contentMilestoneIcon = "star";
  } else if (totalVideos > 0) {
    contentMilestone = "Starter";
    contentMilestoneIcon = "rocket";
  }

  // --- Engagement Rate Display ---
  let engagementRateDisplay: string | null = null;
  if (metrics.engagementRate) {
    engagementRateDisplay = `${metrics.engagementRate}% avg`;
  }

  // --- Est. Watch Time ---
  let estWatchTimeHours: string | null = null;
  if (totalViews > 0) {
    const avgMinutesPerView = 8;
    const hours = (totalViews * avgMinutesPerView) / 60;
    estWatchTimeHours = `~${formatCompact(Math.round(hours))} hrs`;
  }

  return {
    totalViews: totalViewsDisplay,
    totalViewsRaw: totalViews,
    avgViewsPerVideo,
    uploadPace,
    viewsPerSub,
    viewsPerSubLabel,
    channelAge,
    channelAgeLabel,
    contentMilestone,
    contentMilestoneIcon,
    engagementRateDisplay,
    estWatchTimeHours,
  };
}
