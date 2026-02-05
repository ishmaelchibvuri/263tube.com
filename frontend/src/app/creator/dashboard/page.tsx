"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  Globe,
  Users,
  Eye,
  TrendingUp,
  Edit,
  ExternalLink,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Link as LinkIcon,
  Settings,
  Sparkles,
  ArrowRight,
  Crown,
  MessageSquare,
  Mail,
  Clock,
  Building2,
  DollarSign,
  ChevronRight,
  Inbox,
} from "lucide-react";

// Mock data - replace with actual API calls
interface CreatorProfile {
  id: string;
  slug: string;
  name: string;
  bio: string;
  profileImage: string | null;
  niches: string[];
  status: "pending" | "approved" | "featured";
  isVerified: boolean;
  channels: Channel[];
  stats: {
    totalFollowers: number;
    totalViews: number;
    profileViews: number;
    linkClicks: number;
  };
  createdAt: string;
}

interface Channel {
  platform: string;
  url: string;
  displayName: string | null;
  image: string | null;
  followers: number | null;
  verified: boolean;
}

interface SponsorshipInquiry {
  id: string;
  sponsorName: string;
  companyName: string | null;
  email: string;
  subject: string;
  message: string;
  budget: string | null;
  status: "unread" | "read" | "replied" | "archived";
  createdAt: string;
}

const PLATFORM_ICONS: Record<string, any> = {
  YouTube: Youtube,
  TikTok: Music2,
  Instagram: Instagram,
  Facebook: Facebook,
  Twitter: Twitter,
};

const PLATFORM_COLORS: Record<string, string> = {
  YouTube: "#FF0000",
  TikTok: "#00F2EA",
  Instagram: "#E4405F",
  Facebook: "#1877F2",
  Twitter: "#1DA1F2",
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function CreatorDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [claimingProfile, setClaimingProfile] = useState(false);
  const [inquiries, setInquiries] = useState<SponsorshipInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isLoading && user && user.role !== "creator" && user.role !== "admin") {
      router.push("/");
      return;
    }

    if (user) {
      loadCreatorProfile();
    }
  }, [user, isLoading, router]);

  const loadCreatorProfile = async () => {
    setLoadingProfile(true);
    try {
      // Check if user has a claimed profile
      if (user?.creatorSlug) {
        // Fetch the creator's profile
        const response = await fetch(`/api/creators/${user.creatorSlug}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          // Load inquiries after profile is loaded
          loadInquiries(user.creatorSlug);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadInquiries = async (creatorSlug: string) => {
    setLoadingInquiries(true);
    try {
      const response = await fetch(`/api/creators/${creatorSlug}/inquiries`);
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries || []);
      }
    } catch (error) {
      console.error("Error loading inquiries:", error);
    } finally {
      setLoadingInquiries(false);
    }
  };

  const markInquiryAsRead = async (inquiryId: string) => {
    try {
      await fetch(`/api/inquiries/${inquiryId}/read`, { method: "POST" });
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, status: "read" as const } : inq
        )
      );
    } catch (error) {
      console.error("Error marking inquiry as read:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const unreadCount = inquiries.filter((inq) => inq.status === "unread").length;

  const searchProfiles = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/creators?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.creators || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const claimProfile = async (creatorSlug: string) => {
    setClaimingProfile(true);
    try {
      const response = await fetch(`/api/creators/${creatorSlug}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Refresh the page to load the claimed profile
        window.location.reload();
      }
    } catch (error) {
      console.error("Claim error:", error);
    } finally {
      setClaimingProfile(false);
    }
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#DE2010] animate-spin" />
      </div>
    );
  }

  // If creator has no claimed profile yet
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                Welcome, {user?.firstName}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#DE2010]/10 mb-4">
              <LayoutDashboard className="w-8 h-8 text-[#DE2010]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Creator Dashboard</h1>
            <p className="text-slate-400">Manage your profile and track your growth</p>
          </div>

          {/* Two Options */}
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {/* Option 1: Claim Existing Profile */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-[#FFD200]/10 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-[#FFD200]" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Claim Your Profile</h2>
              <p className="text-sm text-slate-400 mb-4">
                Already listed on 263Tube? Search and claim your profile to manage it.
              </p>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchProfiles()}
                    placeholder="Search your name or channel..."
                    className="flex-1 h-10 px-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#FFD200]/50"
                  />
                  <button
                    onClick={searchProfiles}
                    disabled={searching || !searchQuery.trim()}
                    className="h-10 px-4 bg-[#FFD200] text-black font-medium rounded-lg hover:bg-[#FFD200]/90 disabled:opacity-50 transition-colors"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((creator) => (
                      <div
                        key={creator.slug}
                        className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800">
                          {creator.profilePicUrl ? (
                            <Image src={creator.profilePicUrl} alt={creator.name} width={40} height={40} className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                              {creator.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{creator.name}</p>
                          <p className="text-xs text-slate-500">{creator.niche}</p>
                        </div>
                        <button
                          onClick={() => claimProfile(creator.slug)}
                          disabled={claimingProfile}
                          className="px-3 py-1.5 text-xs font-medium bg-[#319E31] text-white rounded-lg hover:bg-[#319E31]/90 disabled:opacity-50"
                        >
                          {claimingProfile ? "Claiming..." : "Claim"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Option 2: Create New Profile */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-[#319E31]/10 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-[#319E31]" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Submit New Profile</h2>
              <p className="text-sm text-slate-400 mb-4">
                Not listed yet? Submit your creator profile to be featured on 263Tube.
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#319E31] text-white font-medium rounded-lg hover:bg-[#319E31]/90 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Submit Profile
              </Link>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-[#DE2010]/5 to-[#FFD200]/5 border border-white/[0.05] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#FFD200]" />
              Benefits of Claiming Your Profile
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#319E31] mt-0.5 flex-shrink-0" />
                <span>Edit your bio, links, and profile picture</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#319E31] mt-0.5 flex-shrink-0" />
                <span>See detailed analytics and insights</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#319E31] mt-0.5 flex-shrink-0" />
                <span>Get verified badge on your profile</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#319E31] mt-0.5 flex-shrink-0" />
                <span>Receive sponsorship inquiries directly</span>
              </li>
            </ul>
          </div>
        </main>
      </div>
    );
  }

  // Creator has a claimed profile - show full dashboard
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
              href={`/creator/${profile.slug}`}
              className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Profile
            </Link>
            <Link
              href={`/creator/${profile.slug}/edit`}
              className="px-4 py-2 text-sm font-medium bg-[#DE2010] text-white rounded-lg hover:bg-[#ff2a17] transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white/10">
              {profile.profileImage ? (
                <Image src={profile.profileImage} alt={profile.name} width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>
            {profile.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#319E31] rounded-full flex items-center justify-center border-2 border-[#09090b]">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
              {profile.status === "featured" && (
                <span className="px-2 py-0.5 text-xs font-medium bg-[#FFD200]/10 text-[#FFD200] rounded-full border border-[#FFD200]/20">
                  Featured
                </span>
              )}
              {profile.status === "pending" && (
                <span className="px-2 py-0.5 text-xs font-medium bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
                  Pending Review
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-2">{profile.niches.join(" • ")}</p>
            <p className="text-slate-500 text-sm">{profile.bio || "No bio yet"}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#DE2010]" />
              <span className="text-xs text-slate-500">Total Followers</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatNumber(profile.stats.totalFollowers)}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-[#FFD200]" />
              <span className="text-xs text-slate-500">Profile Views</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatNumber(profile.stats.profileViews)}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4 text-[#319E31]" />
              <span className="text-xs text-slate-500">Link Clicks</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatNumber(profile.stats.linkClicks)}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-500">Total Reach</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatNumber(profile.stats.totalViews)}</p>
          </div>
        </div>

        {/* Channels Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#DE2010]" />
              Your Channels
            </h2>
            <Link
              href={`/creator/${profile.slug}/edit#channels`}
              className="text-sm text-[#FFD200] hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Channel
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.channels.map((channel, index) => {
              const Icon = PLATFORM_ICONS[channel.platform] || Globe;
              const color = PLATFORM_COLORS[channel.platform] || "#718096";

              return (
                <div
                  key={index}
                  className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:border-white/[0.1] transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">
                          {channel.displayName || channel.platform}
                        </p>
                        {channel.verified && (
                          <CheckCircle className="w-3.5 h-3.5 text-[#319E31] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{channel.platform}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-white font-medium">
                        {channel.followers ? formatNumber(channel.followers) : "—"}
                      </span>
                      <span className="text-slate-500 ml-1">followers</span>
                    </div>
                    <a
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visit
                    </a>
                  </div>
                </div>
              );
            })}

            {profile.channels.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500">
                <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No channels added yet</p>
                <Link
                  href={`/creator/${profile.slug}/edit#channels`}
                  className="text-sm text-[#FFD200] hover:underline mt-2 inline-block"
                >
                  Add your first channel
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sponsorship Offers/Enquiries Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#FFD200]" />
              Sponsorship Enquiries
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-[#DE2010] text-white rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h2>
            <Link
              href={`/creator/${profile.slug}/inquiries`}
              className="text-sm text-[#FFD200] hover:underline flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingInquiries ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#FFD200] animate-spin" />
            </div>
          ) : inquiries.length > 0 ? (
            <div className="space-y-3">
              {inquiries.slice(0, 5).map((inquiry) => (
                <div
                  key={inquiry.id}
                  className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-[#FFD200]/30 ${
                    inquiry.status === "unread"
                      ? "bg-[#FFD200]/5 border-[#FFD200]/20"
                      : "bg-white/[0.02] border-white/[0.05]"
                  }`}
                  onClick={() => {
                    if (inquiry.status === "unread") {
                      markInquiryAsRead(inquiry.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      inquiry.status === "unread" ? "bg-[#FFD200]/20" : "bg-white/[0.05]"
                    }`}>
                      {inquiry.companyName ? (
                        <Building2 className={`w-5 h-5 ${inquiry.status === "unread" ? "text-[#FFD200]" : "text-slate-400"}`} />
                      ) : (
                        <Mail className={`w-5 h-5 ${inquiry.status === "unread" ? "text-[#FFD200]" : "text-slate-400"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm font-medium truncate ${
                          inquiry.status === "unread" ? "text-white" : "text-slate-300"
                        }`}>
                          {inquiry.sponsorName}
                          {inquiry.companyName && (
                            <span className="text-slate-500 font-normal"> • {inquiry.companyName}</span>
                          )}
                        </p>
                        {inquiry.status === "unread" && (
                          <span className="w-2 h-2 rounded-full bg-[#FFD200] flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm mb-1 truncate ${
                        inquiry.status === "unread" ? "text-white/90" : "text-slate-400"
                      }`}>
                        {inquiry.subject}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">{inquiry.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(inquiry.createdAt)}
                        </span>
                        {inquiry.budget && (
                          <span className="text-xs text-[#319E31] flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {inquiry.budget}
                          </span>
                        )}
                        {inquiry.status === "replied" && (
                          <span className="text-xs text-[#319E31] flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Replied
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#FFD200]/10 flex items-center justify-center mx-auto mb-3">
                <Inbox className="w-6 h-6 text-[#FFD200]" />
              </div>
              <h3 className="text-sm font-medium text-white mb-1">No enquiries yet</h3>
              <p className="text-xs text-slate-500 mb-3">
                When sponsors reach out to collaborate, their messages will appear here.
              </p>
              <p className="text-xs text-slate-400">
                Tip: Complete your profile and add verified channels to attract more sponsors!
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href={`/creator/${profile.slug}/edit`}
            className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-[#DE2010]/30 hover:bg-white/[0.04] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#DE2010]/10 flex items-center justify-center group-hover:bg-[#DE2010]/20 transition-colors">
              <Edit className="w-5 h-5 text-[#DE2010]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Edit Profile</p>
              <p className="text-xs text-slate-500">Update your bio and links</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-white transition-colors" />
          </Link>

          <Link
            href={`/creator/${profile.slug}/analytics`}
            className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-[#FFD200]/30 hover:bg-white/[0.04] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FFD200]/10 flex items-center justify-center group-hover:bg-[#FFD200]/20 transition-colors">
              <BarChart3 className="w-5 h-5 text-[#FFD200]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">View Analytics</p>
              <p className="text-xs text-slate-500">Detailed insights & stats</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-white transition-colors" />
          </Link>

          <Link
            href={`/creator/${profile.slug}/settings`}
            className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-[#319E31]/30 hover:bg-white/[0.04] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#319E31]/10 flex items-center justify-center group-hover:bg-[#319E31]/20 transition-colors">
              <Settings className="w-5 h-5 text-[#319E31]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Settings</p>
              <p className="text-xs text-slate-500">Notifications & privacy</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-white transition-colors" />
          </Link>
        </div>
      </main>
    </div>
  );
}
