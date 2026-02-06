"use client";

import { useState } from "react";
import {
  X,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  SlidersHorizontal,
} from "lucide-react";
import { CreatorSearchAutocomplete } from "./CreatorSearchAutocomplete";

const NICHES = [
  "All",
  "Comedy",
  "Music",
  "Entertainment",
  "Technology",
  "Cooking",
  "Farming",
  "Lifestyle",
  "Commentary",
  "Beauty",
];

const PLATFORMS = [
  { name: "All", icon: null, color: "" },
  { name: "YouTube", icon: Youtube, color: "#FF0000" },
  { name: "TikTok", icon: Music2, color: "#00F2EA" },
  { name: "Instagram", icon: Instagram, color: "#E4405F" },
  { name: "Facebook", icon: Facebook, color: "#1877F2" },
  { name: "X", icon: Twitter, color: "#1DA1F2" },
];

const SORT_OPTIONS = [
  { value: "reach", label: "Most Popular" },
  { value: "name", label: "Name (A-Z)" },
  { value: "shares", label: "Most Shared" },
];

export interface FilterState {
  searchQuery: string;
  selectedNiche: string;
  selectedPlatform: string;
  sortBy: string;
}

interface CreatorsSearchFiltersProps {
  initialFilters?: Partial<FilterState>;
  onFilterChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export function CreatorsSearchFilters({
  initialFilters = {},
  onFilterChange,
  totalCount,
  filteredCount,
}: CreatorsSearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: initialFilters.searchQuery || "",
    selectedNiche: initialFilters.selectedNiche || "All",
    selectedPlatform: initialFilters.selectedPlatform || "All",
    sortBy: initialFilters.sortBy || "reach",
  });

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      searchQuery: "",
      selectedNiche: "All",
      selectedPlatform: "All",
      sortBy: "reach",
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters =
    filters.selectedNiche !== "All" ||
    filters.selectedPlatform !== "All" ||
    filters.searchQuery !== "";

  return (
    <div className="relative px-4 sm:px-6 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <CreatorSearchAutocomplete
            value={filters.searchQuery}
            onChange={(val) => updateFilter("searchQuery", val)}
            placeholder="Search creators..."
            showIcon={true}
            navigateOnSelect={true}
            className="flex-1"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 h-12 px-4 rounded-xl border transition-all ${
              showFilters || hasActiveFilters
                ? "bg-[#DE2010]/10 border-[#DE2010]/30 text-[#DE2010]"
                : "bg-white/[0.05] border-white/[0.1] text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#DE2010]" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 sm:p-6 mb-4 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Niche Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((niche) => (
                    <button
                      key={niche}
                      onClick={() => updateFilter("selectedNiche", niche)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        filters.selectedNiche === niche
                          ? "bg-[#DE2010] text-white"
                          : "bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1]"
                      }`}
                    >
                      {niche}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <button
                        key={platform.name}
                        onClick={() =>
                          updateFilter("selectedPlatform", platform.name)
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                          filters.selectedPlatform === platform.name
                            ? "bg-white/[0.1] text-white border border-white/[0.2]"
                            : "bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1] border border-transparent"
                        }`}
                      >
                        {Icon && (
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{
                              color:
                                filters.selectedPlatform === platform.name
                                  ? platform.color
                                  : undefined,
                            }}
                          />
                        )}
                        {platform.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter("sortBy", e.target.value)}
                  className="w-full h-10 px-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-[#DE2010]/50 appearance-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#09090b]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-white/[0.05]">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-slate-500">Filters:</span>
            {filters.searchQuery && (
              <span className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] rounded-lg text-xs text-slate-300">
                &quot;{filters.searchQuery}&quot;
                <button
                  onClick={() => updateFilter("searchQuery", "")}
                  className="ml-1 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.selectedNiche !== "All" && (
              <span className="flex items-center gap-1 px-2 py-1 bg-[#DE2010]/10 rounded-lg text-xs text-[#DE2010]">
                {filters.selectedNiche}
                <button
                  onClick={() => updateFilter("selectedNiche", "All")}
                  className="ml-1 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.selectedPlatform !== "All" && (
              <span className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] rounded-lg text-xs text-slate-300">
                {filters.selectedPlatform}
                <button
                  onClick={() => updateFilter("selectedPlatform", "All")}
                  className="ml-1 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            Showing <span className="text-white font-medium">{filteredCount}</span>{" "}
            of {totalCount} creators
          </p>
        </div>
      </div>
    </div>
  );
}
