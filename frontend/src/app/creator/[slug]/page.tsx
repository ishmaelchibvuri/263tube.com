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
        label: "Twitter",
        url: "https://twitter.com/madamboss",
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Directory</span>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </nav>

      {/* Banner */}
      <div className="profile-banner pt-16">
        {creator.bannerUrl ? (
          <Image
            src={creator.bannerUrl}
            alt={`${creator.name} banner`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-slate-800 to-slate-900" />
        )}
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-2xl border-4 border-background overflow-hidden bg-secondary flex-shrink-0">
              {creator.profilePicUrl ? (
                <Image
                  src={creator.profilePicUrl}
                  alt={creator.name}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/20">
                  <span className="text-4xl font-bold text-primary">
                    {creator.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Name & Meta */}
            <div className="flex-1 pt-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {creator.name}
                </h1>
                {creator.verified && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
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

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="niche-tag">{creator.niche}</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {creator.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Creating since {creator.joinedDate}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 md:pt-4">
              <button className="btn-primary">
                <Heart className="w-4 h-4 mr-2" />
                Follow
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 pb-16">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Bio */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed">
                {creator.bio}
              </p>
            </div>

            {/* Stats */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Stats
              </h2>
              <div className="grid grid-cols-2 gap-4">
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
          <div className="lg:col-span-2 space-y-6">
            {/* The Ecosystem */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                The Ecosystem
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Find {creator.name} across all platforms
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
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
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Featured Video
              </h2>

              <div className="space-y-4">
                {/* Video Embed */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
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
                  <h3 className="font-semibold text-foreground">
                    {creator.topVideo.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    {(creator.topVideo.views / 1000000).toFixed(1)}M views
                  </div>
                </div>
              </div>
            </div>

            {/* Contact for Collaborations */}
            <div className="bg-gradient-to-r from-primary/10 via-card to-primary/10 rounded-xl border border-primary/20 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Work with {creator.name}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Interested in collaborations, sponsorships, or brand deals?
              </p>
              <button className="btn-primary">
                <ExternalLink className="w-4 h-4 mr-2" />
                Get in Touch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 bg-secondary/50 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 263Tube. Made with love in Zimbabwe.</p>
        </div>
      </footer>
    </div>
  );
}
