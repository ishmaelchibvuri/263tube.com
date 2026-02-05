"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { canEditCreator } from "@/lib/admin-tier";
import {
  ArrowLeft,
  Save,
  Loader2,
  Camera,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  Globe,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { validatePlatformLink } from "@/lib/actions/validate-link";
import { NicheMultiSelect } from "@/components/submit";

const PLATFORMS = [
  { name: "YouTube", icon: Youtube, color: "#FF0000" },
  { name: "TikTok", icon: Music2, color: "#00F2EA" },
  { name: "Instagram", icon: Instagram, color: "#E4405F" },
  { name: "Facebook", icon: Facebook, color: "#1877F2" },
  { name: "Twitter", icon: Twitter, color: "#1DA1F2" },
];

interface Channel {
  platform: string;
  url: string;
  label: string;
  displayName: string | null;
  image: string | null;
  followers: number | null;
  verified: boolean;
  verifiedAt?: string;
}

interface ProfileData {
  name: string;
  bio: string;
  website: string;
  niches: string[];
  customNiche: string;
  channels: Channel[];
}

export default function EditCreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    bio: "",
    website: "",
    niches: [],
    customNiche: "",
    channels: [],
  });

  const [verifyingChannel, setVerifyingChannel] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!authLoading && user && !canEditCreator(user, slug)) {
      router.push("/unauthorized");
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, slug, router]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/creators/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          name: data.name || "",
          bio: data.bio || "",
          website: data.website || "",
          niches: data.niches || [],
          customNiche: data.customNiche || "",
          channels: data.channels || [],
        });
      }
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const addChannel = (platform: string) => {
    setProfileData((prev) => ({
      ...prev,
      channels: [
        ...prev.channels,
        {
          platform,
          url: "",
          label: "Main Channel",
          displayName: null,
          image: null,
          followers: null,
          verified: false,
        },
      ],
    }));
  };

  const updateChannel = (index: number, field: keyof Channel, value: any) => {
    setProfileData((prev) => ({
      ...prev,
      channels: prev.channels.map((ch, i) =>
        i === index ? { ...ch, [field]: value, verified: field === "url" ? false : ch.verified } : ch
      ),
    }));
  };

  const removeChannel = (index: number) => {
    setProfileData((prev) => ({
      ...prev,
      channels: prev.channels.filter((_, i) => i !== index),
    }));
  };

  const verifyChannel = async (index: number) => {
    const channel = profileData.channels[index];
    if (!channel || !channel.url.trim()) return;

    setVerifyingChannel(index);
    try {
      const result = await validatePlatformLink(channel.platform, channel.url);

      if (result.success) {
        setProfileData((prev) => ({
          ...prev,
          channels: prev.channels.map((ch, i) =>
            i === index
              ? {
                  ...ch,
                  verified: true,
                  verifiedAt: new Date().toISOString(),
                  displayName: result.displayName,
                  image: result.image,
                  followers: result.followers,
                }
              : ch
          ),
        }));
      } else {
        setError(result.error || "Verification failed");
      }
    } catch (err) {
      setError("Verification failed");
    } finally {
      setVerifyingChannel(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/creators/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save");
      }
    } catch (err) {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#DE2010] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/creator/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-[#319E31] text-white rounded-lg hover:bg-[#319E31]/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Profile</h1>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-[#319E31]/10 border border-[#319E31]/20 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#319E31] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#319E31]">Profile saved successfully!</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Basic Info */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Display Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={4}
                  placeholder="Tell people about yourself and your content..."
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Website (optional)</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="w-full h-12 pl-11 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Content Niches</label>
                <NicheMultiSelect
                  selectedNiches={profileData.niches}
                  onChange={(niches) => setProfileData({ ...profileData, niches })}
                  onOtherSelected={(custom) => setProfileData({ ...profileData, customNiche: custom })}
                  customNiche={profileData.customNiche}
                  maxSelections={3}
                />
              </div>
            </div>
          </section>

          {/* Channels */}
          <section id="channels" className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Channels</h2>
            </div>

            <div className="space-y-4 mb-6">
              {profileData.channels.map((channel, index) => {
                const platformConfig = PLATFORMS.find((p) => p.name === channel.platform);
                const Icon = platformConfig?.icon || Globe;
                const color = platformConfig?.color || "#718096";
                const isVerifying = verifyingChannel === index;

                return (
                  <div
                    key={index}
                    className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={channel.label}
                          onChange={(e) => updateChannel(index, "label", e.target.value)}
                          placeholder="Channel name"
                          className="w-full bg-transparent text-white text-sm font-medium focus:outline-none"
                        />
                        <p className="text-xs text-slate-500">{channel.platform}</p>
                      </div>
                      <button
                        onClick={() => removeChannel(index)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={channel.url}
                        onChange={(e) => updateChannel(index, "url", e.target.value)}
                        placeholder={`https://${channel.platform.toLowerCase()}.com/...`}
                        className={`flex-1 h-10 px-3 bg-white/[0.05] border rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none transition-colors ${
                          channel.verified
                            ? "border-[#319E31]/50"
                            : "border-white/[0.1] focus:border-[#DE2010]/50"
                        }`}
                      />
                      <button
                        onClick={() => verifyChannel(index)}
                        disabled={!channel.url.trim() || isVerifying}
                        className={`h-10 px-4 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                          channel.verified
                            ? "bg-[#319E31]/20 text-[#319E31] border border-[#319E31]/30"
                            : isVerifying
                            ? "bg-white/[0.05] text-slate-400 border border-white/[0.1]"
                            : "bg-[#FFD200]/10 text-[#FFD200] border border-[#FFD200]/30 hover:bg-[#FFD200]/20"
                        }`}
                      >
                        {isVerifying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : channel.verified ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        {channel.verified ? "Verified" : "Verify"}
                      </button>
                    </div>

                    {channel.verified && channel.displayName && (
                      <div className="flex items-center gap-2 p-2 bg-[#319E31]/10 border border-[#319E31]/20 rounded-lg">
                        {channel.image && (
                          <Image
                            src={channel.image}
                            alt={channel.displayName}
                            width={24}
                            height={24}
                            className="rounded"
                          />
                        )}
                        <span className="text-sm text-[#319E31]">{channel.displayName}</span>
                        {channel.followers && (
                          <span className="text-xs text-slate-400">
                            • {channel.followers >= 1000000
                              ? `${(channel.followers / 1000000).toFixed(1)}M`
                              : channel.followers >= 1000
                              ? `${(channel.followers / 1000).toFixed(1)}K`
                              : channel.followers} followers
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Channel Buttons */}
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.name}
                    onClick={() => addChannel(platform.name)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-slate-300 hover:bg-white/[0.1] hover:border-white/[0.2] transition-all"
                  >
                    <Icon className="w-4 h-4" style={{ color: platform.color }} />
                    <Plus className="w-3 h-3" />
                    {platform.name}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
