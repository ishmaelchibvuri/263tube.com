"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Calendar } from "lucide-react";
import { TrendingLeaderboard } from "./TrendingLeaderboard";
import { TimeFrameSelector } from "./TimeFrameSelector";
import type { Creator } from "@/lib/creators";

type TimeFrame = "week" | "month" | "year";

interface TrendingPageClientProps {
  creators: Creator[];
}

function formatNumber(num: number): string {
  if (num >= 1000000)
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

export function TrendingPageClient({ creators }: TrendingPageClientProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("week");

  // Get rising stars (top 4 with highest growth)
  const risingStars = creators
    .filter((c) => c.referralStats?.currentWeek && c.referralStats.currentWeek > 0)
    .sort(
      (a, b) =>
        (b.referralStats?.currentWeek || 0) - (a.referralStats?.currentWeek || 0)
    )
    .slice(0, 4)
    .map((creator) => ({
      ...creator,
      growthPercent: Math.floor(50 + Math.random() * 100), // Simulated growth
      newFollowers: Math.floor(5000 + Math.random() * 40000),
    }));

  // Calculate aggregate stats
  const totalViews = creators.reduce(
    (sum, c) => sum + (c.metrics.monthlyViews || c.metrics.totalReach / 10),
    0
  );
  const totalShares = creators.reduce(
    (sum, c) => sum + (c.referralStats?.currentWeek || 0),
    0
  );

  return (
    <>
      {/* Header */}
      <header className="relative py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[#DE2010]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#DE2010] animate-pulse" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  Trending Creators
                </h1>
              </div>
              <p className="text-slate-400 text-sm sm:text-base">
                See who&apos;s making waves in Zimbabwe&apos;s creator community
              </p>
            </div>

            <TimeFrameSelector value={timeFrame} onChange={setTimeFrame} />
          </div>
        </div>
      </header>

      <main className="relative px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            <TrendingLeaderboard creators={creators} timeFrame={timeFrame} />

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Rising Stars */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.05]">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#319E31]" />
                    Rising Stars
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Fastest growing this {timeFrame}
                  </p>
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {risingStars.map((creator) => (
                    <Link
                      key={creator.slug}
                      href={`/creator/${creator.slug}`}
                      className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                        {creator.profilePicUrl ? (
                          <Image
                            src={creator.profilePicUrl}
                            alt={creator.name}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#319E31]/30 to-slate-800 flex items-center justify-center text-white text-xs font-bold">
                            {creator.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {creator.name}
                        </h3>
                        <p className="text-xs text-slate-500">{creator.niche}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-[#319E31]">
                          +{creator.growthPercent}%
                        </div>
                        <div className="text-[10px] text-slate-500">
                          +{formatNumber(creator.newFollowers)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Stats Summary */}
              <div className="bg-gradient-to-br from-[#DE2010]/10 to-[#319E31]/10 border border-white/[0.05] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FFD200]" />
                  This Week&apos;s Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Total Views</span>
                    <span className="text-sm font-bold text-white">
                      {formatNumber(totalViews)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Total Shares</span>
                    <span className="text-sm font-bold text-white">
                      {formatNumber(totalShares)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Active Creators</span>
                    <span className="text-sm font-bold text-white">
                      {creators.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Avg. Growth</span>
                    <span className="text-sm font-bold text-[#319E31]">+14%</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-center">
                <h3 className="text-sm font-semibold text-white mb-2">
                  Want to be featured?
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Submit your creator profile to join the rankings
                </p>
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
    </>
  );
}
