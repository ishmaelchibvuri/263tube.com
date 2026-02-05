"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Play,
  User,
  Users,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  Globe,
  Mail,
  CheckCircle,
  Sparkles,
  Send,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import { submitCreatorRequest } from "@/lib/actions/creators";

const NICHES = [
  "Comedy",
  "Music",
  "Entertainment",
  "Technology",
  "Cooking",
  "Farming",
  "Lifestyle",
  "Education",
  "Sports",
  "News",
  "Commentary",
  "Gaming",
  "Beauty",
  "Fashion",
  "Travel",
  "Other",
];

const PLATFORMS = [
  { name: "YouTube", icon: Youtube, color: "#FF0000" },
  { name: "TikTok", icon: Music2, color: "#00F2EA" },
  { name: "Instagram", icon: Instagram, color: "#E4405F" },
  { name: "Facebook", icon: Facebook, color: "#1877F2" },
  { name: "Twitter", icon: Twitter, color: "#1DA1F2" },
];

export default function SubmitCreatorPage() {
  const [submissionType, setSubmissionType] = useState<"self" | "other" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Platform links state - allows multiple links per platform
  const [platformLinks, setPlatformLinks] = useState<Record<string, { label: string; url: string }[]>>({
    YouTube: [],
    TikTok: [],
    Instagram: [],
    Facebook: [],
    Twitter: [],
  });

  const [formData, setFormData] = useState({
    creatorName: "",
    niche: "",
    website: "",
    about: "",
    submitterName: "",
    submitterEmail: "",
    submitterRelation: "",
  });

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        // Remove platform and clear its links
        setPlatformLinks((links) => ({ ...links, [platform]: [] }));
        return prev.filter((p) => p !== platform);
      } else {
        // Add platform with one empty link
        setPlatformLinks((links) => ({
          ...links,
          [platform]: [{ label: "Main Channel", url: "" }],
        }));
        return [...prev, platform];
      }
    });
  };

  const addPlatformLink = (platform: string) => {
    setPlatformLinks((links) => ({
      ...links,
      [platform]: [
        ...links[platform],
        { label: `Channel ${links[platform].length + 1}`, url: "" },
      ],
    }));
  };

  const updatePlatformLink = (
    platform: string,
    index: number,
    field: "label" | "url",
    value: string
  ) => {
    setPlatformLinks((links) => ({
      ...links,
      [platform]: links[platform].map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const removePlatformLink = (platform: string, index: number) => {
    setPlatformLinks((links) => ({
      ...links,
      [platform]: links[platform].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitCreatorRequest({
        creatorName: formData.creatorName,
        niche: formData.niche,
        platforms: selectedPlatforms,
        platformLinks: platformLinks,
        website: formData.website || undefined,
        about: formData.about || undefined,
        submitterName: formData.submitterName,
        submitterEmail: formData.submitterEmail,
        submitterRelation: formData.submitterRelation || undefined,
        submissionType: submissionType as "self" | "other",
      });

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setSubmitError(result.message);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if at least one link has a URL
  const hasAtLeastOneLink = selectedPlatforms.some(
    (platform) => platformLinks[platform]?.some((link) => link.url.trim() !== "")
  );

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#319E31]/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#319E31]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Submission Received!</h1>
          <p className="text-slate-400 mb-8">
            Thank you for your submission. Our team will review it and get back to you within 48 hours.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#DE2010] hover:bg-[#ff2a17] text-white font-medium rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#319E31]/10 mb-4">
            <Sparkles className="w-6 h-6 text-[#319E31]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Submit a Creator</h1>
          <p className="text-sm sm:text-base text-slate-400">
            Help us grow the directory by submitting a Zimbabwean creator
          </p>
        </div>

        {/* Submission Type Selection */}
        {!submissionType ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-500 mb-6">Who are you submitting?</p>

            <button
              onClick={() => setSubmissionType("self")}
              className="w-full p-4 sm:p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#DE2010]/30 hover:bg-white/[0.05] transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#DE2010]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#DE2010]/20 transition-colors">
                  <User className="w-6 h-6 text-[#DE2010]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">I am a Creator</h3>
                  <p className="text-sm text-slate-400">Submit your own profile to be featured on 263Tube</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSubmissionType("other")}
              className="w-full p-4 sm:p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#319E31]/30 hover:bg-white/[0.05] transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#319E31]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#319E31]/20 transition-colors">
                  <Users className="w-6 h-6 text-[#319E31]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Suggest a Creator</h3>
                  <p className="text-sm text-slate-400">Know a Zimbabwean creator who should be listed? Submit them!</p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Back button */}
            <button
              type="button"
              onClick={() => setSubmissionType(null)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Change submission type
            </button>

            {/* Submission type badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              submissionType === "self"
                ? "bg-[#DE2010]/10 text-[#DE2010] border border-[#DE2010]/20"
                : "bg-[#319E31]/10 text-[#319E31] border border-[#319E31]/20"
            }`}>
              {submissionType === "self" ? (
                <>
                  <User className="w-3 h-3" />
                  Submitting myself
                </>
              ) : (
                <>
                  <Users className="w-3 h-3" />
                  Suggesting a creator
                </>
              )}
            </div>

            {/* Creator Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Creator Information</h2>

              {/* Creator Name */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  {submissionType === "self" ? "Your Name / Channel Name" : "Creator's Name / Channel Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.creatorName}
                  onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                  placeholder="e.g. Madam Boss"
                  className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors"
                />
              </div>

              {/* Niche */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Content Niche *</label>
                <select
                  required
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-[#DE2010]/50 transition-colors appearance-none"
                >
                  <option value="" className="bg-[#09090b]">Select a niche</option>
                  {NICHES.map((niche) => (
                    <option key={niche} value={niche} className="bg-[#09090b]">{niche}</option>
                  ))}
                </select>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Active Platforms *</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.name);
                    return (
                      <button
                        key={platform.name}
                        type="button"
                        onClick={() => togglePlatform(platform.name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-white/[0.1] border-white/[0.2]"
                            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]"
                        }`}
                      >
                        <Icon className="w-4 h-4" style={{ color: isSelected ? platform.color : "#64748b" }} />
                        <span className={`text-sm ${isSelected ? "text-white" : "text-slate-400"}`}>{platform.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Social Links - Multiple per platform */}
              <div className="space-y-4">
                <label className="block text-sm text-slate-400">Social Media Links (at least one required)</label>

                {selectedPlatforms.map((platform) => {
                  const platformConfig = PLATFORMS.find((p) => p.name === platform);
                  if (!platformConfig) return null;
                  const Icon = platformConfig.icon;
                  const links = platformLinks[platform] || [];

                  return (
                    <div key={platform} className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4" style={{ color: platformConfig.color }} />
                        <span className="text-sm font-medium text-white">{platform}</span>
                        <span className="text-xs text-slate-500">({links.length} link{links.length !== 1 ? "s" : ""})</span>
                      </div>

                      {links.map((link, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => updatePlatformLink(platform, index, "label", e.target.value)}
                              placeholder="Label (e.g., Main Channel, Vlog Channel)"
                              className="w-full h-9 px-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                            />
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updatePlatformLink(platform, index, "url", e.target.value)}
                              placeholder={`https://${platform.toLowerCase()}.com/@channel`}
                              className="w-full h-10 px-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                            />
                          </div>
                          {links.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePlatformLink(platform, index)}
                              className="mt-1 p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addPlatformLink(platform)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add another {platform} link
                      </button>
                    </div>
                  );
                })}

                {selectedPlatforms.length === 0 && (
                  <p className="text-xs text-slate-500">Select platforms above to add links</p>
                )}
              </div>

              {/* Website (optional) */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Website (optional)</label>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    className="flex-1 h-11 px-4 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                  />
                </div>
              </div>

              {/* About */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  {submissionType === "self" ? "About You" : "About the Creator"} (optional)
                </label>
                <textarea
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  placeholder="Brief description of the content created..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 resize-none"
                />
              </div>
            </div>

            {/* Submitter Information */}
            <div className="space-y-4 pt-4 border-t border-white/[0.05]">
              <h2 className="text-lg font-semibold text-white">Your Contact Information</h2>
              <p className="text-xs text-slate-500">We'll use this to follow up on your submission</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.submitterName}
                    onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.submitterEmail}
                    onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                  />
                </div>
              </div>

              {submissionType === "other" && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Your Relation to Creator (optional)</label>
                  <input
                    type="text"
                    value={formData.submitterRelation}
                    onChange={(e) => setFormData({ ...formData, submitterRelation: e.target.value })}
                    placeholder="e.g. Fan, Manager, Friend"
                    className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="flex items-start gap-3 p-4 bg-[#DE2010]/10 border border-[#DE2010]/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-[#DE2010] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[#DE2010] font-medium">Submission Failed</p>
                  <p className="text-xs text-slate-400 mt-1">{submitError}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !hasAtLeastOneLink}
                className="w-full h-12 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit for Review
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500 text-center mt-3">
                Submissions are reviewed within 48 hours
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
