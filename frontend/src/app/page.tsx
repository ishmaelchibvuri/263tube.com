"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Play,
  TrendingUp,
  Users,
  Youtube,
  Sparkles,
  ChevronRight,
  Filter,
  MapPin,
  Flame,
  Crown,
} from "lucide-react";
import { CreatorCard } from "@/components/creators";
import { type Creator } from "@/lib/creators";

// Mock data for featured creators (fallback when API is unavailable)
const MOCK_CREATORS = [
  {
    id: "1",
    name: "Tyra Chikocho",
    slug: "tyra-chikocho",
    profilePicUrl: "/creators/tyra.jpg",
    coverImageUrl: "/creators/tyra-cover.jpg",
    niche: "Comedy",
    totalReach: 2500000,
    referralStats: { currentWeek: 45, allTime: 1200 },
  },
  {
    id: "2",
    name: "Shadaya Knight",
    slug: "shadaya-knight",
    profilePicUrl: "/creators/shadaya.jpg",
    coverImageUrl: "/creators/shadaya-cover.jpg",
    niche: "Commentary",
    totalReach: 1800000,
    referralStats: { currentWeek: 32, allTime: 890 },
  },
  {
    id: "3",
    name: "Munya & Tupi",
    slug: "munya-tupi",
    profilePicUrl: "/creators/munya-tupi.jpg",
    coverImageUrl: "/creators/munya-tupi-cover.jpg",
    niche: "Farming",
    totalReach: 950000,
    referralStats: { currentWeek: 28, allTime: 650 },
  },
  {
    id: "4",
    name: "Mai Titi",
    slug: "mai-titi",
    profilePicUrl: "/creators/mai-titi.jpg",
    coverImageUrl: "/creators/mai-titi-cover.jpg",
    niche: "Entertainment",
    totalReach: 3200000,
    referralStats: { currentWeek: 65, allTime: 2100 },
  },
  {
    id: "5",
    name: "Madam Boss",
    slug: "madam-boss",
    profilePicUrl: "/creators/madam-boss.jpg",
    coverImageUrl: "/creators/madam-boss-cover.jpg",
    niche: "Comedy",
    totalReach: 4500000,
    referralStats: { currentWeek: 120, allTime: 5600 },
  },
  {
    id: "6",
    name: "Zimbo Kitchen",
    slug: "zimbo-kitchen",
    profilePicUrl: "/creators/zimbo-kitchen.jpg",
    coverImageUrl: "/creators/zimbo-kitchen-cover.jpg",
    niche: "Cooking",
    totalReach: 780000,
    referralStats: { currentWeek: 15, allTime: 320 },
  },
  {
    id: "7",
    name: "TechZim",
    slug: "techzim",
    profilePicUrl: "/creators/techzim.jpg",
    coverImageUrl: "/creators/techzim-cover.jpg",
    niche: "Technology",
    totalReach: 520000,
    referralStats: { currentWeek: 22, allTime: 480 },
  },
  {
    id: "8",
    name: "Zim Diaspora Life",
    slug: "zim-diaspora-life",
    profilePicUrl: "/creators/diaspora.jpg",
    coverImageUrl: "/creators/diaspora-cover.jpg",
    niche: "Lifestyle",
    totalReach: 340000,
    referralStats: { currentWeek: 18, allTime: 290 },
  },
];

const NICHES = [
  "All",
  "Comedy",
  "Music",
  "Farming",
  "Technology",
  "Cooking",
  "Entertainment",
  "Commentary",
  "Lifestyle",
  "Education",
];

// Trending Creator Card for the hero section
function TrendingCreatorCard({
  creator,
  rank,
}: {
  creator: (typeof MOCK_CREATORS)[0];
  rank: number;
}) {
  const rankColors = {
    1: "from-yellow-500 to-amber-600",
    2: "from-slate-400 to-slate-500",
    3: "from-orange-600 to-orange-700",
  };

  const rankIcons = {
    1: <Crown className="w-4 h-4" />,
    2: null,
    3: null,
  };

  return (
    <Link
      href={`/creator/${creator.slug}`}
      className="group flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-secondary transition-all"
    >
      {/* Rank Badge */}
      <div
        className={`w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br ${
          rankColors[rank as keyof typeof rankColors]
        } text-white font-bold text-sm`}
      >
        {rankIcons[rank as keyof typeof rankIcons] || rank}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
        {creator.profilePicUrl ? (
          <Image
            src={creator.profilePicUrl}
            alt={creator.name}
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary font-bold">
            {creator.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
          {creator.name}
        </h4>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Flame className="w-3 h-3 text-orange-500" />
          <span>{creator.referralStats.currentWeek} visits this week</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("All");
  const [trendingCreators, setTrendingCreators] = useState(
    MOCK_CREATORS.slice(0, 3).sort(
      (a, b) => b.referralStats.currentWeek - a.referralStats.currentWeek
    )
  );
  const [allCreators, setAllCreators] = useState(MOCK_CREATORS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch trending creators from API
  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch("/api/referrals?limit=3");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            setTrendingCreators(
              data.data.map((c: Creator, i: number) => ({
                ...c,
                id: c.slug,
                totalReach: c.metrics?.totalReach || 0,
                referralStats: c.referralStats || { currentWeek: 0, allTime: 0 },
              }))
            );
          }
        }
      } catch (error) {
        console.warn("Failed to fetch trending creators:", error);
      }
    }

    async function fetchAllCreators() {
      try {
        const response = await fetch("/api/creators");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            setAllCreators(
              data.data.map((c: Creator) => ({
                ...c,
                id: c.slug,
                totalReach: c.metrics?.totalReach || 0,
                referralStats: c.referralStats || { currentWeek: 0, allTime: 0 },
              }))
            );
          }
        }
      } catch (error) {
        console.warn("Failed to fetch creators:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrending();
    fetchAllCreators();
  }, []);

  const filteredCreators = allCreators.filter((creator) => {
    const matchesSearch =
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.niche.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche =
      selectedNiche === "All" || creator.niche === selectedNiche;
    return matchesSearch && matchesNiche;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold text-gradient-orange">
              263Tube
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/submit"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Submit Creator
            </Link>
            <Link href="/login" className="btn-secondary text-sm">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Trending This Week */}
      <section className="pt-32 pb-16 px-4 hero-gradient">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Left: Main Hero Content */}
            <div className="lg:col-span-3 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  Proudly Zimbabwean
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Discover{" "}
                <span className="text-gradient-orange">Zim Talent</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
                The ultimate directory for Zimbabwean content creators. Find
                YouTubers, influencers, and digital creators shaping our culture.
              </p>

              {/* Search Bar */}
              <div className="search-bar mb-6 max-w-xl mx-auto lg:mx-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search creators by name or niche..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                    <Search className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>
                    <strong className="text-foreground">500+</strong> Creators
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>
                    <strong className="text-foreground">50M+</strong> Reach
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Trending This Week */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">
                      Trending This Week
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Top traffic drivers
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {trendingCreators.map((creator, index) => (
                    <TrendingCreatorCard
                      key={creator.id || creator.slug}
                      creator={creator}
                      rank={index + 1}
                    />
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Share your favorite creator's profile to help them trend!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Niche Filter */}
      <section className="py-6 px-4 border-b border-border bg-secondary/30">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
            <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            {NICHES.map((niche) => (
              <button
                key={niche}
                onClick={() => setSelectedNiche(niche)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedNiche === niche
                    ? "bg-primary text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                {niche}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Creators Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Featured Creators
              </h2>
              <p className="text-muted-foreground mt-1">
                {filteredCreators.length} creators found
              </p>
            </div>
            <Link
              href="/creators"
              className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border animate-pulse"
                >
                  <div className="h-32 bg-secondary rounded-t-xl" />
                  <div className="p-4 pt-12 text-center">
                    <div className="h-4 bg-secondary rounded w-2/3 mx-auto mb-2" />
                    <div className="h-3 bg-secondary rounded w-1/3 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCreators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCreators.map((creator) => (
                <CreatorCard
                  key={creator.id || creator.slug}
                  name={creator.name}
                  slug={creator.slug}
                  profilePicUrl={creator.profilePicUrl || ""}
                  coverImageUrl={creator.coverImageUrl}
                  niche={creator.niche}
                  totalReach={creator.totalReach}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No creators found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 via-background to-primary/10 border-y border-border">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Are you a Zimbabwean Creator?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get featured in the largest directory of Zim talent. Increase your
            visibility and connect with brands looking for authentic voices.
          </p>
          <Link href="/submit" className="btn-primary text-lg px-8 py-4">
            <Sparkles className="w-5 h-5 mr-2" />
            Submit Your Profile
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-secondary/50 border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="text-xl font-bold text-gradient-orange">
                  263Tube
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                The IMDb for Zimbabwean Content Creators. Discover, connect, and
                celebrate Zim talent.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Explore</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/creators" className="hover:text-primary transition-colors">
                    All Creators
                  </Link>
                </li>
                <li>
                  <Link href="/niches" className="hover:text-primary transition-colors">
                    Browse by Niche
                  </Link>
                </li>
                <li>
                  <Link href="/trending" className="hover:text-primary transition-colors">
                    Trending
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">For Creators</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/submit" className="hover:text-primary transition-colors">
                    Submit Profile
                  </Link>
                </li>
                <li>
                  <Link href="/claim" className="hover:text-primary transition-colors">
                    Claim Your Page
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2025 263Tube. Made with love in Zimbabwe.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
