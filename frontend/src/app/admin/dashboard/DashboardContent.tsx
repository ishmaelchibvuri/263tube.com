"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Globe,
  Mail,
  Clock,
  RefreshCw,
  BookOpen,
  Loader2,
  BadgeCheck,
  TrendingUp,
  LayoutGrid,
  Database,
  Star,
} from "lucide-react";
import { syncAllCreatorStats, type DashboardStats } from "@/lib/actions/sync-engine";
import { seedCategories } from "@/lib/actions/categories";
import type { CategoryWithStats } from "@/lib/categories-shared";
import { FeaturedCarouselModal } from "@/components/admin/FeaturedCarouselModal";

interface DashboardContentProps {
  stats: DashboardStats;
  categoryStats: CategoryWithStats[];
}

export function DashboardContent({ stats, categoryStats }: DashboardContentProps) {
  const [syncing, setSyncing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [carouselModalOpen, setCarouselModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [seedResult, setSeedResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncAllCreatorStats();
      setSyncResult({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch {
      setSyncResult({
        type: "error",
        message: "Sync failed. Please try again.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);

    try {
      const result = await seedCategories();
      setSeedResult({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch {
      setSeedResult({
        type: "error",
        message: "Seeding failed. Please try again.",
      });
    } finally {
      setSeeding(false);
    }
  };

  const formatReach = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          263Tube platform overview and management
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Creators */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#DE2010]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#DE2010]" />
            </div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Creators
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.totalCreators}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-[#319E31]">
              <BadgeCheck className="w-3.5 h-3.5" />
              {stats.activeCreators} active
            </span>
            {stats.pendingCreators > 0 && (
              <span className="flex items-center gap-1 text-[#FFD200]">
                <Clock className="w-3.5 h-3.5" />
                {stats.pendingCreators} pending
              </span>
            )}
          </div>
        </div>

        {/* Total Platform Reach */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#319E31]/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-[#319E31]" />
            </div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Reach
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatReach(stats.totalPlatformReach)}
          </div>
          <p className="text-sm text-slate-500">
            Combined follower reach
          </p>
        </div>

        {/* Inquiry Volume */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFD200]/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-[#FFD200]" />
            </div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Inquiries
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.totalInquiries}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {stats.pendingInquiries > 0 ? (
              <span className="flex items-center gap-1 text-[#FFD200]">
                <Clock className="w-3.5 h-3.5" />
                {stats.pendingInquiries} pending
              </span>
            ) : (
              <span className="text-slate-500">Business leads generated</span>
            )}
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Queue
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.pendingCreators}
          </div>
          <p className="text-sm text-slate-500">
            Awaiting review
          </p>
        </div>
      </div>

      {/* System Actions & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Actions */}
        <div className="lg:col-span-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#DE2010]" />
            System Actions
          </h2>
          <div className="space-y-3">
            {/* Trigger Global Sync */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#DE2010]/10 border border-[#DE2010]/20 text-[#DE2010] hover:bg-[#DE2010]/20 transition-colors disabled:opacity-50 text-left"
            >
              {syncing ? (
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
              ) : (
                <RefreshCw className="w-5 h-5 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {syncing ? "Syncing..." : "Trigger Global Sync"}
                </p>
                <p className="text-xs text-[#DE2010]/60 mt-0.5">
                  Update all creator stats
                </p>
              </div>
            </button>

            {/* Manage Submissions */}
            <Link
              href="/admin/submissions"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#319E31]/10 border border-[#319E31]/20 text-[#319E31] hover:bg-[#319E31]/20 transition-colors"
            >
              <BookOpen className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Manage Submissions</p>
                <p className="text-xs text-[#319E31]/60 mt-0.5">
                  {stats.pendingCreators} pending approvals
                </p>
              </div>
            </Link>

            {/* View Inquiries */}
            <Link
              href="/admin/inquiries"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFD200]/10 border border-[#FFD200]/20 text-[#FFD200] hover:bg-[#FFD200]/20 transition-colors"
            >
              <Mail className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">View Inquiries</p>
                <p className="text-xs text-[#FFD200]/60 mt-0.5">
                  {stats.pendingInquiries} need attention
                </p>
              </div>
            </Link>

            {/* Manage Creators */}
            <Link
              href="/admin/creators"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-colors"
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Manage Creators</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search, edit & verify
                </p>
              </div>
            </Link>

            {/* Seed Categories */}
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors disabled:opacity-50 text-left"
            >
              {seeding ? (
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
              ) : (
                <Database className="w-5 h-5 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {seeding ? "Seeding..." : "Seed Categories"}
                </p>
                <p className="text-xs text-purple-400/60 mt-0.5">
                  Populate categories from taxonomy
                </p>
              </div>
            </button>

            {/* Featured Carousel */}
            <button
              onClick={() => setCarouselModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFD200]/10 border border-[#FFD200]/20 text-[#FFD200] hover:bg-[#FFD200]/20 transition-colors text-left"
            >
              <Star className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Featured Carousel</p>
                <p className="text-xs text-[#FFD200]/60 mt-0.5">
                  Handpick homepage creators
                </p>
              </div>
            </button>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div
              className={`mt-4 p-3 rounded-xl text-sm ${
                syncResult.type === "success"
                  ? "bg-[#319E31]/10 border border-[#319E31]/20 text-[#319E31]"
                  : "bg-[#DE2010]/10 border border-[#DE2010]/20 text-[#DE2010]"
              }`}
            >
              {syncResult.message}
            </div>
          )}

          {/* Seed Result */}
          {seedResult && (
            <div
              className={`mt-4 p-3 rounded-xl text-sm ${
                seedResult.type === "success"
                  ? "bg-[#319E31]/10 border border-[#319E31]/20 text-[#319E31]"
                  : "bg-[#DE2010]/10 border border-[#DE2010]/20 text-[#DE2010]"
              }`}
            >
              {seedResult.message}
            </div>
          )}
        </div>

        {/* Platform Overview */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">
            Platform Overview
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Active Creators Stat */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#319E31]" />
                <span className="text-sm text-slate-400">Active Creators</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.activeCreators}
              </p>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#FFD200]" />
                <span className="text-sm text-slate-400">
                  Pending Approvals
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.pendingCreators}
              </p>
            </div>

            {/* Total Reach */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#DE2010]" />
                <span className="text-sm text-slate-400">
                  Total Reach
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatReach(stats.totalPlatformReach)}
              </p>
            </div>

            {/* Inquiry Volume */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-sm text-slate-400">
                  Total Inquiries
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.totalInquiries}
              </p>
            </div>
          </div>

          {/* Zimbabwe flag stripe accent */}
          <div className="zim-stripe mt-6 rounded-full" />
        </div>
      </div>

      {/* Categories Breakdown */}
      {categoryStats.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#FFD200]" />
              Categories
            </h2>
            <Link
              href="/admin/creators"
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              View all creators
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {categoryStats
              .filter((cat) => cat.creatorCount > 0)
              .sort((a, b) => b.creatorCount - a.creatorCount)
              .map((cat) => (
                <div
                  key={cat.value}
                  className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4 hover:border-white/[0.1] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{cat.icon || "📁"}</span>
                    <span className="text-sm font-medium text-white truncate">
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {cat.creatorCount}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">creators</p>
                </div>
              ))}
          </div>

          {categoryStats.every((cat) => cat.creatorCount === 0) && (
            <p className="text-sm text-slate-500 text-center py-4">
              No creators assigned to categories yet. Run a global sync to detect categories.
            </p>
          )}
        </div>
      )}

      {/* Featured Carousel Modal */}
      <FeaturedCarouselModal
        open={carouselModalOpen}
        onOpenChange={setCarouselModalOpen}
      />
    </div>
  );
}
