"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users, TrendingUp, Sparkles } from "lucide-react";

// Categories with their metadata
const CATEGORIES = [
  {
    name: "Comedy",
    slug: "Comedy",
    icon: "😂",
    description: "Laugh out loud with Zim's funniest content creators",
    creatorCount: 124,
    weeklyViews: 4200000,
    color: "from-[#DE2010] to-[#b01a0d]",
    bgColor: "bg-[#DE2010]/10",
    borderColor: "border-[#DE2010]/20",
    topCreators: ["Madam Boss", "Tyra Chikocho", "Comic Pastor"],
  },
  {
    name: "Music",
    slug: "Music",
    icon: "🎵",
    description: "Discover Zimbabwe's musical talents and artists",
    creatorCount: 89,
    weeklyViews: 3800000,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    topCreators: ["Jah Prayzah", "Winky D", "Baba Harare"],
  },
  {
    name: "Entertainment",
    slug: "Entertainment",
    icon: "🎬",
    description: "Entertainment, drama, and lifestyle content",
    creatorCount: 78,
    weeklyViews: 2100000,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    topCreators: ["Mai Titi", "Harare Nights"],
  },
  {
    name: "Technology",
    slug: "Technology",
    icon: "💻",
    description: "Tech reviews, tutorials, and digital innovation",
    creatorCount: 45,
    weeklyViews: 890000,
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    topCreators: ["TechZim"],
  },
  {
    name: "Cooking",
    slug: "Cooking",
    icon: "🍳",
    description: "Traditional recipes and culinary creativity",
    creatorCount: 62,
    weeklyViews: 1200000,
    color: "from-[#319E31] to-emerald-600",
    bgColor: "bg-[#319E31]/10",
    borderColor: "border-[#319E31]/20",
    topCreators: ["Zimbo Kitchen"],
  },
  {
    name: "Farming",
    slug: "Farming",
    icon: "🌾",
    description: "Agriculture tips and farming success stories",
    creatorCount: 38,
    weeklyViews: 780000,
    color: "from-[#FFD200] to-amber-500",
    bgColor: "bg-[#FFD200]/10",
    borderColor: "border-[#FFD200]/20",
    topCreators: ["Munya & Tupi"],
  },
  {
    name: "Lifestyle",
    slug: "Lifestyle",
    icon: "✨",
    description: "Daily life, vlogs, and personal journeys",
    creatorCount: 94,
    weeklyViews: 1500000,
    color: "from-rose-400 to-pink-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    topCreators: ["Zim Diaspora", "Zim Fitness"],
  },
  {
    name: "Commentary",
    slug: "Commentary",
    icon: "💬",
    description: "Hot takes, opinions, and social commentary",
    creatorCount: 32,
    weeklyViews: 950000,
    color: "from-slate-400 to-slate-600",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    topCreators: ["Shadaya Knight"],
  },
  {
    name: "Beauty",
    slug: "Beauty",
    icon: "💄",
    description: "Makeup tutorials, skincare, and beauty tips",
    creatorCount: 56,
    weeklyViews: 680000,
    color: "from-fuchsia-400 to-purple-500",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/20",
    topCreators: ["Zee Nxumalo"],
  },
  {
    name: "Education",
    slug: "Education",
    icon: "📚",
    description: "Learning content and educational resources",
    creatorCount: 41,
    weeklyViews: 520000,
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    topCreators: [],
  },
  {
    name: "Sports",
    slug: "Sports",
    icon: "⚽",
    description: "Sports coverage, fitness, and athletics",
    creatorCount: 28,
    weeklyViews: 340000,
    color: "from-green-400 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    topCreators: [],
  },
  {
    name: "Gaming",
    slug: "Gaming",
    icon: "🎮",
    description: "Game streams, reviews, and esports content",
    creatorCount: 19,
    weeklyViews: 210000,
    color: "from-violet-400 to-purple-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    topCreators: [],
  },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

export default function CategoriesPage() {
  const totalCreators = CATEGORIES.reduce((sum, cat) => sum + cat.creatorCount, 0);
  const totalViews = CATEGORIES.reduce((sum, cat) => sum + cat.weeklyViews, 0);

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
              <Link href="/creators" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
                All Creators
              </Link>
              <Link href="/trending" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
                Trending
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
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-[#FFD200]" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Browse by Category</h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Explore {CATEGORIES.length} content categories featuring Zimbabwe's best creators
          </p>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{totalCreators}+</div>
              <div className="text-xs sm:text-sm text-slate-500">Total Creators</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{formatNumber(totalViews)}</div>
              <div className="text-xs sm:text-sm text-slate-500">Weekly Views</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{CATEGORIES.length}</div>
              <div className="text-xs sm:text-sm text-slate-500">Categories</div>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Grid */}
      <main className="relative px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/creators?niche=${category.slug}`}
                className={`group relative p-5 sm:p-6 rounded-2xl bg-white/[0.02] border ${category.borderColor} hover:bg-white/[0.04] transition-all duration-300 overflow-hidden`}
              >
                {/* Background Gradient on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl">{category.icon}</span>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#FFD200] transition-colors">
                          {category.name}
                        </h2>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Users className="w-3 h-3" />
                          <span className="text-xs">{category.creatorCount} creators</span>
                        </div>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${category.bgColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {category.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="text-xs">{formatNumber(category.weeklyViews)} views/week</span>
                    </div>
                  </div>

                  {/* Top Creators */}
                  {category.topCreators.length > 0 && (
                    <div className="pt-4 border-t border-white/[0.05]">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Top Creators</p>
                      <div className="flex flex-wrap gap-1.5">
                        {category.topCreators.map((creator) => (
                          <span
                            key={creator}
                            className="px-2 py-1 bg-white/[0.05] rounded text-xs text-slate-300"
                          >
                            {creator}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* CTA Section */}
      <section className="relative py-12 px-4 sm:px-6 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Don't see your niche?
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            We're always expanding our categories. Submit a creator and help us grow the directory.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#DE2010] hover:bg-[#ff2a17] text-white font-medium rounded-xl transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Submit a Creator
          </Link>
        </div>
      </section>

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
              <Link href="/creators" className="hover:text-white transition-colors">All Creators</Link>
              <Link href="/trending" className="hover:text-white transition-colors">Trending</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
            </div>
            <p className="text-xs text-slate-600">All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
