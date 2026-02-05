"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Search,
  TrendingUp,
  Heart,
  MessageSquare,
  Filter,
  ArrowRight,
  ExternalLink,
  Loader2,
  Sparkles,
  Target,
  BarChart3,
  Send,
  CheckCircle,
  Youtube,
  Instagram,
  Music2,
  Crown,
  Star,
} from "lucide-react";

// Mock data - replace with actual API calls
interface Creator {
  slug: string;
  name: string;
  profileImage: string | null;
  niche: string;
  followers: number;
  platforms: string[];
}

interface Campaign {
  id: string;
  title: string;
  status: "draft" | "active" | "completed";
  creatorsContacted: number;
  responses: number;
  createdAt: string;
}

interface Stats {
  totalInquiries: number;
  activeConversations: number;
  savedCreators: number;
  campaignsActive: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function SponsorDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalInquiries: 0,
    activeConversations: 0,
    savedCreators: 0,
    campaignsActive: 0,
  });
  const [featuredCreators, setFeaturedCreators] = useState<Creator[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isLoading && user && user.role !== "sponsor" && user.role !== "admin") {
      router.push("/");
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, isLoading, router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load sponsor stats
      // TODO: Replace with actual API calls
      setStats({
        totalInquiries: 12,
        activeConversations: 3,
        savedCreators: 8,
        campaignsActive: 1,
      });

      // Load featured creators
      const creatorsResponse = await fetch("/api/creators?featured=true&limit=6");
      if (creatorsResponse.ok) {
        const data = await creatorsResponse.json();
        setFeaturedCreators(data.creators || []);
      }

      // Load recent campaigns
      // TODO: Replace with actual API call
      setRecentCampaigns([]);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD200] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/creators"
              className="px-4 py-2 text-sm font-medium bg-[#FFD200] text-black rounded-lg hover:bg-[#FFD200]/90 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Find Creators
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-slate-400">Connect with Zimbabwe's top content creators</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-4 h-4 text-[#FFD200]" />
              <span className="text-xs text-slate-500">Inquiries Sent</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalInquiries}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-[#319E31]" />
              <span className="text-xs text-slate-500">Active Chats</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.activeConversations}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-[#DE2010]" />
              <span className="text-xs text-slate-500">Saved Creators</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.savedCreators}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-500">Active Campaigns</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.campaignsActive}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Featured Creators */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-[#FFD200]" />
                Featured Creators
              </h2>
              <Link
                href="/creators"
                className="text-sm text-[#FFD200] hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {featuredCreators.length > 0 ? (
                featuredCreators.slice(0, 6).map((creator) => (
                  <Link
                    key={creator.slug}
                    href={`/creator/${creator.slug}`}
                    className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-[#FFD200]/30 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      {creator.profileImage ? (
                        <Image
                          src={creator.profileImage}
                          alt={creator.name}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center text-white text-lg font-bold">
                          {creator.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#FFD200] transition-colors">
                        {creator.name}
                      </h3>
                      <p className="text-xs text-slate-500">{creator.niche}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatNumber(creator.followers)} followers
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-[#FFD200] transition-colors" />
                  </Link>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No featured creators yet</p>
                  <Link href="/creators" className="text-sm text-[#FFD200] hover:underline mt-2 inline-block">
                    Browse all creators
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/creators"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#FFD200]/10 flex items-center justify-center">
                    <Search className="w-4 h-4 text-[#FFD200]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#FFD200] transition-colors">
                      Search Creators
                    </p>
                    <p className="text-xs text-slate-500">Find the perfect match</p>
                  </div>
                </Link>
                <Link
                  href="/creators?filter=niche"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#319E31]/10 flex items-center justify-center">
                    <Filter className="w-4 h-4 text-[#319E31]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#319E31] transition-colors">
                      Browse by Niche
                    </p>
                    <p className="text-xs text-slate-500">Comedy, Music, Tech & more</p>
                  </div>
                </Link>
                <Link
                  href="/trending"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#DE2010]/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#DE2010]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#DE2010] transition-colors">
                      Trending Creators
                    </p>
                    <p className="text-xs text-slate-500">See who's hot right now</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Sponsorship Tips */}
            <div className="bg-gradient-to-br from-[#FFD200]/5 to-[#DE2010]/5 border border-white/[0.05] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#FFD200]" />
                Sponsorship Tips
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#319E31] mt-0.5 flex-shrink-0" />
                  <span>Look at engagement rates, not just follower counts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#319E31] mt-0.5 flex-shrink-0" />
                  <span>Match creator niches with your target audience</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#319E31] mt-0.5 flex-shrink-0" />
                  <span>Start with micro-influencers for authentic reach</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#319E31] mt-0.5 flex-shrink-0" />
                  <span>Build long-term relationships for better results</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
