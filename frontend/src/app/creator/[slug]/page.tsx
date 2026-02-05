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
  ExternalLink,
} from "lucide-react";
import { getCreatorBySlug } from "@/lib/creators";
import { SocialLinkGroup, StatsBadge, ContactCreatorForm } from "@/components/creators";
import { ReferralTracker } from "@/components/creators/ReferralTracker";
import { ShareButton } from "@/components/creators/ShareButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);

  if (!creator) {
    return {
      title: "Creator Not Found - 263Tube",
    };
  }

  return {
    title: `${creator.name} - 263Tube`,
    description: creator.bio || `Check out ${creator.name} on 263Tube - Zimbabwe's creator directory`,
    openGraph: {
      title: `${creator.name} - 263Tube`,
      description: creator.bio || `Check out ${creator.name} on 263Tube`,
      images: creator.profilePicUrl ? [creator.profilePicUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${creator.name} - 263Tube`,
      description: creator.bio || `Check out ${creator.name} on 263Tube`,
      images: creator.profilePicUrl ? [creator.profilePicUrl] : [],
    },
  };
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch creator data from DynamoDB
  const creator = await getCreatorBySlug(slug);

  // Return 404 if creator doesn't exist
  if (!creator) {
    notFound();
  }

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
          <ShareButton creatorName={creator.name} slug={slug} />
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
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-[#09090b] overflow-hidden bg-slate-800 flex-shrink-0 shadow-xl">
              {creator.profilePicUrl ? (
                <Image
                  src={creator.profilePicUrl}
                  alt={creator.name}
                  width={128}
                  height={128}
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
            <div className="flex gap-3 md:pt-4">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#DE2010]/20">
                <Heart className="w-4 h-4" />
                Follow
              </button>
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
                {creator.bio || `${creator.name} is a ${creator.niche} creator from Zimbabwe.`}
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                Stats
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <StatsBadge
                  label="Total Reach"
                  value={creator.metrics.totalReach}
                  icon="users"
                  size="sm"
                />
                {creator.metrics.monthlyViews && (
                  <StatsBadge
                    label="Monthly Views"
                    value={creator.metrics.monthlyViews}
                    icon="eye"
                    size="sm"
                  />
                )}
                {creator.metrics.engagement && (
                  <StatsBadge
                    label="Engagement"
                    value={`${creator.metrics.engagement}%`}
                    icon="heart"
                    size="sm"
                  />
                )}
                {creator.metrics.totalVideos && (
                  <StatsBadge
                    label="Total Videos"
                    value={creator.metrics.totalVideos}
                    icon="play"
                    size="sm"
                  />
                )}
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

            {/* Top Video */}
            {creator.topVideo && (
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                  Featured Video
                </h2>

                <div className="space-y-3 sm:space-y-4">
                  {/* Video Embed */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800">
                    <iframe
                      src={creator.topVideo.embedUrl}
                      title={creator.topVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>

                  {/* Video Info */}
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      {creator.topVideo.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-slate-500">
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {(creator.topVideo.views / 1000000).toFixed(1)}M views
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact for Collaborations */}
            <ContactCreatorForm creatorSlug={slug} creatorName={creator.name} />
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
            &copy; 2025 263Tube. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
