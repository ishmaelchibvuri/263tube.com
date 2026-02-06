"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft,
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
  Loader2,
  BadgeCheck,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { submitCreatorRequest, type VerifiedLinkData } from "@/lib/actions/creators";
import { validatePlatformLink, type YouTubeEnrichment } from "@/lib/actions/validate-link";
import { formatSocialLink, sanitizePlatformLinks } from "@/lib/utils/sanitizers";
import { sendVerificationCode as sendGuestCode, verifyCode as verifyGuestCode } from "@/lib/actions/guest-verify";
import { checkDuplicateLink, type DuplicateCheckResult } from "@/lib/actions/check-duplicate";
import { getCreatorPlatformLinks, type CreatorPlatformLink } from "@/lib/actions/creator-links";
import { AuthButton } from "@/components/home/AuthButton";
import { EcosystemPreview, NicheMultiSelect } from "@/components/submit";
import { getNicheLabel } from "@/constants/niches";

const PLATFORMS = [
  { name: "YouTube", icon: Youtube, color: "#FF0000" },
  { name: "TikTok", icon: Music2, color: "#00F2EA" },
  { name: "Instagram", icon: Instagram, color: "#E4405F" },
  { name: "Facebook", icon: Facebook, color: "#1877F2" },
  { name: "Twitter", icon: Twitter, color: "#1DA1F2" },
];

// Extended platform link type with verification data
interface ExtendedPlatformLink {
  label: string;
  url: string;
  verified?: boolean;
  verifiedAt?: string;
  verifiedDisplayName?: string | null;
  verifiedImage?: string | null;
  verifiedFollowers?: number | null;
  youtubeEnrichment?: YouTubeEnrichment;
}

// Session data shape from server component
export interface SubmitSessionData {
  name: string;
  email: string;
  role: string;
  creatorSlug?: string;
}

// YouTube input validation
function isValidYouTubeInput(value: string): boolean {
  if (!value.trim()) return true;
  const trimmed = value.trim();
  if (trimmed.startsWith("@")) return /^@[\w][\w.-]{0,29}$/.test(trimmed);
  if (trimmed.startsWith("http") || trimmed.includes("://")) {
    return /^https?:\/\/(www\.)?youtube\.com\//i.test(trimmed) ||
           /^https?:\/\/youtu\.be\//i.test(trimmed);
  }
  if (trimmed.startsWith("UC") && trimmed.length >= 24) return /^UC[\w-]+$/.test(trimmed);
  return /^[\w.-]+$/.test(trimmed);
}

// Convert YouTube handle/username to full URL
function normalizeYouTubeInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("@")) return `https://www.youtube.com/${trimmed}`;
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  }
  if (trimmed.startsWith("UC") && trimmed.length >= 24) {
    return `https://www.youtube.com/channel/${trimmed}`;
  }
  return `https://www.youtube.com/@${trimmed}`;
}

interface Props {
  session: SubmitSessionData | null;
}

export default function SubmitCreatorForm({ session }: Props) {
  const router = useRouter();
  const isLoggedIn = !!session;

  const [submissionType, setSubmissionType] = useState<"self" | "other" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Email verification states (only used for guests)
  const [emailVerified, setEmailVerified] = useState(isLoggedIn);
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);

  // Platform links state
  const [platformLinks, setPlatformLinks] = useState<Record<string, ExtendedPlatformLink[]>>({
    YouTube: [],
    TikTok: [],
    Instagram: [],
    Facebook: [],
    Twitter: [],
  });

  // Verification states
  const [verifyingLinks, setVerifyingLinks] = useState<Record<string, boolean>>({});
  const [verificationErrors, setVerificationErrors] = useState<Record<string, string>>({});

  // Duplicate detection state
  const [duplicateResults, setDuplicateResults] = useState<Record<string, DuplicateCheckResult>>({});

  // Portfolio prevention state
  const [ownLinks, setOwnLinks] = useState<CreatorPlatformLink[]>([]);
  const [ownLinkMatches, setOwnLinkMatches] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    creatorName: "",
    website: "",
    about: "",
    submitterName: isLoggedIn ? session.name : "",
    submitterEmail: isLoggedIn ? session.email : "",
    submitterRelation: "",
  });

  // Multi-select niches state
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [customNiche, setCustomNiche] = useState("");

  // Load creator's own links for portfolio prevention
  useEffect(() => {
    if (session?.creatorSlug) {
      getCreatorPlatformLinks(session.creatorSlug).then(setOwnLinks);
    }
  }, [session?.creatorSlug]);

  // Check if a link matches the creator's own profile
  const isOwnLink = useCallback((platform: string, url: string): boolean => {
    if (!url.trim() || ownLinks.length === 0) return false;
    const normalizedInput = formatSocialLink(platform, url);
    if (!normalizedInput) return false;

    return ownLinks.some((link) => {
      const normalizedOwn = formatSocialLink(link.platform, link.url);
      return normalizedOwn && normalizedOwn.toLowerCase() === normalizedInput.toLowerCase();
    });
  }, [ownLinks]);

  // Send verification code (guest only)
  const handleSendVerificationCode = async () => {
    if (!formData.submitterEmail || !formData.submitterEmail.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setSendingCode(true);
    setEmailError(null);

    try {
      const result = await sendGuestCode(formData.submitterEmail);

      if (!result.success) {
        setEmailError(result.error || "Failed to send code");
        return;
      }

      setCodeSent(true);
      setCodeExpiresAt(new Date(Date.now() + (result.expiresIn || 600) * 1000));
      setVerificationCode("");
      setCodeError(null);
    } catch {
      setEmailError("Failed to send verification code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  };

  // Verify the code (guest only)
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setCodeError("Please enter the 6-digit code");
      return;
    }

    setVerifyingCode(true);
    setCodeError(null);

    try {
      const result = await verifyGuestCode(formData.submitterEmail, verificationCode);

      if (!result.success) {
        setCodeError(result.error || "Invalid code");
        return;
      }

      setEmailVerified(true);
      setCodeSent(false);
    } catch {
      setCodeError("Failed to verify code. Please try again.");
    } finally {
      setVerifyingCode(false);
    }
  };

  // Reset verification when email changes (guest only)
  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, submitterEmail: email });
    if (emailVerified || codeSent) {
      setEmailVerified(false);
      setCodeSent(false);
      setVerificationCode("");
      setCodeError(null);
      setEmailError(null);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        setPlatformLinks((links) => ({ ...links, [platform]: [] }));
        return prev.filter((p) => p !== platform);
      } else {
        setPlatformLinks((links) => ({
          ...links,
          [platform]: [{ label: "Main Channel", url: "" }],
        }));
        return [...prev, platform];
      }
    });
  };

  const addPlatformLink = (platform: string) => {
    setPlatformLinks((links) => {
      const existing = links[platform] ?? [];
      return {
        ...links,
        [platform]: [
          ...existing,
          { label: `Channel ${existing.length + 1}`, url: "" },
        ],
      };
    });
  };

  const updatePlatformLink = (
    platform: string,
    index: number,
    field: "label" | "url",
    value: string
  ) => {
    setPlatformLinks((links) => ({
      ...links,
      [platform]: (links[platform] ?? []).map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const removePlatformLink = (platform: string, index: number) => {
    setPlatformLinks((links) => ({
      ...links,
      [platform]: (links[platform] ?? []).filter((_, i) => i !== index),
    }));
    // Clear duplicate and own-link results for this key
    const verifyKey = `${platform}-${index}`;
    setDuplicateResults((prev) => {
      const next = { ...prev };
      delete next[verifyKey];
      return next;
    });
    setOwnLinkMatches((prev) => {
      const next = { ...prev };
      delete next[verifyKey];
      return next;
    });
  };

  // Verify a platform link
  const verifyLink = async (platform: string, index: number) => {
    const link = platformLinks[platform]?.[index];
    if (!link || !link.url.trim()) return;

    if (platform === "YouTube" && !isValidYouTubeInput(link.url)) {
      const verifyKey = `${platform}-${index}`;
      setVerificationErrors((prev) => ({
        ...prev,
        [verifyKey]: "Please enter a valid YouTube channel URL or handle (e.g. @263tube)",
      }));
      return;
    }

    const verifyKey = `${platform}-${index}`;
    setVerifyingLinks((prev) => ({ ...prev, [verifyKey]: true }));
    setVerificationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[verifyKey];
      return newErrors;
    });

    try {
      const result = await validatePlatformLink(platform, link.url);

      if (result.success) {
        setPlatformLinks((links) => ({
          ...links,
          [platform]: (links[platform] ?? []).map((l, i) =>
            i === index
              ? {
                  ...l,
                  verified: true,
                  verifiedAt: new Date().toISOString(),
                  verifiedDisplayName: result.displayName,
                  verifiedImage: result.image,
                  verifiedFollowers: result.followers,
                  youtubeEnrichment: result.youtubeEnrichment,
                }
              : l
          ),
        }));

        // After successful verification, check for duplicates
        const dupResult = await checkDuplicateLink(platform, link.url);
        setDuplicateResults((prev) => ({ ...prev, [verifyKey]: dupResult }));

        // Check if this is the creator's own link
        if (session?.creatorSlug) {
          const isOwn = isOwnLink(platform, link.url);
          setOwnLinkMatches((prev) => ({ ...prev, [verifyKey]: isOwn }));
        }
      } else {
        setVerificationErrors((prev) => ({
          ...prev,
          [verifyKey]: result.error || "Verification failed",
        }));
      }
    } catch {
      setVerificationErrors((prev) => ({
        ...prev,
        [verifyKey]: "Verification failed. Please try again.",
      }));
    } finally {
      setVerifyingLinks((prev) => ({ ...prev, [verifyKey]: false }));
    }
  };

  // Get all verified links for ecosystem preview
  const getVerifiedLinks = useCallback((): VerifiedLinkData[] => {
    const verifiedLinks: VerifiedLinkData[] = [];

    for (const platform of selectedPlatforms) {
      const links = platformLinks[platform];
      if (!links) continue;
      for (const link of links) {
        if (link.verified) {
          verifiedLinks.push({
            platform,
            displayName: link.verifiedDisplayName ?? null,
            image: link.verifiedImage ?? null,
            followers: link.verifiedFollowers ?? null,
            verifiedAt: link.verifiedAt ?? new Date().toISOString(),
            youtubeEnrichment: link.youtubeEnrichment,
          });
        }
      }
    }

    return verifiedLinks;
  }, [selectedPlatforms, platformLinks]);

  // Get primary profile image
  const getPrimaryProfileImage = useCallback((): string | null => {
    const verified = getVerifiedLinks();
    if (verified.length === 0) return null;

    const youtubeLink = verified.find(
      (l) => l.platform.toLowerCase() === "youtube" && l.image
    );
    if (youtubeLink?.image) return youtubeLink.image;

    const withFollowers = verified.filter((l) => l.image && l.followers);
    if (withFollowers.length > 0) {
      withFollowers.sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
      return withFollowers[0]?.image ?? null;
    }

    const withImage = verified.find((l) => l.image);
    return withImage?.image ?? null;
  }, [getVerifiedLinks]);

  // Check if at least one YouTube link is verified
  const hasVerifiedYouTube = selectedPlatforms.includes("YouTube") &&
    (platformLinks.YouTube ?? []).some((link) => link.verified);

  // Check if any links are flagged as own
  const hasOwnLinkMatch = Object.values(ownLinkMatches).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const sanitizedLinks = sanitizePlatformLinks(platformLinks);

      const result = await submitCreatorRequest({
        creatorName: formData.creatorName,
        niches: selectedNiches,
        customNiche: customNiche || undefined,
        platforms: selectedPlatforms,
        platformLinks: sanitizedLinks,
        website: formData.website || undefined,
        about: formData.about || undefined,
        submitterName: formData.submitterName,
        submitterEmail: formData.submitterEmail,
        submitterRelation: formData.submitterRelation || undefined,
        submissionType: submissionType as "self" | "other",
        verifiedLinks: getVerifiedLinks(),
        primaryProfileImage: getPrimaryProfileImage(),
      });

      if (result.success) {
        setIsSubmitted(true);
        toast.success("Your request has been logged. You can track its progress here.");
        if (isLoggedIn) {
          router.push("/dashboard/activity");
        } else if (result.trackingId) {
          router.push(`/track/${result.trackingId}`);
        }
      } else {
        setSubmitError(result.message);
      }
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if at least one link has a URL
  const hasAtLeastOneLink = selectedPlatforms.some(
    (platform) => platformLinks[platform]?.some((link) => link.url.trim() !== "")
  );

  // Check if form can be submitted
  const canSubmit = emailVerified &&
    hasAtLeastOneLink &&
    selectedNiches.length > 0 &&
    (!selectedPlatforms.includes("YouTube") || hasVerifiedYouTube) &&
    !hasOwnLinkMatch;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-slate-400">Redirecting...</p>
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
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </Link>
            <AuthButton />
          </div>
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

            {/* Logged-in user banner */}
            {isLoggedIn && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#319E31]/10 border border-[#319E31]/20">
                <ShieldCheck className="w-5 h-5 text-[#319E31] flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-slate-300">Submitting as </span>
                  <span className="text-white font-medium">{session.name}</span>
                  <span className="text-slate-400"> ({session.email})</span>
                </div>
              </div>
            )}

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
                  pattern="^[a-zA-Z0-9\s\-'._]+$"
                  title="Only letters, numbers, spaces, hyphens, apostrophes, dots, and underscores are allowed"
                  maxLength={100}
                  className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors"
                />
              </div>

              {/* Niches - Multi-select */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Content Niches *</label>
                <NicheMultiSelect
                  selectedNiches={selectedNiches}
                  onChange={setSelectedNiches}
                  onOtherSelected={setCustomNiche}
                  customNiche={customNiche}
                  maxSelections={3}
                  placeholder="Select up to 3 niches..."
                  required
                />
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
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Social Media Links</label>
                  <p className="text-xs text-slate-500">
                    {selectedPlatforms.includes("YouTube")
                      ? "YouTube verification is required. Other platforms are optional but help build your ecosystem."
                      : "At least one link is required. YouTube is recommended as your primary platform."}
                  </p>
                </div>

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

                      {links.map((link, index) => {
                        const verifyKey = `${platform}-${index}`;
                        const isVerifying = verifyingLinks[verifyKey];
                        const verifyError = verificationErrors[verifyKey];
                        const dupResult = duplicateResults[verifyKey];
                        const isOwn = ownLinkMatches[verifyKey];

                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={link.label}
                                  onChange={(e) => updatePlatformLink(platform, index, "label", e.target.value)}
                                  placeholder="Label (e.g., Main Channel, Vlog Channel)"
                                  pattern="^[a-zA-Z0-9\s\-'._]+$"
                                  title="Only letters, numbers, spaces, hyphens, and dots are allowed"
                                  maxLength={100}
                                  className="w-full h-9 px-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    type={platform === "YouTube" ? "text" : "url"}
                                    value={link.url}
                                    pattern={platform === "YouTube" ? "^(@?[\\w.\\-]+|https?://[\\w.\\-/]+)$" : "^https?://[\\w.\\-/]+$"}
                                    title={platform === "YouTube" ? "Enter a valid YouTube handle (@username) or URL" : `Enter a valid ${platform} URL (e.g. https://${platform.toLowerCase()}.com/...)`}
                                    onChange={(e) => {
                                      updatePlatformLink(platform, index, "url", e.target.value);
                                      // Clear verification when URL changes
                                      if (link.verified) {
                                        setPlatformLinks((links) => ({
                                          ...links,
                                          [platform]: (links[platform] ?? []).map((l, i) =>
                                            i === index
                                              ? { ...l, verified: false, verifiedDisplayName: null, verifiedImage: null, verifiedFollowers: null }
                                              : l
                                          ),
                                        }));
                                      }
                                      // Clear errors and results when URL changes
                                      if (platform === "YouTube") {
                                        setVerificationErrors((prev) => {
                                          const newErrors = { ...prev };
                                          delete newErrors[`${platform}-${index}`];
                                          return newErrors;
                                        });
                                      }
                                      setDuplicateResults((prev) => {
                                        const next = { ...prev };
                                        delete next[verifyKey];
                                        return next;
                                      });
                                      setOwnLinkMatches((prev) => {
                                        const next = { ...prev };
                                        delete next[verifyKey];
                                        return next;
                                      });
                                    }}
                                    onBlur={() => {
                                      if (platform === "YouTube" && link.url.trim()) {
                                        if (!isValidYouTubeInput(link.url)) {
                                          setVerificationErrors((prev) => ({
                                            ...prev,
                                            [`${platform}-${index}`]: "Please enter a valid YouTube channel URL or handle (e.g. @263tube)",
                                          }));
                                        } else {
                                          const normalized = normalizeYouTubeInput(link.url);
                                          if (normalized !== link.url) {
                                            updatePlatformLink(platform, index, "url", normalized);
                                          }
                                        }
                                      }
                                    }}
                                    placeholder={platform === "YouTube" ? "@handle or https://youtube.com/@channel" : `https://${platform.toLowerCase()}.com/@channel`}
                                    className={`flex-1 h-10 px-3 bg-white/[0.05] border rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none transition-colors ${
                                      link.verified
                                        ? "border-[#319E31]/50 focus:border-[#319E31]"
                                        : verificationErrors[`${platform}-${index}`]
                                        ? "border-red-500/50 focus:border-red-500"
                                        : "border-white/[0.1] focus:border-[#DE2010]/50"
                                    }`}
                                  />
                                  {/* Verify Button */}
                                  <button
                                    type="button"
                                    onClick={() => verifyLink(platform, index)}
                                    disabled={!link.url.trim() || isVerifying}
                                    className={`h-10 px-3 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 ${
                                      link.verified
                                        ? "bg-[#319E31]/20 text-[#319E31] border border-[#319E31]/30"
                                        : isVerifying
                                        ? "bg-white/[0.05] text-slate-400 border border-white/[0.1] cursor-wait"
                                        : link.url.trim()
                                        ? "bg-[#FFD200]/10 text-[#FFD200] border border-[#FFD200]/30 hover:bg-[#FFD200]/20"
                                        : "bg-white/[0.02] text-slate-500 border border-white/[0.05] cursor-not-allowed"
                                    }`}
                                  >
                                    {isVerifying ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span className="hidden sm:inline">Verifying...</span>
                                      </>
                                    ) : link.verified ? (
                                      <>
                                        <BadgeCheck className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Verified</span>
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Verify</span>
                                      </>
                                    )}
                                  </button>
                                </div>
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

                            {/* Verification Result */}
                            {link.verified && (link.verifiedDisplayName || link.verifiedFollowers) && (
                              <div className="ml-0 p-2 rounded-lg bg-[#319E31]/10 border border-[#319E31]/20 flex items-center gap-2">
                                {link.verifiedImage && (
                                  <Image
                                    src={link.verifiedImage}
                                    alt={link.verifiedDisplayName || platform}
                                    width={24}
                                    height={24}
                                    className="rounded-md"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-[#319E31] font-medium truncate">
                                    {link.verifiedDisplayName || "Verified"}
                                  </p>
                                  {link.verifiedFollowers && (
                                    <p className="text-xs text-slate-400">
                                      {link.verifiedFollowers >= 1000000
                                        ? `${(link.verifiedFollowers / 1000000).toFixed(1)}M`
                                        : link.verifiedFollowers >= 1000
                                        ? `${(link.verifiedFollowers / 1000).toFixed(1)}K`
                                        : link.verifiedFollowers} followers
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Duplicate Detection Warning */}
                            {dupResult?.isDuplicate && (
                              <div className="p-2 rounded-lg bg-[#FFD200]/10 border border-[#FFD200]/20 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-[#FFD200] flex-shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <p className="text-[#FFD200] font-medium">
                                    This channel is already listed as <span className="text-white">{dupResult.creatorName}</span>.
                                  </p>
                                  <Link
                                    href={`/claim?creator=${dupResult.creatorSlug}`}
                                    className="text-[#FFD200] hover:underline mt-1 inline-block"
                                  >
                                    Claim This Profile &rarr;
                                  </Link>
                                </div>
                              </div>
                            )}

                            {/* Portfolio Prevention Warning */}
                            {isOwn && (
                              <div className="p-2 rounded-lg bg-[#DE2010]/10 border border-[#DE2010]/20 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-[#DE2010] flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-[#DE2010] font-medium">
                                  You are already the verified owner of this channel.
                                </p>
                              </div>
                            )}

                            {/* Verification Error */}
                            {verifyError && (
                              <p className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {verifyError}
                              </p>
                            )}

                            {/* Handle to Link Preview */}
                            {link.url.trim() &&
                              !link.url.trim().startsWith("http") &&
                              !link.verified && (() => {
                                const previewUrl = formatSocialLink(platform, link.url);
                                return previewUrl ? (
                                  <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    You are submitting:{" "}
                                    <span className="text-slate-300 font-mono truncate">
                                      {previewUrl}
                                    </span>
                                  </p>
                                ) : null;
                              })()}
                          </div>
                        );
                      })}

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

            {/* Ecosystem Preview */}
            {getVerifiedLinks().length > 0 && (
              <EcosystemPreview
                creatorName={formData.creatorName}
                niche={selectedNiches.map(getNicheLabel).join(", ")}
                verifiedLinks={getVerifiedLinks()}
                primaryImage={getPrimaryProfileImage()}
              />
            )}

            {/* Submitter Information - Only shown for guests */}
            {!isLoggedIn && (
              <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                <h2 className="text-lg font-semibold text-white">Your Contact Information</h2>
                <p className="text-xs text-slate-500">Verify your email to submit. This helps us reduce spam.</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.submitterName}
                      onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                      placeholder="John Doe"
                      pattern="^[a-zA-Z\s\-'.]+$"
                      title="Only letters, spaces, hyphens, and apostrophes are allowed"
                      maxLength={100}
                      className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Your Email *
                      {emailVerified && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[#319E31]">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={formData.submitterEmail}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="john@example.com"
                        disabled={emailVerified}
                        className={`flex-1 h-12 px-4 bg-white/[0.05] border rounded-xl text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
                          emailVerified
                            ? "border-[#319E31]/50 bg-[#319E31]/5"
                            : "border-white/[0.1] focus:border-[#DE2010]/50"
                        } disabled:opacity-75`}
                      />
                      {!emailVerified && !codeSent && (
                        <button
                          type="button"
                          onClick={handleSendVerificationCode}
                          disabled={sendingCode || !formData.submitterEmail.includes("@")}
                          className="h-12 px-4 bg-[#FFD200]/10 text-[#FFD200] border border-[#FFD200]/30 rounded-xl font-medium text-sm hover:bg-[#FFD200]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {sendingCode ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="hidden sm:inline">Sending...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              <span className="hidden sm:inline">Verify</span>
                            </>
                          )}
                        </button>
                      )}
                      {emailVerified && (
                        <button
                          type="button"
                          onClick={() => {
                            setEmailVerified(false);
                            setFormData({ ...formData, submitterEmail: "" });
                          }}
                          className="h-12 px-4 text-slate-400 hover:text-white border border-white/[0.1] rounded-xl text-sm transition-colors"
                        >
                          Change
                        </button>
                      )}
                    </div>
                    {emailError && (
                      <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {emailError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Verification Code Input */}
                {codeSent && !emailVerified && (
                  <div className="p-4 rounded-xl bg-[#FFD200]/5 border border-[#FFD200]/20">
                    <p className="text-sm text-[#FFD200] mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      We&apos;ve sent a 6-digit code to {formData.submitterEmail}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setVerificationCode(value);
                          setCodeError(null);
                        }}
                        placeholder="000000"
                        maxLength={6}
                        className="flex-1 h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-center text-xl font-mono tracking-[0.5em] placeholder:text-slate-500 placeholder:tracking-[0.5em] focus:outline-none focus:border-[#FFD200]/50"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verifyingCode || verificationCode.length !== 6}
                        className="h-12 px-6 bg-[#FFD200] text-black font-semibold rounded-xl hover:bg-[#FFD200]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {verifyingCode ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Verify</span>
                      </button>
                    </div>
                    {codeError && (
                      <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {codeError}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={sendingCode}
                        className="text-[#FFD200] hover:underline disabled:opacity-50"
                      >
                        {sendingCode ? "Sending..." : "Resend code"}
                      </button>
                      {codeExpiresAt && (
                        <span className="text-slate-500">
                          Code expires at {codeExpiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {submissionType === "other" && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Your Relation to Creator (optional)</label>
                    <input
                      type="text"
                      value={formData.submitterRelation}
                      onChange={(e) => setFormData({ ...formData, submitterRelation: e.target.value })}
                      placeholder="e.g. Fan, Manager, Friend"
                      pattern="^[a-zA-Z\s\-',]+$"
                      title="Only letters, spaces, hyphens, commas, and apostrophes are allowed"
                      maxLength={100}
                      className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Relation field for logged-in users submitting "other" */}
            {isLoggedIn && submissionType === "other" && (
              <div className="pt-4 border-t border-white/[0.05]">
                <label className="block text-sm text-slate-400 mb-2">Your Relation to Creator (optional)</label>
                <input
                  type="text"
                  value={formData.submitterRelation}
                  onChange={(e) => setFormData({ ...formData, submitterRelation: e.target.value })}
                  placeholder="e.g. Fan, Manager, Friend"
                  pattern="^[a-zA-Z\s\-',]+$"
                  title="Only letters, spaces, hyphens, commas, and apostrophes are allowed"
                  maxLength={100}
                  className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                />
              </div>
            )}

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
              {/* Email verification requirement notice (guest only) */}
              {!isLoggedIn && !emailVerified && formData.submitterEmail && (
                <div className="mb-4 p-3 rounded-lg bg-[#FFD200]/10 border border-[#FFD200]/20">
                  <p className="text-xs text-[#FFD200] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    Please verify your email address to enable submission.
                  </p>
                </div>
              )}

              {/* YouTube verification requirement notice */}
              {selectedPlatforms.includes("YouTube") && !hasVerifiedYouTube && hasAtLeastOneLink && emailVerified && (
                <div className="mb-4 p-3 rounded-lg bg-[#FFD200]/10 border border-[#FFD200]/20">
                  <p className="text-xs text-[#FFD200] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Please verify your YouTube channel before submitting. This helps us confirm your profile.
                  </p>
                </div>
              )}

              {/* Own link match prevention notice */}
              {hasOwnLinkMatch && (
                <div className="mb-4 p-3 rounded-lg bg-[#DE2010]/10 border border-[#DE2010]/20">
                  <p className="text-xs text-[#DE2010] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    One or more links match your own verified profile. Please remove them to submit.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
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
                {!emailVerified
                  ? "Verify your email to enable submission"
                  : selectedPlatforms.includes("YouTube") && !hasVerifiedYouTube
                  ? "Verify your YouTube channel to enable submission"
                  : hasOwnLinkMatch
                  ? "Remove your own links to submit"
                  : "Submissions are reviewed within 48 hours"}
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
