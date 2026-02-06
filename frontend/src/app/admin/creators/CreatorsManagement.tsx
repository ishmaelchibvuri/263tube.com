"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Users,
  BadgeCheck,
  Globe,
  ExternalLink,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { toggleCreatorVerified } from "@/lib/actions/sync-engine";
import type { Creator } from "@/lib/creators";

interface CreatorsManagementProps {
  creators: Creator[];
}

export function CreatorsManagement({ creators }: CreatorsManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [localCreators, setLocalCreators] = useState(creators);
  const [actionResult, setActionResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Get unique niches for filter
  const allNiches = Array.from(
    new Set(localCreators.map((c) => c.niche).filter(Boolean))
  ).sort();

  // Filter creators
  const filteredCreators = localCreators.filter((creator) => {
    const matchesSearch =
      searchTerm === "" ||
      creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.tags?.some((t) =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesNiche =
      nicheFilter === "all" || creator.niche === nicheFilter;

    const matchesVerified =
      verifiedFilter === "all" ||
      (verifiedFilter === "verified" && creator.verified) ||
      (verifiedFilter === "unverified" && !creator.verified);

    return matchesSearch && matchesNiche && matchesVerified;
  });

  const handleToggleVerified = async (slug: string, currentVerified: boolean) => {
    setTogglingSlug(slug);
    setActionResult(null);

    try {
      const result = await toggleCreatorVerified(slug, !currentVerified);
      if (result.success) {
        setLocalCreators((prev) =>
          prev.map((c) =>
            c.slug === slug ? { ...c, verified: !currentVerified } : c
          )
        );
        setActionResult({ type: "success", message: result.message });
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "Failed to update verification status.",
      });
    } finally {
      setTogglingSlug(null);
    }
  };

  const formatReach = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#DE2010]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#DE2010]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Manage Creators</h1>
          </div>
          <p className="text-slate-400">
            Search, filter, and manage all registered creators
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-white/[0.05] text-sm text-slate-400">
          {localCreators.length} total
        </span>
      </div>

      {/* Action Result */}
      {actionResult && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            actionResult.type === "success"
              ? "bg-[#319E31]/10 border-[#319E31]/20 text-[#319E31]"
              : "bg-[#DE2010]/10 border-[#DE2010]/20 text-[#DE2010]"
          }`}
        >
          {actionResult.message}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, slug, or niche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-[#DE2010]/40 focus:ring-1 focus:ring-[#DE2010]/20 text-sm"
            />
          </div>

          {/* Niche Filter */}
          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DE2010]/40 appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#0f0f12]">
              All Niches
            </option>
            {allNiches.map((niche) => (
              <option key={niche} value={niche} className="bg-[#0f0f12]">
                {niche.charAt(0).toUpperCase() + niche.slice(1)}
              </option>
            ))}
          </select>

          {/* Verified Filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DE2010]/40 appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#0f0f12]">
              All Status
            </option>
            <option value="verified" className="bg-[#0f0f12]">
              Verified
            </option>
            <option value="unverified" className="bg-[#0f0f12]">
              Unverified
            </option>
          </select>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Showing {filteredCreators.length} of {localCreators.length} creators
        </p>
      </div>

      {/* Creators Table */}
      {filteredCreators.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.05] flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No creators found
          </h3>
          <p className="text-slate-400 text-sm">
            {searchTerm || nicheFilter !== "all" || verifiedFilter !== "all"
              ? "Try adjusting your search or filters."
              : "No creators have been approved yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCreators.map((creator) => {
            const isToggling = togglingSlug === creator.slug;

            return (
              <div
                key={creator.slug}
                className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 hover:border-white/[0.1] transition-colors"
              >
                <div className="flex items-center justify-between">
                  {/* Creator Info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Avatar */}
                    {creator.profilePicUrl ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                        <Image
                          src={creator.profilePicUrl}
                          alt={creator.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-white">
                          {creator.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Name & Meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold truncate">
                          {creator.name}
                        </h3>
                        {creator.verified && (
                          <BadgeCheck className="w-4 h-4 text-[#319E31] flex-shrink-0" />
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            creator.status === "FEATURED"
                              ? "bg-[#FFD200]/10 text-[#FFD200]"
                              : "bg-[#319E31]/10 text-[#319E31]"
                          }`}
                        >
                          {creator.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500">
                          @{creator.slug}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-xs text-slate-400">
                          {creator.niche}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                          <Globe className="w-3 h-3" />
                          {formatReach(creator.metrics.totalReach)} reach
                        </span>
                        <span className="text-slate-600 text-xs hidden md:inline">
                          Joined {formatDate(creator.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {/* View Profile Link */}
                    <a
                      href={`/creator/${creator.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>

                    {/* Manual Verification Override Toggle */}
                    <button
                      onClick={() =>
                        handleToggleVerified(creator.slug, creator.verified)
                      }
                      disabled={isToggling}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                        creator.verified
                          ? "bg-[#319E31]/10 text-[#319E31] border border-[#319E31]/20 hover:bg-[#319E31]/20"
                          : "bg-white/[0.05] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : creator.verified ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldOff className="w-3.5 h-3.5" />
                      )}
                      {creator.verified ? "Verified" : "Unverified"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
