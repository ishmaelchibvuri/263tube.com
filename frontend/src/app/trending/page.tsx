"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
  Users,
  Eye,
  Share2,
  Calendar,
} from "lucide-react";

// Mock trending data
const TRENDING_CREATORS = [
  { id: "1", rank: 1, previousRank: 1, name: "Madam Boss", slug: "madam-boss", profilePicUrl: "/creators/madam-boss.jpg", niche: "Comedy", weeklyViews: 1250000, weeklyShares: 28400, change: 12, verified: true },
  { id: "2", rank: 2, previousRank: 3, name: "Mai Titi", slug: "mai-titi", profilePicUrl: "/creators/mai-titi.jpg", niche: "Entertainment", weeklyViews: 980000, weeklyShares: 21560, change: 24, verified: true },
  { id: "3", rank: 3, previousRank: 2, name: "Jah Prayzah", slug: "jah-prayzah", profilePicUrl: "/creators/jah-prayzah.jpg", niche: "Music", weeklyViews: 890000, weeklyShares: 19800, change: -8, verified: true },
  { id: "4", rank: 4, previousRank: 5, name: "Tyra Chikocho", slug: "tyra-chikocho", profilePicUrl: "/creators/tyra.jpg", niche: "Comedy", weeklyViews: 720000, weeklyShares: 18900, change: 18, verified: true },
  { id: "5", rank: 5, previousRank: 4, name: "Winky D", slug: "winky-d", profilePicUrl: "/creators/winky-d.jpg", niche: "Music", weeklyViews: 680000, weeklyShares: 16540, change: -5, verified: true },
  { id: "6", rank: 6, previousRank: 8, name: "Baba Harare", slug: "baba-harare", profilePicUrl: "/creators/baba-harare.jpg", niche: "Music", weeklyViews: 540000, weeklyShares: 9870, change: 32, verified: true },
  { id: "7", rank: 7, previousRank: 6, name: "Comic Pastor", slug: "comic-pastor", profilePicUrl: "/creators/comic-pastor.jpg", niche: "Comedy", weeklyViews: 480000, weeklyShares: 9200, change: -4, verified: true },
  { id: "8", rank: 8, previousRank: 10, name: "Munya & Tupi", slug: "munya-tupi", profilePicUrl: "/creators/munya-tupi.jpg", niche: "Farming", weeklyViews: 450000, weeklyShares: 14320, change: 23, verified: true },
  { id: "9", rank: 9, previousRank: 7, name: "Shadaya Knight", slug: "shadaya-knight", profilePicUrl: "/creators/shadaya.jpg", niche: "Commentary", weeklyViews: 420000, weeklyShares: 16540, change: -12, verified: false },
  { id: "10", rank: 10, previousRank: 11, name: "TechZim", slug: "techzim", profilePicUrl: "/creators/techzim.jpg", niche: "Technology", weeklyViews: 380000, weeklyShares: 10980, change: 15, verified: true },
  { id: "11", rank: 11, previousRank: 9, name: "African Grey", slug: "african-grey", profilePicUrl: "/creators/african-grey.jpg", niche: "Comedy", weeklyViews: 350000, weeklyShares: 8760, change: -6, verified: true },
  { id: "12", rank: 12, previousRank: 14, name: "Zimbo Kitchen", slug: "zimbo-kitchen", profilePicUrl: "/creators/zimbo-kitchen.jpg", niche: "Cooking", weeklyViews: 320000, weeklyShares: 12870, change: 28, verified: false },
  { id: "13", rank: 13, previousRank: 12, name: "Zim Diaspora", slug: "zim-diaspora-life", profilePicUrl: "/creators/diaspora.jpg", niche: "Lifestyle", weeklyViews: 290000, weeklyShares: 8760, change: -3, verified: false },
  { id: "14", rank: 14, previousRank: 15, name: "Harare Nights", slug: "harare-nights", profilePicUrl: "/creators/harare-nights.jpg", niche: "Entertainment", weeklyViews: 230000, weeklyShares: 7650, change: 19, verified: false },
  { id: "15", rank: 15, previousRank: 13, name: "Zee Nxumalo", slug: "zee-nxumalo", profilePicUrl: "/creators/zee-nxumalo.jpg", niche: "Beauty", weeklyViews: 180000, weeklyShares: 5430, change: -7, verified: false },
];

const RISING_STARS = [
  { id: "r1", name: "Zimbo Kitchen", slug: "zimbo-kitchen", profilePicUrl: "/creators/zimbo-kitchen.jpg", niche: "Cooking", growthPercent: 156, newFollowers: 45000 },
  { id: "r2", name: "Harare Nights", slug: "harare-nights", profilePicUrl: "/creators/harare-nights.jpg", niche: "Entertainment", growthPercent: 124, newFollowers: 32000 },
  { id: "r3", name: "Zim Fitness", slug: "zim-fitness", profilePicUrl: "/creators/zim-fitness.jpg", niche: "Lifestyle", growthPercent: 98, newFollowers: 18000 },
  { id: "r4", name: "Zee Nxumalo", slug: "zee-nxumalo", profilePicUrl: "/creators/zee-nxumalo.jpg", niche: "Beauty", growthPercent: 87, newFollowers: 15000 },
];

type TimeFrame = "week" | "month" | "year";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

function getRankBadgeStyle(rank: number) {
  if (rank === 1) return "bg-gradient-to-br from-[#FFD200] to-amber-500 text-amber-900";
  if (rank === 2) return "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800";
  if (rank === 3) return "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900";
  return "bg-white/10 text-white/60";
}

function getChangeIndicator(change: number) {
  if (change > 0) {
    return { icon: ArrowUp, color: "text-[#319E31]", bg: "bg-[#319E31]/10" };
  } else if (change < 0) {
    return { icon: ArrowDown, color: "text-[#DE2010]", bg: "bg-[#DE2010]/10" };
  }
  return { icon: Minus, color: "text-slate-500", bg: "bg-white/5" };
}

export default function TrendingPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("week");

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#DE2010]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#319E31]/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/creators" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
                All Creators
              </Link>
              <Link href="/login" className="px-4 py-2 text-sm font-medium bg-[#DE2010] text-white rounded-lg hover:bg-[#ff2a17] transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="relative py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-6 h-6 text-[#DE2010]" />
                <h1 className="text-3xl sm:text-4xl font-bold text-white">Trending Creators</h1>
              </div>
              <p className="text-slate-400 text-sm sm:text-base">
                See who's making waves in Zimbabwe's creator community
              </p>
            </div>

            {/* Time Frame Selector */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.05] rounded-lg">
              {(["week", "month", "year"] as TimeFrame[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    timeFrame === tf
                      ? "bg-[#DE2010] text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tf === "week" ? "This Week" : tf === "month" ? "This Month" : "This Year"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="relative px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Leaderboard */}
            <div className="lg:col-span-2">
              {/* Top 3 Highlight */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
                {TRENDING_CREATORS.slice(0, 3).map((creator, index) => {
                  const positions = [1, 0, 2]; // Display order: 2nd, 1st, 3rd
                  const displayIndex = positions[index];
                  const displayCreator = TRENDING_CREATORS[displayIndex];
                  const isFirst = displayIndex === 0;

                  return (
                    <Link
                      key={displayCreator.id}
                      href={`/creator/${displayCreator.slug}`}
                      className={`group relative flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#FFD200]/30 transition-all ${
                        isFirst ? "sm:-mt-4" : ""
                      }`}
                    >
                      {/* Crown for #1 */}
                      {isFirst && (
                        <Crown className="absolute -top-3 w-6 h-6 text-[#FFD200]" />
                      )}

                      {/* Avatar */}
                      <div className={`relative ${isFirst ? "w-16 h-16 sm:w-20 sm:h-20" : "w-12 h-12 sm:w-16 sm:h-16"} rounded-xl overflow-hidden border-2 ${isFirst ? "border-[#FFD200]" : "border-white/10"} mb-2`}>
                        {displayCreator.profilePicUrl ? (
                          <Image src={displayCreator.profilePicUrl} alt={displayCreator.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center text-white font-bold">
                            {displayCreator.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Rank Badge */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${getRankBadgeStyle(displayCreator.rank)}`}>
                        {displayCreator.rank}
                      </div>

                      {/* Name */}
                      <h3 className="text-xs sm:text-sm font-semibold text-white text-center truncate w-full group-hover:text-[#FFD200] transition-colors">
                        {displayCreator.name}
                      </h3>
                      <span className="text-[10px] sm:text-xs text-slate-500">{displayCreator.niche}</span>

                      {/* Stats */}
                      <div className="mt-2 text-center">
                        <div className="text-sm sm:text-base font-bold text-white">{formatNumber(displayCreator.weeklyViews)}</div>
                        <div className="text-[10px] text-slate-500">views</div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Full Leaderboard */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.05]">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#DE2010]" />
                    Top 15 This {timeFrame === "week" ? "Week" : timeFrame === "month" ? "Month" : "Year"}
                  </h2>
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {TRENDING_CREATORS.map((creator) => {
                    const changeInfo = getChangeIndicator(creator.change);
                    const ChangeIcon = changeInfo.icon;

                    return (
                      <Link
                        key={creator.id}
                        href={`/creator/${creator.slug}`}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Rank */}
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${getRankBadgeStyle(creator.rank)}`}>
                          {creator.rank}
                        </div>

                        {/* Change Indicator */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${changeInfo.bg}`}>
                          <ChangeIcon className={`w-3 h-3 ${changeInfo.color}`} />
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          {creator.profilePicUrl ? (
                            <Image src={creator.profilePicUrl} alt={creator.name} width={40} height={40} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#DE2010]/30 to-slate-800 flex items-center justify-center text-white text-sm font-bold">
                              {creator.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-semibold text-white truncate">{creator.name}</h3>
                            {creator.verified && (
                              <span className="text-[10px] text-[#319E31]">✓</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{creator.niche}</p>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-right">
                          <div>
                            <div className="flex items-center gap-1 justify-end text-slate-400">
                              <Eye className="w-3 h-3" />
                              <span className="text-xs">{formatNumber(creator.weeklyViews)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 justify-end text-slate-400">
                              <Share2 className="w-3 h-3" />
                              <span className="text-xs">{formatNumber(creator.weeklyShares)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Change Percentage */}
                        <div className={`text-xs sm:text-sm font-medium ${changeInfo.color}`}>
                          {creator.change > 0 ? "+" : ""}{creator.change}%
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Rising Stars */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.05]">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#319E31]" />
                    Rising Stars
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Fastest growing this {timeFrame}</p>
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {RISING_STARS.map((creator, index) => (
                    <Link
                      key={creator.id}
                      href={`/creator/${creator.slug}`}
                      className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                        {creator.profilePicUrl ? (
                          <Image src={creator.profilePicUrl} alt={creator.name} width={32} height={32} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#319E31]/30 to-slate-800 flex items-center justify-center text-white text-xs font-bold">
                            {creator.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">{creator.name}</h3>
                        <p className="text-xs text-slate-500">{creator.niche}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-[#319E31]">+{creator.growthPercent}%</div>
                        <div className="text-[10px] text-slate-500">+{formatNumber(creator.newFollowers)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Stats Summary */}
              <div className="bg-gradient-to-br from-[#DE2010]/10 to-[#319E31]/10 border border-white/[0.05] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FFD200]" />
                  This Week's Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Total Views</span>
                    <span className="text-sm font-bold text-white">8.2M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Total Shares</span>
                    <span className="text-sm font-bold text-white">186K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">New Creators</span>
                    <span className="text-sm font-bold text-white">+12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Avg. Growth</span>
                    <span className="text-sm font-bold text-[#319E31]">+14%</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-center">
                <h3 className="text-sm font-semibold text-white mb-2">Want to be featured?</h3>
                <p className="text-xs text-slate-400 mb-4">Submit your creator profile to join the rankings</p>
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-[#DE2010] hover:bg-[#ff2a17] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Submit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.05] bg-black/40">
        <div className="h-1 bg-gradient-to-r from-[#319E31] via-[#FFD200] to-[#DE2010]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded overflow-hidden">
                <Image src="/images/logo.png" alt="263Tube" width={24} height={24} className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-semibold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/creators" className="hover:text-white transition-colors">All Creators</Link>
              <Link href="/categories" className="hover:text-white transition-colors">Categories</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
            </div>
            <p className="text-xs text-slate-600">All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
