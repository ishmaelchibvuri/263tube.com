"use client";

import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
  Eye,
  Share2,
} from "lucide-react";
import type { Creator } from "@/lib/creators";

interface TrendingLeaderboardProps {
  creators: Creator[];
  timeFrame: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000)
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

function getRankBadgeStyle(rank: number) {
  if (rank === 1)
    return "bg-gradient-to-br from-[#FFD200] to-amber-500 text-amber-900";
  if (rank === 2)
    return "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800";
  if (rank === 3)
    return "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900";
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

export function TrendingLeaderboard({
  creators,
  timeFrame,
}: TrendingLeaderboardProps) {
  // Simulate rank change (in production, this would come from the backend)
  const creatorsWithRank = creators.map((creator, index) => ({
    ...creator,
    rank: index + 1,
    change: Math.floor(Math.random() * 30) - 10, // Simulated change
    weeklyViews: creator.metrics.monthlyViews
      ? Math.floor(creator.metrics.monthlyViews / 4)
      : creator.metrics.totalReach / 10,
    weeklyShares: creator.referralStats?.currentWeek || 0,
  }));

  const top3 = creatorsWithRank.slice(0, 3);

  return (
    <div className="lg:col-span-2">
      {/* Top 3 Highlight */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        {[1, 0, 2].map((displayIndex, index) => {
          const creator = top3[displayIndex];
          if (!creator) return null;
          const isFirst = displayIndex === 0;

          return (
            <Link
              key={creator.slug}
              href={`/creator/${creator.slug}`}
              className={`group relative flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#FFD200]/30 transition-all ${
                isFirst ? "sm:-mt-4" : ""
              }`}
            >
              {/* Crown for #1 */}
              {isFirst && (
                <Crown className="absolute -top-3 w-6 h-6 text-[#FFD200]" />
              )}

              {/* Avatar */}
              <div
                className={`relative ${
                  isFirst ? "w-16 h-16 sm:w-20 sm:h-20" : "w-12 h-12 sm:w-16 sm:h-16"
                } rounded-xl overflow-hidden border-2 ${
                  isFirst ? "border-[#FFD200]" : "border-white/10"
                } mb-2`}
              >
                {creator.profilePicUrl ? (
                  <Image
                    src={creator.profilePicUrl}
                    alt={creator.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center text-white font-bold">
                    {creator.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Rank Badge */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${getRankBadgeStyle(
                  creator.rank
                )}`}
              >
                {creator.rank}
              </div>

              {/* Name */}
              <h3 className="text-xs sm:text-sm font-semibold text-white text-center truncate w-full group-hover:text-[#FFD200] transition-colors">
                {creator.name}
              </h3>
              <span className="text-[10px] sm:text-xs text-slate-500">
                {creator.niche}
              </span>

              {/* Stats */}
              <div className="mt-2 text-center">
                <div className="text-sm sm:text-base font-bold text-white">
                  {formatNumber(creator.weeklyViews)}
                </div>
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
            Top 15 This{" "}
            {timeFrame === "week"
              ? "Week"
              : timeFrame === "month"
              ? "Month"
              : "Year"}
          </h2>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {creatorsWithRank.map((creator) => {
            const changeInfo = getChangeIndicator(creator.change);
            const ChangeIcon = changeInfo.icon;

            return (
              <Link
                key={creator.slug}
                href={`/creator/${creator.slug}`}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-white/[0.02] transition-colors"
              >
                {/* Rank */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${getRankBadgeStyle(
                    creator.rank
                  )}`}
                >
                  {creator.rank}
                </div>

                {/* Change Indicator */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${changeInfo.bg}`}
                >
                  <ChangeIcon className={`w-3 h-3 ${changeInfo.color}`} />
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  {creator.profilePicUrl ? (
                    <Image
                      src={creator.profilePicUrl}
                      alt={creator.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#DE2010]/30 to-slate-800 flex items-center justify-center text-white text-sm font-bold">
                      {creator.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {creator.name}
                    </h3>
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
                      <span className="text-xs">
                        {formatNumber(creator.weeklyViews)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 justify-end text-slate-400">
                      <Share2 className="w-3 h-3" />
                      <span className="text-xs">
                        {formatNumber(creator.weeklyShares)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change Percentage */}
                <div className={`text-xs sm:text-sm font-medium ${changeInfo.color}`}>
                  {creator.change > 0 ? "+" : ""}
                  {creator.change}%
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
