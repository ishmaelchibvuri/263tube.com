"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Users,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Flame,
  ArrowRight,
  Eye,
  Heart,
  MapPin,
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Music2,
} from "lucide-react";
import { type Creator } from "@/lib/creators";

// Mock data
// Top 10 Most Shared This Week (for scrolling carousel)
const FEATURED_CREATORS = [
  { id: "1", name: "Madam Boss", slug: "madam-boss", profilePicUrl: "/creators/madam-boss.jpg", coverImageUrl: "/creators/madam-boss-cover.jpg", niche: "Comedy", sharesThisWeek: 2840, verified: true },
  { id: "2", name: "Mai Titi", slug: "mai-titi", profilePicUrl: "/creators/mai-titi.jpg", coverImageUrl: "/creators/mai-titi-cover.jpg", niche: "Entertainment", sharesThisWeek: 2156, verified: true },
  { id: "3", name: "Tyra Chikocho", slug: "tyra-chikocho", profilePicUrl: "/creators/tyra.jpg", coverImageUrl: "/creators/tyra-cover.jpg", niche: "Comedy", sharesThisWeek: 1890, verified: true },
  { id: "4", name: "Shadaya Knight", slug: "shadaya-knight", profilePicUrl: "/creators/shadaya.jpg", coverImageUrl: "/creators/shadaya-cover.jpg", niche: "Commentary", sharesThisWeek: 1654, verified: false },
  { id: "5", name: "Munya & Tupi", slug: "munya-tupi", profilePicUrl: "/creators/munya-tupi.jpg", coverImageUrl: "/creators/munya-tupi-cover.jpg", niche: "Farming", sharesThisWeek: 1432, verified: true },
  { id: "6", name: "Zimbo Kitchen", slug: "zimbo-kitchen", profilePicUrl: "/creators/zimbo-kitchen.jpg", coverImageUrl: "/creators/zimbo-kitchen-cover.jpg", niche: "Cooking", sharesThisWeek: 1287, verified: false },
  { id: "7", name: "TechZim", slug: "techzim", profilePicUrl: "/creators/techzim.jpg", coverImageUrl: "/creators/techzim-cover.jpg", niche: "Technology", sharesThisWeek: 1098, verified: true },
  { id: "8", name: "Comic Pastor", slug: "comic-pastor", profilePicUrl: "/creators/comic-pastor.jpg", coverImageUrl: "/creators/comic-pastor-cover.jpg", niche: "Comedy", sharesThisWeek: 987, verified: true },
  { id: "9", name: "Zim Diaspora", slug: "zim-diaspora-life", profilePicUrl: "/creators/diaspora.jpg", coverImageUrl: "/creators/diaspora-cover.jpg", niche: "Lifestyle", sharesThisWeek: 876, verified: false },
  { id: "10", name: "Baba Harare", slug: "baba-harare", profilePicUrl: "/creators/baba-harare.jpg", coverImageUrl: "/creators/baba-harare-cover.jpg", niche: "Music", sharesThisWeek: 754, verified: true },
];

const TRENDING_CREATORS = [
  { id: "5", name: "Munya & Tupi", slug: "munya-tupi", profilePicUrl: "/creators/munya-tupi.jpg", niche: "Farming", weeklyViews: 45000, change: "+23%" },
  { id: "6", name: "Zimbo Kitchen", slug: "zimbo-kitchen", profilePicUrl: "/creators/zimbo-kitchen.jpg", niche: "Cooking", weeklyViews: 32000, change: "+18%" },
  { id: "7", name: "TechZim", slug: "techzim", profilePicUrl: "/creators/techzim.jpg", niche: "Technology", weeklyViews: 28000, change: "+15%" },
  { id: "8", name: "Zim Diaspora", slug: "zim-diaspora-life", profilePicUrl: "/creators/diaspora.jpg", niche: "Lifestyle", weeklyViews: 21000, change: "+12%" },
];

const CATEGORIES = [
  { name: "Comedy", icon: "😂", count: 120, color: "from-[#DE2010] to-[#b01a0d]" },
  { name: "Music", icon: "🎵", count: 85, color: "from-purple-500 to-pink-500" },
  { name: "Tech", icon: "💻", count: 45, color: "from-cyan-500 to-blue-500" },
  { name: "Cooking", icon: "🍳", count: 62, color: "from-[#319E31] to-emerald-600" },
  { name: "Farming", icon: "🌾", count: 38, color: "from-[#FFD200] to-amber-500" },
  { name: "Lifestyle", icon: "✨", count: 94, color: "from-pink-500 to-rose-500" },
];

const SEARCH_SUGGESTIONS = ["Madam Boss", "Comedy creators", "Tech reviews", "Cooking shows", "Music artists"];

// Platforms for quick browse
const PLATFORMS = [
  { name: "YouTube", icon: Youtube, color: "#FF0000", bgColor: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20", count: 320 },
  { name: "TikTok", icon: Music2, color: "#00F2EA", bgColor: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20", count: 180 },
  { name: "Instagram", icon: Instagram, color: "#E4405F", bgColor: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20", count: 245 },
  { name: "Facebook", icon: Facebook, color: "#1877F2", bgColor: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20", count: 156 },
  { name: "X", icon: Twitter, color: "#1DA1F2", bgColor: "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20", count: 98 },
];

// Quick browse creators (visible on landing without scrolling much)
const QUICK_BROWSE_CREATORS = [
  { id: "q1", name: "Madam Boss", slug: "madam-boss", profilePicUrl: "/creators/madam-boss.jpg", platform: "YouTube", niche: "Comedy" },
  { id: "q2", name: "Mai Titi", slug: "mai-titi", profilePicUrl: "/creators/mai-titi.jpg", platform: "Facebook", niche: "Entertainment" },
  { id: "q3", name: "Tyra Chikocho", slug: "tyra-chikocho", profilePicUrl: "/creators/tyra.jpg", platform: "Instagram", niche: "Comedy" },
  { id: "q4", name: "Shadaya Knight", slug: "shadaya-knight", profilePicUrl: "/creators/shadaya.jpg", platform: "X", niche: "Commentary" },
  { id: "q5", name: "Munya & Tupi", slug: "munya-tupi", profilePicUrl: "/creators/munya-tupi.jpg", platform: "YouTube", niche: "Farming" },
  { id: "q6", name: "Zimbo Kitchen", slug: "zimbo-kitchen", profilePicUrl: "/creators/zimbo-kitchen.jpg", platform: "TikTok", niche: "Cooking" },
  { id: "q7", name: "TechZim", slug: "techzim", profilePicUrl: "/creators/techzim.jpg", platform: "YouTube", niche: "Technology" },
  { id: "q8", name: "Zim Diaspora", slug: "zim-diaspora-life", profilePicUrl: "/creators/diaspora.jpg", platform: "Instagram", niche: "Lifestyle" },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

// Quick Browse Creator Avatar - Mobile optimized
function CreatorAvatar({ creator }: { creator: typeof QUICK_BROWSE_CREATORS[0] }) {
  return (
    <Link
      href={`/creator/${creator.slug}`}
      className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.05] transition-all"
    >
      <div className="relative">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-[#DE2010]/50 transition-colors">
          {creator.profilePicUrl ? (
            <Image src={creator.profilePicUrl} alt={creator.name} width={64} height={64} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center text-white text-lg font-bold">
              {creator.name.charAt(0)}
            </div>
          )}
        </div>
        {/* Platform badge */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#09090b] border-2 border-white/10 flex items-center justify-center">
          {creator.platform === "YouTube" && <Youtube className="w-2.5 h-2.5 text-red-500" />}
          {creator.platform === "TikTok" && <Music2 className="w-2.5 h-2.5 text-cyan-400" />}
          {creator.platform === "Instagram" && <Instagram className="w-2.5 h-2.5 text-pink-500" />}
          {creator.platform === "Facebook" && <Facebook className="w-2.5 h-2.5 text-blue-500" />}
          {creator.platform === "X" && <Twitter className="w-2.5 h-2.5 text-sky-500" />}
        </div>
      </div>
      <span className="text-[10px] sm:text-xs text-slate-400 group-hover:text-white transition-colors text-center truncate w-14 sm:w-16">
        {creator.name.split(' ')[0]}
      </span>
    </Link>
  );
}

// Featured Creator Card - Mobile optimized horizontal scroll
function FeaturedCard({ creator, rank }: { creator: typeof FEATURED_CREATORS[0]; rank: number }) {
  return (
    <Link
      href={`/creator/${creator.slug}`}
      className="group relative flex-shrink-0 w-[200px] sm:w-[260px] rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.05] hover:border-[#DE2010]/30 transition-all duration-300"
    >
      {/* Cover Image */}
      <div className="relative h-24 sm:h-32 overflow-hidden">
        {creator.coverImageUrl ? (
          <Image src={creator.coverImageUrl} alt={creator.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#DE2010]/30 via-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />

        {/* Rank Badge */}
        <div className={`absolute top-2 left-2 w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-xs font-bold ${
          rank === 1 ? "bg-gradient-to-br from-[#FFD200] to-amber-500 text-amber-900" :
          rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800" :
          rank === 3 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900" :
          "bg-white/20 backdrop-blur-sm text-white"
        }`}>
          {rank}
        </div>

        {/* Verified Badge */}
        {creator.verified && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-[#319E31]/30 backdrop-blur-md rounded-full flex items-center justify-center">
            <span className="text-[10px] text-[#319E31]">✓</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
            {creator.profilePicUrl ? (
              <Image src={creator.profilePicUrl} alt={creator.name} width={40} height={40} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center text-white text-sm font-bold">
                {creator.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#FFD200] transition-colors">
              {creator.name}
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500">{creator.niche}</p>
          </div>
        </div>

        {/* Shares This Week */}
        <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-[10px] sm:text-xs text-slate-500">Shares</span>
          <span className="text-xs sm:text-sm font-bold text-[#DE2010]">{formatNumber(creator.sharesThisWeek)}</span>
        </div>
      </div>
    </Link>
  );
}

// Trending Row Item - Mobile optimized
function TrendingItem({ creator, rank }: { creator: typeof TRENDING_CREATORS[0]; rank: number }) {
  return (
    <Link
      href={`/creator/${creator.slug}`}
      className="group flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-[#DE2010]/30 transition-all duration-300"
    >
      {/* Rank */}
      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        rank === 1 ? "bg-gradient-to-br from-[#FFD200] to-amber-500 text-amber-900" :
        rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800" :
        rank === 3 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900" :
        "bg-white/10 text-white/60"
      }`}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex-shrink-0">
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
        <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#FFD200] transition-colors">{creator.name}</h4>
        <p className="text-[10px] sm:text-xs text-slate-500">{creator.niche}</p>
      </div>

      {/* Stats */}
      <div className="text-right flex-shrink-0">
        <div className="text-xs sm:text-sm font-medium text-white">{formatNumber(creator.weeklyViews)}</div>
        <div className="text-[10px] sm:text-xs text-[#319E31] font-medium">{creator.change}</div>
      </div>
    </Link>
  );
}

// Category Card - Mobile optimized
function CategoryCard({ category }: { category: typeof CATEGORIES[0] }) {
  return (
    <Link
      href={`/creators?niche=${category.name}`}
      className="group relative p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300 overflow-hidden"
    >
      {/* Gradient Background on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

      <div className="relative text-center sm:text-left">
        <span className="text-2xl sm:text-3xl mb-1 sm:mb-2 block">{category.icon}</span>
        <h3 className="text-xs sm:text-sm font-semibold text-white">{category.name}</h3>
        <p className="text-[10px] sm:text-xs text-slate-500">{category.count}</p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient Background - Smaller on mobile */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#DE2010]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#319E31]/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      {/* Navigation - Mobile optimized */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isLoaded ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2 sm:py-4">
          <div className="flex items-center justify-between bg-black/60 backdrop-blur-xl rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2 sm:py-3 border border-white/[0.05]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden">
                <Image src="/images/logo.png" alt="263Tube" width={40} height={40} className="w-full h-full object-contain" />
              </div>
              <span className="text-base sm:text-xl font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </Link>

            {/* Nav Links - Desktop only */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/creators" className="text-sm text-slate-400 hover:text-white transition-colors">Discover</Link>
              <Link href="/trending" className="text-sm text-slate-400 hover:text-white transition-colors">Trending</Link>
              <Link href="/categories" className="text-sm text-slate-400 hover:text-white transition-colors">Categories</Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href="/submit" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                <Sparkles className="w-4 h-4" />
                Submit
              </Link>
              <Link href="/login" className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium bg-[#DE2010] text-white rounded-lg sm:rounded-xl hover:bg-[#ff2a17] transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Mobile optimized */}
      <section className="relative pt-16 sm:pt-20 pb-6 px-4 sm:px-6">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          {/* Spacer */}
          <div className="h-8 sm:h-16" />

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white leading-[1] tracking-tight mb-3 sm:mb-4">
            Discover
            <br />
            <span className="text-gradient-zim">
              Zim Creators
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-400 max-w-md sm:max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
            Find YouTubers, influencers, and creators shaping African culture.
          </p>

          {/* Search - Mobile optimized */}
          <div className="relative max-w-md sm:max-w-2xl mx-auto mb-4 sm:mb-6">
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-[#319E31] via-[#FFD200] to-[#DE2010] rounded-xl blur-md transition-opacity duration-300 ${searchFocused ? "opacity-40" : "opacity-0"}`} />
            <div className="relative flex items-center bg-white/[0.05] backdrop-blur-sm rounded-xl border border-white/[0.1] overflow-hidden">
              <Search className="w-4 h-4 text-slate-500 ml-3 sm:ml-4 flex-shrink-0" />
              <input
                type="text"
                placeholder={`"${SEARCH_SUGGESTIONS[currentSuggestion]}"`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 h-12 sm:h-14 px-2 sm:px-3 bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm sm:text-base"
              />
              <button className="m-1.5 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] rounded-lg text-white text-sm font-semibold hover:from-[#ff2a17] hover:to-[#DE2010] transition-all">
                Search
              </button>
            </div>
          </div>

          {/* Browse by Platform - Horizontal scroll on mobile */}
          <div className="mb-4 sm:mb-6">
            <p className="text-xs text-slate-500 mb-2 sm:mb-3">Browse by platform</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1 justify-start sm:justify-center sm:flex-wrap">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <Link
                    key={platform.name}
                    href={`/creators?platform=${platform.name.toLowerCase()}`}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all flex-shrink-0 ${platform.bgColor}`}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: platform.color }} />
                    <span className="text-xs text-white font-medium">{platform.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Stats - All visible on mobile */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm mb-6">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Users className="w-3.5 h-3.5 text-[#DE2010]" />
              <span><span className="text-white font-semibold">500+</span> Creators</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Eye className="w-3.5 h-3.5 text-[#FFD200]" />
              <span><span className="text-white font-semibold">50M+</span> Reach</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Heart className="w-3.5 h-3.5 text-[#319E31]" />
              <span><span className="text-white font-semibold">10+</span> Niches</span>
            </div>
          </div>

          {/* Submit Creator CTA */}
          <div className="flex items-center justify-center">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#319E31] hover:bg-[#28862a] text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-[#319E31]/20"
            >
              <Sparkles className="w-4 h-4" />
              Submit a Creator
            </Link>
          </div>
        </div>

        {/* Featured Creators - Auto-scrolling Carousel */}
        <div className="w-full max-w-7xl mx-auto mt-6 sm:mt-10 px-4 sm:px-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#DE2010]" />
              <h2 className="text-sm sm:text-lg font-bold text-white">Most Shared This Week</h2>
            </div>
            <Link href="/creators?sort=shares" className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Scrolling Carousel - Contained */}
          <div className="relative overflow-hidden rounded-xl">
            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none" />

            {/* Scrolling Container */}
            <div className="flex gap-3 py-2 animate-scroll-left hover:pause-animation">
              {/* First set */}
              {FEATURED_CREATORS.map((creator, index) => (
                <FeaturedCard key={creator.id} creator={creator} rank={index + 1} />
              ))}
              {/* Duplicate set for seamless loop */}
              {FEATURED_CREATORS.map((creator, index) => (
                <FeaturedCard key={`dup-${creator.id}`} creator={creator} rank={index + 1} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Browse Creators - Popular Creators */}
      <section className="relative py-6 sm:py-10 px-4 sm:px-6 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFD200]" />
              <h3 className="text-sm sm:text-lg font-semibold text-white">Popular Creators</h3>
            </div>
            <Link href="/creators" className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-4 sm:flex sm:flex-wrap sm:justify-center gap-1 sm:gap-2">
            {QUICK_BROWSE_CREATORS.map((creator) => (
              <CreatorAvatar key={creator.id} creator={creator} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending + Categories Split - Mobile optimized */}
      <section className="relative py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Trending This Week */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#DE2010]" />
                  <h2 className="text-base sm:text-xl font-bold text-white">Trending This Week</h2>
                </div>
                <Link href="/trending" className="text-xs text-slate-500 hover:text-white flex items-center gap-1">
                  All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {TRENDING_CREATORS.map((creator, index) => (
                  <TrendingItem key={creator.id} creator={creator} rank={index + 1} />
                ))}
              </div>
            </div>

            {/* Browse Categories */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-[#319E31]" />
                <h2 className="text-base sm:text-xl font-bold text-white">Categories</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {CATEGORIES.map((category) => (
                  <CategoryCard key={category.name} category={category} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile optimized */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-r from-[#319E31]/10 via-[#FFD200]/10 to-[#DE2010]/20 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden">
              <Image src="/images/logo.png" alt="263Tube" width={64} height={64} className="w-full h-full object-contain" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
            Are you a Zimbabwean Creator?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mb-6 sm:mb-8 px-2">
            Join the largest directory of Zim talent. Get discovered by brands and grow your audience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/submit" className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] rounded-xl text-white text-sm sm:text-base font-semibold hover:from-[#ff2a17] hover:to-[#DE2010] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#DE2010]/25">
              <Sparkles className="w-4 h-4" />
              Submit Your Profile
            </Link>
            <Link href="/about" className="w-full sm:w-auto px-6 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-sm sm:text-base font-medium hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2">
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Mobile optimized */}
      <footer className="relative border-t border-white/[0.05] bg-black/40">
        {/* Zimbabwe Flag Stripe */}
        <div className="zim-stripe" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
                </div>
                <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                The directory for Zimbabwean creators.
              </p>
              <div className="flex items-center gap-2">
                <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-[#DE2010]/20 flex items-center justify-center transition-colors">
                  <Twitter className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-[#DE2010]/20 flex items-center justify-center transition-colors">
                  <Instagram className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-[#DE2010]/20 flex items-center justify-center transition-colors">
                  <Youtube className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Explore</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-500">
                <li><Link href="/creators" className="hover:text-white transition-colors">All Creators</Link></li>
                <li><Link href="/trending" className="hover:text-white transition-colors">Trending</Link></li>
                <li><Link href="/categories" className="hover:text-white transition-colors">Categories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Creators</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-500">
                <li><Link href="/submit" className="hover:text-white transition-colors">Submit Profile</Link></li>
                <li><Link href="/claim" className="hover:text-white transition-colors">Claim Page</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div className="hidden sm:block">
              <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-500">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <p>© 2025 263Tube. All rights reserved.</p>
            <p className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Harare, Zimbabwe
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
