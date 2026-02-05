"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Eye,
  Share2,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  PieChart,
  BarChart3,
  Crown,
} from "lucide-react";
import type { Creator } from "@/lib/creators";

interface AnalyticsDashboardProps {
  creators: Creator[];
}

function formatNumber(num: number): string {
  if (num >= 1000000)
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

export function AnalyticsDashboard({ creators }: AnalyticsDashboardProps) {
  // Calculate aggregate metrics
  const totalCreators = creators.length;
  const totalReach = creators.reduce(
    (sum, c) => sum + c.metrics.totalReach,
    0
  );
  const totalReferrals = creators.reduce(
    (sum, c) => sum + (c.referralStats?.allTime || 0),
    0
  );
  const weeklyReferrals = creators.reduce(
    (sum, c) => sum + (c.referralStats?.currentWeek || 0),
    0
  );

  // Category distribution
  const categoryDistribution = creators.reduce((acc, creator) => {
    const niche = creator.niche || "Other";
    acc[niche] = (acc[niche] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Top referrers
  const topReferrers = [...creators]
    .sort(
      (a, b) =>
        (b.referralStats?.allTime || 0) - (a.referralStats?.allTime || 0)
    )
    .slice(0, 5);

  // Verified vs non-verified
  const verifiedCount = creators.filter((c) => c.verified).length;
  const verifiedPercentage = totalCreators > 0
    ? Math.round((verifiedCount / totalCreators) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Creators"
          value={formatNumber(totalCreators)}
          subtext="Active on platform"
          icon={Users}
          iconColor="bg-[#DE2010]"
        />
        <MetricCard
          title="Platform Reach"
          value={formatNumber(totalReach)}
          subtext="Combined audience"
          icon={Eye}
          iconColor="bg-[#FFD200]"
        />
        <MetricCard
          title="Weekly Shares"
          value={formatNumber(weeklyReferrals)}
          subtext="This week"
          icon={Share2}
          iconColor="bg-[#319E31]"
        />
        <MetricCard
          title="All-Time Shares"
          value={formatNumber(totalReferrals)}
          subtext="Total referrals"
          icon={TrendingUp}
          iconColor="bg-purple-500"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.05] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-[#DE2010]" />
            <h3 className="text-lg font-semibold text-white">
              Category Distribution
            </h3>
          </div>

          <div className="space-y-4">
            {sortedCategories.map(([category, count], index) => {
              const percentage = Math.round((count / totalCreators) * 100);
              const colors = [
                "bg-[#DE2010]",
                "bg-[#FFD200]",
                "bg-[#319E31]",
                "bg-purple-500",
                "bg-cyan-500",
                "bg-pink-500",
              ];

              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {category}
                    </span>
                    <span className="text-sm text-slate-400">
                      {count} creators ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-2">
                    <div
                      className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verified Status */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#319E31]" />
            <h3 className="text-lg font-semibold text-white">
              Verification Status
            </h3>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-36 h-36">
              {/* Progress ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="#319E31"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(verifiedPercentage / 100) * 377} 377`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {verifiedPercentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#319E31]/10 rounded-lg">
              <span className="text-sm text-[#319E31]">Verified</span>
              <span className="text-sm font-semibold text-white">
                {verifiedCount}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.05] rounded-lg">
              <span className="text-sm text-slate-400">Unverified</span>
              <span className="text-sm font-semibold text-white">
                {totalCreators - verifiedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Referrers Leaderboard */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#FFD200]" />
            <h3 className="text-lg font-semibold text-white">
              Top Referrers (All Time)
            </h3>
          </div>
          <Link
            href="/admin/creators"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {topReferrers.map((creator, index) => (
            <div
              key={creator.slug}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              {/* Rank */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  index === 0
                    ? "bg-gradient-to-br from-[#FFD200] to-amber-500 text-amber-900"
                    : index === 1
                    ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800"
                    : index === 2
                    ? "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {index + 1}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                {creator.profilePicUrl ? (
                  <Image
                    src={creator.profilePicUrl}
                    alt={creator.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#DE2010] to-[#b01a0d] text-white font-bold">
                    {creator.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">
                  {creator.name}
                </h4>
                <p className="text-xs text-slate-500">{creator.niche}</p>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="text-sm font-semibold text-white">
                  {formatNumber(creator.referralStats?.allTime || 0)}
                </div>
                <div className="text-xs text-slate-500">shares</div>
              </div>

              {/* Reach */}
              <div className="text-right hidden sm:block">
                <div className="text-sm text-slate-400">
                  {formatNumber(creator.metrics.totalReach)}
                </div>
                <div className="text-xs text-slate-500">reach</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: any;
  iconColor: string;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">{title}</p>
        <div className={`${iconColor} rounded-lg p-2`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-slate-500">{subtext}</p>
    </div>
  );
}
