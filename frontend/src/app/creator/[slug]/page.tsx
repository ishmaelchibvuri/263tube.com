import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Eye,
  Heart,
  Briefcase,
  Zap,
  Users,
  Play,
  TrendingUp,
  Upload,
  Clock,
  Trophy,
  Star,
  Rocket,
  Youtube,
  ThumbsUp,
  Flame,
  History,
} from "lucide-react";
import { getCreatorBySlug } from "@/lib/creators";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import { calculateEngagementScore } from "@/lib/utils/engagement";
import { deriveYouTubeInsights } from "@/lib/utils/youtube-insights";
import { SocialLinkGroup, ContactCreatorForm, ClaimButton } from "@/components/creators";
import { ReferralTracker } from "@/components/creators/ReferralTracker";
import { ShareButton } from "@/components/creators/ShareButton";
import { AuthButton } from "@/components/home/AuthButton";
import { SyncButton } from "@/components/creators/SyncButton";
import type { Creator, VideoHighlight } from "@/lib/creators";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ============================================================================
// Source of Truth: Profile Image Resolution
// ============================================================================

/**
 * Resolve the profile image using the Source of Truth chain:
 * 1. creator.primaryProfileImage (set during verification)
 * 2. verifiedImage from the YouTube link record
 * 3. Generic avatar fallback (null - handled in JSX)
 */
function resolveProfileImage(creator: Creator): string | null {
  // 1. Primary profile image (populated during verification phase)
  if (creator.primaryProfileImage) {
    return creator.primaryProfileImage;
  }

  // 2. Fallback: verifiedImage from YouTube link
  if (creator.verifiedLinks && creator.verifiedLinks.length > 0) {
    const youtubeLink = creator.verifiedLinks.find(
      (link) => link.platform.toLowerCase() === "youtube" && link.image
    );
    if (youtubeLink?.image) {
      return youtubeLink.image;
    }

    // Try any verified link with an image
    const anyWithImage = creator.verifiedLinks.find((link) => link.image);
    if (anyWithImage?.image) {
      return anyWithImage.image;
    }
  }

  // 3. Fall back to existing profilePicUrl if present
  if (creator.profilePicUrl) {
    return creator.profilePicUrl;
  }

  // Final fallback: null (rendered as initial avatar in JSX)
  return null;
}

// ============================================================================
// SEO Metadata
// ============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);

  if (!creator) {
    return {
      title: "Creator Not Found | 263Tube",
    };
  }

  const profileImage = resolveProfileImage(creator);

  return {
    title: `${creator.name} | 263Tube`,
    description: creator.bio || `Check out ${creator.name} on 263Tube - Zimbabwe's creator directory`,
    openGraph: {
      title: `${creator.name} | 263Tube`,
      description: creator.bio || `Check out ${creator.name} on 263Tube`,
      images: profileImage ? [profileImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${creator.name} | 263Tube`,
      description: creator.bio || `Check out ${creator.name} on 263Tube`,
      images: profileImage ? [profileImage] : [],
    },
  };
}

// ============================================================================
// Page Component
// ============================================================================

export default async function CreatorProfilePage({ params }: PageProps) {
  const { slug } = await params;

  // Get session for ClaimButton auth awareness
  const { isAuthenticated } = await getServerSession();

  // Check if user is admin (for Sync Now button)
  const userIsAdmin = await isAdmin();

  // Fetch creator data directly from DynamoDB
  const creator = await getCreatorBySlug(slug);

  // Return 404 if creator doesn't exist
  if (!creator) {
    notFound();
  }

  // Resolve profile image using Source of Truth chain
  const profileImage = resolveProfileImage(creator);

  // Live Metric Calculations
  const totalReach = creator.metrics.totalReach;
  const totalContent =
    (creator.metrics.videoCount || 0) + (creator.metrics.postCount || 0) ||
    creator.metrics.totalVideos ||
    0;
  const engagement = calculateEngagementScore(creator.metrics, creator.platforms);
  const monthlyViews = creator.metrics.rollingMonthlyViews
    ?? creator.metrics.monthlyViews
    ?? null;

  // YouTube Insights (derived from DB-stored metrics — no live API calls)
  const videoHighlights: VideoHighlight[] = creator.videoHighlights ?? [];
  const ytInsights = deriveYouTubeInsights(creator.metrics, creator.platforms, creator.verifiedLinks);

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Referral Tracker - Client Component */}
      <ReferralTracker slug={slug} />

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#09090b]/95 backdrop-blur-xl border-b border-white/[0.05] z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </Link>
            {/* Branding */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="263Tube"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-base font-bold text-white">
                263<span className="text-[#DE2010]">Tube</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton creatorName={creator.name} slug={slug} />
            <AuthButton />
          </div>
        </div>
      </nav>

      {/* Banner */}
      <div className="relative h-48 sm:h-64 mt-14">
        {creator.bannerUrl || creator.coverImageUrl ? (
          <Image
            src={creator.bannerUrl || creator.coverImageUrl || ""}
            alt={`${creator.name} banner`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#DE2010]/30 via-slate-800 to-slate-900" />
        )}
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-16 sm:-mt-20 mb-8">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            {/* Avatar - Source of Truth Image */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-[#09090b] overflow-hidden bg-slate-800 flex-shrink-0 shadow-xl">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={creator.name}
                  width={128}
                  height={128}
                  unoptimized
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#DE2010] to-[#b01a0d]">
                  <span className="text-3xl sm:text-4xl font-bold text-white">
                    {creator.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Name & Meta */}
            <div className="flex-1 pt-2 sm:pt-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  {creator.name}
                </h1>
                {creator.verified && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#319E31] flex items-center justify-center">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#DE2010]/10 text-[#DE2010] border border-[#DE2010]/20">
                  {creator.niche}
                </span>
                {creator.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {creator.location}
                  </div>
                )}
                {creator.joinedDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Since {creator.joinedDate}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 md:pt-4">
              <a
                href="#work-together"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#DE2010]/20"
              >
                <Briefcase className="w-4 h-4" />
                Work Together
              </a>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white text-sm font-semibold rounded-xl transition-all">
                <Heart className="w-4 h-4" />
                Follow
              </button>
              {!creator.claimedBy && (
                <ClaimButton slug={slug} isAuthenticated={isAuthenticated} />
              )}
              {/* Admin Sync Button */}
              {userIsAdmin && <SyncButton slug={slug} />}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 pb-16">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Bio */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                About
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {creator.bio || "No bio yet."}
              </p>
            </div>

            {/* Engagement Score */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
                Engagement Score
              </h2>
              <div className="flex items-center gap-4">
                {/* Score Ring */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background ring */}
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="8"
                    />
                    {/* Score ring */}
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke={
                        engagement.score >= 7 ? "#319E31"
                        : engagement.score >= 5 ? "#FFD200"
                        : engagement.score >= 3 ? "#f97316"
                        : "#64748b"
                      }
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(engagement.score / 10) * 264} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-white leading-none">
                      {engagement.score}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-none mt-0.5">/10</span>
                  </div>
                </div>
                {/* Label & breakdown hint */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold ${engagement.color}`}>
                    {engagement.label}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Based on audience reach, content volume, views, and platform presence.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
                Stats
              </h2>
              <div className="space-y-3">
                {/* Total Reach */}
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Users className="w-4 h-4 text-[#DE2010]" />
                    <span className="text-sm">Total Reach</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {totalReach >= 1000000
                      ? `${(totalReach / 1000000).toFixed(1).replace(/\.0$/, "")}M`
                      : totalReach >= 1000
                        ? `${(totalReach / 1000).toFixed(1).replace(/\.0$/, "")}K`
                        : totalReach.toLocaleString()}
                  </span>
                </div>
                {/* Total Content */}
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Play className="w-4 h-4 text-[#DE2010]" />
                    <span className="text-sm">Total Content</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {totalContent > 0 ? totalContent.toLocaleString() : "--"}
                  </span>
                </div>
                {/* Monthly Views */}
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Eye className="w-4 h-4 text-[#DE2010]" />
                    <span className="text-sm">Monthly Views</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {monthlyViews != null && monthlyViews > 0
                      ? monthlyViews >= 1000000
                        ? `${(monthlyViews / 1000000).toFixed(1).replace(/\.0$/, "")}M`
                        : monthlyViews >= 1000
                          ? `${(monthlyViews / 1000).toFixed(1).replace(/\.0$/, "")}K`
                          : monthlyViews.toLocaleString()
                      : "--"}
                  </span>
                </div>
                {/* Engagement */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Zap className="w-4 h-4 text-[#DE2010]" />
                    <span className="text-sm">Engagement</span>
                  </div>
                  <span className={`text-sm font-semibold ${engagement.color}`}>
                    {engagement.score}/10 &middot; {engagement.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ecosystem & Video */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* The Ecosystem */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2">
                The Ecosystem
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">
                Find {creator.name} across all platforms
              </p>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {creator.platforms.youtube && creator.platforms.youtube.length > 0 && (
                  <SocialLinkGroup
                    platform="youtube"
                    links={creator.platforms.youtube}
                  />
                )}
                {creator.platforms.instagram && creator.platforms.instagram.length > 0 && (
                  <SocialLinkGroup
                    platform="instagram"
                    links={creator.platforms.instagram}
                  />
                )}
                {creator.platforms.twitter && creator.platforms.twitter.length > 0 && (
                  <SocialLinkGroup
                    platform="twitter"
                    links={creator.platforms.twitter}
                  />
                )}
                {creator.platforms.facebook && creator.platforms.facebook.length > 0 && (
                  <SocialLinkGroup
                    platform="facebook"
                    links={creator.platforms.facebook}
                  />
                )}
                {creator.platforms.tiktok && creator.platforms.tiktok.length > 0 && (
                  <SocialLinkGroup
                    platform="tiktok"
                    links={creator.platforms.tiktok}
                  />
                )}
                {creator.platforms.website && creator.platforms.website.length > 0 && (
                  <SocialLinkGroup
                    platform="website"
                    links={creator.platforms.website}
                  />
                )}
              </div>
            </div>

            {/* Highest Viewed & Latest Video */}
            {(() => {
              const mostViewed = videoHighlights[0] ?? null;   // idx 0 = most viewed
              const latest = videoHighlights.find((v, i) => i >= 1 && videoHighlights.slice(0, i).every((h) => h.videoId !== v.videoId))
                ?? videoHighlights[1] ?? null;  // next unique entry = latest
              // Also support legacy topVideo as fallback for most viewed
              const fallbackTop = !mostViewed && creator.topVideo ? creator.topVideo : null;
              const hasVideos = mostViewed || fallbackTop || latest;
              if (!hasVideos) return null;

              const fmtViews = (n: number) =>
                n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
                : n >= 1_000 ? `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`
                : n.toLocaleString();

              const fmtLikes = fmtViews;

              return (
                <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Play className="w-4 h-4 text-[#FF0000]" />
                    <h2 className="text-base sm:text-lg font-semibold text-white">
                      Featured Videos
                    </h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Highest Viewed */}
                    {(mostViewed || fallbackTop) && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-xs font-semibold text-orange-400">Highest Viewed</span>
                        </div>
                        {mostViewed ? (
                          <a
                            href={`https://www.youtube.com/watch?v=${mostViewed.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block"
                          >
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 mb-2">
                              {mostViewed.thumbnail ? (
                                <Image
                                  src={mostViewed.thumbnail}
                                  alt={mostViewed.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className="w-8 h-8 text-slate-600" />
                                </div>
                              )}
                            </div>
                            <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-[#FF0000] transition-colors">
                              {mostViewed.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" /> {fmtViews(mostViewed.views)}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" /> {fmtLikes(mostViewed.likes)}
                              </span>
                            </div>
                          </a>
                        ) : fallbackTop ? (
                          <div>
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 mb-2">
                              <iframe
                                src={fallbackTop.embedUrl}
                                title={fallbackTop.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                              />
                            </div>
                            <h3 className="text-sm font-medium text-white line-clamp-2">{fallbackTop.title}</h3>
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                              <Eye className="w-3 h-3" /> {fmtViews(fallbackTop.views)}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Latest Video */}
                    {latest && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">Latest</span>
                        </div>
                        <a
                          href={`https://www.youtube.com/watch?v=${latest.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 mb-2">
                            {latest.thumbnail ? (
                              <Image
                                src={latest.thumbnail}
                                alt={latest.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-slate-600" />
                              </div>
                            )}
                          </div>
                          <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-[#FF0000] transition-colors">
                            {latest.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {fmtViews(latest.views)}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> {fmtLikes(latest.likes)}
                            </span>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Contact for Collaborations */}
            <div id="work-together">
              <ContactCreatorForm creatorSlug={slug} creatorName={creator.name} />
            </div>

            {/* YouTube Insights — Snapshot */}
            {ytInsights && (
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Youtube className="w-5 h-5 text-[#FF0000]" />
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    YouTube Insights
                  </h2>
                  {ytInsights.channelAgeLabel && (
                    <span className="ml-auto text-xs text-slate-500">{ytInsights.channelAgeLabel}</span>
                  )}
                </div>

                {/* Stats Strip — compact horizontal row */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                  <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <p className="text-sm sm:text-base font-bold text-white leading-none">{ytInsights.totalViews ?? "--"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">views</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <p className="text-sm sm:text-base font-bold text-white leading-none">{ytInsights.avgViewsPerVideo ?? "--"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">per video</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <p className="text-sm sm:text-base font-bold text-white leading-none">{ytInsights.uploadPace ?? "--"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">uploads</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <p className="text-sm sm:text-base font-bold text-white leading-none">{ytInsights.viewsPerSub ?? "--"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{ytInsights.viewsPerSubLabel ?? "views/sub"}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <p className="text-sm sm:text-base font-bold text-white leading-none">{ytInsights.estWatchTimeHours ?? "--"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">watched</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <p className="text-sm sm:text-base font-bold text-white leading-none">{ytInsights.channelAge ?? "--"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">on YouTube</p>
                  </div>
                </div>

                {/* Content Milestone */}
                {ytInsights.contentMilestone && (
                  <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    {ytInsights.contentMilestoneIcon === "trophy" && <Trophy className="w-4 h-4 text-amber-400" />}
                    {ytInsights.contentMilestoneIcon === "star" && <Star className="w-4 h-4 text-amber-400" />}
                    {ytInsights.contentMilestoneIcon === "rocket" && <Rocket className="w-4 h-4 text-blue-400" />}
                    <span className="text-sm font-medium text-white">
                      {ytInsights.contentMilestone} Creator
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">
                      {(creator.metrics.totalVideos ?? 0).toLocaleString()} videos
                    </span>
                  </div>
                )}

                {/* Video Highlights */}
                {videoHighlights.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-3">Video Highlights</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {videoHighlights.map((video, idx) => {
                        // Creative labels for each highlight slot
                        const labels = ["Most Viewed", "Most Liked", "Latest", "Throwback"];
                        const icons = [
                          <Flame key="flame" className="w-3 h-3" />,
                          <ThumbsUp key="like" className="w-3 h-3" />,
                          <TrendingUp key="trend" className="w-3 h-3" />,
                          <History key="history" className="w-3 h-3" />,
                        ];
                        const colors = [
                          "text-orange-400 bg-orange-400/10 border-orange-400/20",
                          "text-pink-400 bg-pink-400/10 border-pink-400/20",
                          "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
                          "text-blue-400 bg-blue-400/10 border-blue-400/20",
                        ];
                        const label = labels[idx] ?? "Featured";
                        const icon = icons[idx] ?? icons[0];
                        const color = colors[idx] ?? colors[0];

                        const viewsStr = video.views >= 1_000_000
                          ? `${(video.views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
                          : video.views >= 1_000
                            ? `${(video.views / 1_000).toFixed(1).replace(/\.0$/, "")}K`
                            : video.views.toLocaleString();

                        const likesStr = video.likes >= 1_000_000
                          ? `${(video.likes / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
                          : video.likes >= 1_000
                            ? `${(video.likes / 1_000).toFixed(1).replace(/\.0$/, "")}K`
                            : video.likes.toLocaleString();

                        return (
                          <a
                            key={video.videoId}
                            href={`https://www.youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-colors"
                          >
                            {/* Thumbnail */}
                            <div className="relative w-28 h-16 flex-shrink-0 rounded-md overflow-hidden bg-slate-800">
                              {video.thumbnail ? (
                                <Image
                                  src={video.thumbnail}
                                  alt={video.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className="w-5 h-5 text-slate-600" />
                                </div>
                              )}
                              {/* Badge overlay */}
                              <span className={`absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${color}`}>
                                {icon}
                                {label}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <p className="text-xs font-medium text-white line-clamp-2 leading-tight group-hover:text-[#FF0000] transition-colors">
                                {video.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                                <span className="flex items-center gap-0.5">
                                  <Eye className="w-3 h-3" />
                                  {viewsStr}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <ThumbsUp className="w-3 h-3" />
                                  {likesStr}
                                </span>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 bg-black/40 border-t border-white/[0.05]">
        {/* Zimbabwe Flag Stripe */}
        <div className="h-[3px] bg-gradient-to-r from-[#319E31] via-[#FFD200] to-[#DE2010] mb-6" />
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded overflow-hidden">
              <Image
                src="/images/logo.png"
                alt="263Tube"
                width={24}
                height={24}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-bold text-white">
              263<span className="text-[#DE2010]">Tube</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} 263Tube. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
