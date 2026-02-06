"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { CreatorCard } from "./CreatorCard";
import {
  CreatorsSearchFilters,
  FilterState,
} from "./CreatorsSearchFilters";
import type { Creator } from "@/lib/creators";

interface CreatorsGridProps {
  creators: Creator[];
}

// Map Creator platforms object to array of platform names
function getCreatorPlatforms(creator: Creator): string[] {
  const platforms: string[] = [];
  if (creator.platforms.youtube?.length) platforms.push("YouTube");
  if (creator.platforms.instagram?.length) platforms.push("Instagram");
  if (creator.platforms.twitter?.length) platforms.push("X");
  if (creator.platforms.facebook?.length) platforms.push("Facebook");
  if (creator.platforms.tiktok?.length) platforms.push("TikTok");
  return platforms;
}

export function CreatorsGrid({ creators }: CreatorsGridProps) {
  const searchParams = useSearchParams();

  // Initial filters from URL params
  const platformParam = searchParams.get("platform");
  const PLATFORM_NAMES = ["YouTube", "TikTok", "Instagram", "Facebook", "X"];
  const matchedPlatform = platformParam
    ? PLATFORM_NAMES.find((p) => p.toLowerCase() === platformParam.toLowerCase()) || "All"
    : "All";
  const initialFilters: Partial<FilterState> = {
    searchQuery: searchParams.get("search") || "",
    selectedNiche: searchParams.get("niche") || "All",
    selectedPlatform: matchedPlatform,
    sortBy: searchParams.get("sort") || "reach",
  };

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: initialFilters.searchQuery || "",
    selectedNiche: initialFilters.selectedNiche || "All",
    selectedPlatform: initialFilters.selectedPlatform || "All",
    sortBy: initialFilters.sortBy || "reach",
  });

  const filteredCreators = useMemo(() => {
    let result = [...creators];

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (creator) =>
          creator.name.toLowerCase().includes(query) ||
          creator.niche.toLowerCase().includes(query) ||
          creator.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by niche
    if (filters.selectedNiche !== "All") {
      result = result.filter((creator) => creator.niche === filters.selectedNiche);
    }

    // Filter by platform
    if (filters.selectedPlatform !== "All") {
      result = result.filter((creator) => {
        const platforms = getCreatorPlatforms(creator);
        return platforms.includes(filters.selectedPlatform);
      });
    }

    // Sort
    switch (filters.sortBy) {
      case "reach":
        result.sort((a, b) => b.metrics.totalReach - a.metrics.totalReach);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "shares":
        result.sort(
          (a, b) =>
            (b.referralStats?.currentWeek || 0) -
            (a.referralStats?.currentWeek || 0)
        );
        break;
    }

    return result;
  }, [creators, filters]);

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      selectedNiche: "All",
      selectedPlatform: "All",
      sortBy: "reach",
    });
  };

  return (
    <>
      <CreatorsSearchFilters
        initialFilters={initialFilters}
        onFilterChange={setFilters}
        totalCount={creators.length}
        filteredCount={filteredCreators.length}
      />

      <main className="relative px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {filteredCreators.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredCreators.map((creator) => (
                <CreatorCard
                  key={creator.slug}
                  name={creator.name}
                  slug={creator.slug}
                  profilePicUrl={creator.profilePicUrl || ""}
                  coverImageUrl={creator.coverImageUrl || creator.bannerUrl || ""}
                  niche={creator.niche}
                  totalReach={creator.metrics.totalReach}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.05] flex items-center justify-center">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No creators found
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-[#DE2010] text-white text-sm font-medium rounded-lg hover:bg-[#ff2a17] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
