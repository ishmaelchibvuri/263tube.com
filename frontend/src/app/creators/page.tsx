"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  ChevronDown,
  X,
  Users,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { CreatorCard } from "@/components/creators/CreatorCard";

// Mock data - in production, this would come from an API
const ALL_CREATORS = [
  { id: "1", name: "Madam Boss", slug: "madam-boss", profilePicUrl: "/creators/madam-boss.jpg", coverImageUrl: "/creators/madam-boss-cover.jpg", niche: "Comedy", platforms: ["YouTube", "Facebook"], totalReach: 2500000, verified: true },
  { id: "2", name: "Mai Titi", slug: "mai-titi", profilePicUrl: "/creators/mai-titi.jpg", coverImageUrl: "/creators/mai-titi-cover.jpg", niche: "Entertainment", platforms: ["Facebook", "Instagram"], totalReach: 1800000, verified: true },
  { id: "3", name: "Tyra Chikocho", slug: "tyra-chikocho", profilePicUrl: "/creators/tyra.jpg", coverImageUrl: "/creators/tyra-cover.jpg", niche: "Comedy", platforms: ["YouTube", "Instagram"], totalReach: 1200000, verified: true },
  { id: "4", name: "Shadaya Knight", slug: "shadaya-knight", profilePicUrl: "/creators/shadaya.jpg", coverImageUrl: "/creators/shadaya-cover.jpg", niche: "Commentary", platforms: ["X", "YouTube"], totalReach: 850000, verified: false },
  { id: "5", name: "Munya & Tupi", slug: "munya-tupi", profilePicUrl: "/creators/munya-tupi.jpg", coverImageUrl: "/creators/munya-tupi-cover.jpg", niche: "Farming", platforms: ["YouTube"], totalReach: 620000, verified: true },
  { id: "6", name: "Zimbo Kitchen", slug: "zimbo-kitchen", profilePicUrl: "/creators/zimbo-kitchen.jpg", coverImageUrl: "/creators/zimbo-kitchen-cover.jpg", niche: "Cooking", platforms: ["YouTube", "TikTok"], totalReach: 450000, verified: false },
  { id: "7", name: "TechZim", slug: "techzim", profilePicUrl: "/creators/techzim.jpg", coverImageUrl: "/creators/techzim-cover.jpg", niche: "Technology", platforms: ["YouTube", "X"], totalReach: 380000, verified: true },
  { id: "8", name: "Comic Pastor", slug: "comic-pastor", profilePicUrl: "/creators/comic-pastor.jpg", coverImageUrl: "/creators/comic-pastor-cover.jpg", niche: "Comedy", platforms: ["YouTube", "Facebook"], totalReach: 720000, verified: true },
  { id: "9", name: "Zim Diaspora", slug: "zim-diaspora-life", profilePicUrl: "/creators/diaspora.jpg", coverImageUrl: "/creators/diaspora-cover.jpg", niche: "Lifestyle", platforms: ["YouTube", "Instagram"], totalReach: 290000, verified: false },
  { id: "10", name: "Baba Harare", slug: "baba-harare", profilePicUrl: "/creators/baba-harare.jpg", coverImageUrl: "/creators/baba-harare-cover.jpg", niche: "Music", platforms: ["YouTube", "Facebook"], totalReach: 950000, verified: true },
  { id: "11", name: "Jah Prayzah", slug: "jah-prayzah", profilePicUrl: "/creators/jah-prayzah.jpg", coverImageUrl: "/creators/jah-prayzah-cover.jpg", niche: "Music", platforms: ["YouTube", "Instagram", "Facebook"], totalReach: 3200000, verified: true },
  { id: "12", name: "Winky D", slug: "winky-d", profilePicUrl: "/creators/winky-d.jpg", coverImageUrl: "/creators/winky-d-cover.jpg", niche: "Music", platforms: ["YouTube", "Instagram"], totalReach: 2100000, verified: true },
  { id: "13", name: "Zee Nxumalo", slug: "zee-nxumalo", profilePicUrl: "/creators/zee-nxumalo.jpg", coverImageUrl: "/creators/zee-nxumalo-cover.jpg", niche: "Beauty", platforms: ["YouTube", "Instagram", "TikTok"], totalReach: 180000, verified: false },
  { id: "14", name: "African Grey", slug: "african-grey", profilePicUrl: "/creators/african-grey.jpg", coverImageUrl: "/creators/african-grey-cover.jpg", niche: "Comedy", platforms: ["YouTube"], totalReach: 520000, verified: true },
  { id: "15", name: "Zim Fitness", slug: "zim-fitness", profilePicUrl: "/creators/zim-fitness.jpg", coverImageUrl: "/creators/zim-fitness-cover.jpg", niche: "Lifestyle", platforms: ["YouTube", "Instagram", "TikTok"], totalReach: 145000, verified: false },
  { id: "16", name: "Harare Nights", slug: "harare-nights", profilePicUrl: "/creators/harare-nights.jpg", coverImageUrl: "/creators/harare-nights-cover.jpg", niche: "Entertainment", platforms: ["Instagram", "TikTok"], totalReach: 230000, verified: false },
];

const NICHES = ["All", "Comedy", "Music", "Entertainment", "Technology", "Cooking", "Farming", "Lifestyle", "Commentary", "Beauty"];
const PLATFORMS = [
  { name: "All", icon: null },
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

export default function CreatorsPage() {
  const searchParams = useSearchParams();
  const initialNiche = searchParams.get("niche") || "All";
  const initialPlatform = searchParams.get("platform") || "All";
  const initialSort = searchParams.get("sort") || "reach";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState(initialNiche);
  const [selectedPlatform, setSelectedPlatform] = useState(
    initialPlatform.charAt(0).toUpperCase() + initialPlatform.slice(1)
  );
  const [sortBy, setSortBy] = useState(initialSort);
  const [showFilters, setShowFilters] = useState(false);

  const filteredCreators = useMemo(() => {
    let result = [...ALL_CREATORS];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (creator) =>
          creator.name.toLowerCase().includes(query) ||
          creator.niche.toLowerCase().includes(query)
      );
    }

    // Filter by niche
    if (selectedNiche !== "All") {
      result = result.filter((creator) => creator.niche === selectedNiche);
    }

    // Filter by platform
    if (selectedPlatform !== "All") {
      result = result.filter((creator) =>
        creator.platforms.includes(selectedPlatform)
      );
    }

    // Sort
    switch (sortBy) {
      case "reach":
        result.sort((a, b) => b.totalReach - a.totalReach);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "shares":
        result.sort((a, b) => b.totalReach - a.totalReach); // Using reach as proxy
        break;
    }

    return result;
  }, [searchQuery, selectedNiche, selectedPlatform, sortBy]);

  const hasActiveFilters = selectedNiche !== "All" || selectedPlatform !== "All" || searchQuery;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedNiche("All");
    setSelectedPlatform("All");
    setSortBy("reach");
  };

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
              <Link href="/submit" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                Submit Creator
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
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
            Discover <span className="text-gradient-zim">Zim Creators</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Browse {ALL_CREATORS.length}+ Zimbabwean content creators across all platforms
          </p>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="relative px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors"
              />
            </div>
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
                  <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map((niche) => (
                      <button
                        key={niche}
                        onClick={() => setSelectedNiche(niche)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedNiche === niche
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
                  <label className="block text-sm font-medium text-slate-400 mb-2">Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <button
                          key={platform.name}
                          onClick={() => setSelectedPlatform(platform.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                            selectedPlatform === platform.name
                              ? "bg-white/[0.1] text-white border border-white/[0.2]"
                              : "bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1] border border-transparent"
                          }`}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5" style={{ color: selectedPlatform === platform.name ? platform.color : undefined }} />}
                          {platform.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort */}
                <div className="sm:w-48">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-10 px-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-[#DE2010]/50 appearance-none"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[#09090b]">
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
              {searchQuery && (
                <span className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] rounded-lg text-xs text-slate-300">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedNiche !== "All" && (
                <span className="flex items-center gap-1 px-2 py-1 bg-[#DE2010]/10 rounded-lg text-xs text-[#DE2010]">
                  {selectedNiche}
                  <button onClick={() => setSelectedNiche("All")} className="ml-1 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedPlatform !== "All" && (
                <span className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] rounded-lg text-xs text-slate-300">
                  {selectedPlatform}
                  <button onClick={() => setSelectedPlatform("All")} className="ml-1 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-500">
              Showing <span className="text-white font-medium">{filteredCreators.length}</span> creators
            </p>
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      <main className="relative px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {filteredCreators.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredCreators.map((creator) => (
                <CreatorCard
                  key={creator.id}
                  name={creator.name}
                  slug={creator.slug}
                  profilePicUrl={creator.profilePicUrl}
                  coverImageUrl={creator.coverImageUrl}
                  niche={creator.niche}
                  totalReach={creator.totalReach}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.05] flex items-center justify-center">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No creators found</h3>
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
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/submit" className="hover:text-white transition-colors">Submit Creator</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-xs text-slate-600">All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
