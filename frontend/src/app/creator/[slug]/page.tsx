"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Eye,
  Heart,
  Share2,
  Play,
  ExternalLink,
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Globe,
} from "lucide-react";
import { SocialLinkGroup, StatsBadge } from "@/components/creators";

// Mock data - in production, this would come from DynamoDB
const MOCK_CREATOR = {
  slug: "madam-boss",
  name: "Madam Boss",
  bio: "Award-winning Zimbabwean comedian and content creator known for my unique brand of humor that celebrates everyday Zimbabwean life. From market vendors to corporate meetings, I bring the laughs that hit home. My content reaches millions across Africa and the diaspora.",
  profilePicUrl: "/creators/madam-boss.jpg",
  bannerUrl: "/creators/madam-boss-banner.jpg",
  location: "Harare, Zimbabwe",
  niche: "Comedy",
  joinedDate: "2018",
  verified: true,
  metrics: {
    totalReach: 4500000,
    monthlyViews: 2100000,
    engagement: 8.5,
    totalVideos: 450,
  },
  platforms: {
    youtube: [
      {
        label: "Main Channel",
        url: "https://youtube.com/@madamboss",
        handle: "madamboss",
      },
      {
        label: "Vlog Channel",
        url: "https://youtube.com/@madambossvlogs",
        handle: "madambossvlogs",
      },
    ],
    instagram: [
      {
        label: "Official Page",
        url: "https://instagram.com/madamboss",
        handle: "madamboss",
      },
    ],
    twitter: [
      {
        label: "X",
        url: "https://x.com/madamboss",
        handle: "madamboss",
      },
    ],
    facebook: [
      {
        label: "Facebook Page",
        url: "https://facebook.com/madamboss",
      },
    ],
    tiktok: [
      {
        label: "TikTok",
        url: "https://tiktok.com/@madamboss",
        handle: "madamboss",
      },
    ],
    website: [
      {
        label: "Official Website",
        url: "https://madamboss.co.zw",
      },
    ],
  },
  topVideo: {
    title: "When Your Mother Visits From the Village",
    thumbnail: "/creators/madam-boss-video.jpg",
    views: 2500000,
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CreatorProfilePage({ params }: PageProps) {
  const { slug } = use(params);

  // In production, fetch creator data based on slug from DynamoDB
  const creator = MOCK_CREATOR;

  return (
    <div className="min-h-screen bg-[#09090b]">
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
                <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </Link>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] rounded-lg border border-white/[0.05] hover:border-[#DE2010]/30 transition-colors">
            <Share2 className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-white">Share</span>
          </button>
        </div>
      </nav>

      {/* Banner */}
      <div className="relative h-48 sm:h-64 mt-14">
        {creator.bannerUrl ? (
          <Image
            src={creator.bannerUrl}
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
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#DE2010]/10 text-[#DE2010] border border-[#DE2010]/20">{creator.niche}</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {creator.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Since {creator.joinedDate}
                </div>
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
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">About</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {creator.bio}
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
                  icon={Users}
                  size="sm"
                />
                <StatsBadge
                  label="Monthly Views"
                  value={creator.metrics.monthlyViews}
                  icon={Eye}
                  size="sm"
                />
                <StatsBadge
                  label="Engagement"
                  value={`${creator.metrics.engagement}%`}
                  icon={Heart}
                  size="sm"
                />
                <StatsBadge
                  label="Total Videos"
                  value={creator.metrics.totalVideos}
                  icon={Play}
                  size="sm"
                />
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
                {creator.platforms.youtube && (
                  <SocialLinkGroup
                    platform="youtube"
                    links={creator.platforms.youtube}
                  />
                )}
                {creator.platforms.instagram && (
                  <SocialLinkGroup
                    platform="instagram"
                    links={creator.platforms.instagram}
                  />
                )}
                {creator.platforms.twitter && (
                  <SocialLinkGroup
                    platform="twitter"
                    links={creator.platforms.twitter}
                  />
                )}
                {creator.platforms.facebook && (
                  <SocialLinkGroup
                    platform="facebook"
                    links={creator.platforms.facebook}
                  />
                )}
                {creator.platforms.tiktok && (
                  <SocialLinkGroup
                    platform="tiktok"
                    links={creator.platforms.tiktok}
                  />
                )}
                {creator.platforms.website && (
                  <SocialLinkGroup
                    platform="website"
                    links={creator.platforms.website}
                  />
                )}
              </div>
            </div>

            {/* Top Video */}
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

            {/* Contact for Collaborations */}
            <div className="bg-gradient-to-r from-[#DE2010]/10 via-white/[0.02] to-[#DE2010]/10 rounded-xl border border-[#DE2010]/20 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2">
                Work with {creator.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-4">
                Interested in collaborations, sponsorships, or brand deals?
              </p>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] text-white text-sm font-semibold rounded-xl transition-all">
                <ExternalLink className="w-4 h-4" />
                Get in Touch
              </button>
            </div>
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
              <Image src="/images/logo.png" alt="263Tube" width={24} height={24} className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
          </div>
          <p className="text-xs text-slate-500">&copy; 2025 263Tube. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
