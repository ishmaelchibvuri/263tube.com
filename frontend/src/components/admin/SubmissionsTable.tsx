"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Check,
  X,
  ExternalLink,
  Loader2,
  User,
  Calendar,
  Tag,
  BadgeCheck,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronDown,
  ChevronUp,
  Mail,
  RefreshCw,
  Copy,
  KeyRound,
} from "lucide-react";
import {
  approveCreator,
  approveWithBadge,
  rejectCreator,
  requestVerificationProof,
  reverifyOwnership,
} from "@/lib/actions/admin";
import { getNicheLabel } from "@/constants/niches";
import { EcosystemPreview } from "@/components/submit";

interface PlatformLink {
  label: string;
  url: string;
  verified?: boolean;
  verifiedDisplayName?: string | null;
  verifiedImage?: string | null;
  verifiedFollowers?: number | null;
}

interface VerifiedLinkData {
  platform: string;
  displayName: string | null;
  image: string | null;
  followers: number | null;
  verifiedAt: string;
  youtubeEnrichment?: {
    totalVideos: number | null;
    monthlyViews: number | null;
    engagementRate: number | null;
    channelId: string | null;
    dataFetchedAt: string;
  };
}

interface OwnershipVerification {
  isVerified: boolean;
  channelTitle: string | null;
  channelId: string | null;
  riskLevel: "verified" | "unverified" | "suspicious";
  emailFound: string | null;
  emailChecked: string | null;
  message: string;
  verifiedAt: string;
}

export interface Submission {
  pk: string;
  requestId: string;
  creatorName: string;
  slug: string;
  /** @deprecated Use niches array instead */
  niche?: string;
  /** Array of selected niches from the taxonomy */
  niches?: string[];
  /** Primary niche (first selected) */
  primaryNiche?: string;
  /** Custom niche suggestion if "other" was selected */
  customNiche?: string | null;
  platforms: string[];
  platformLinks: Record<string, PlatformLink[]>;
  website?: string;
  about?: string;
  submitterName: string;
  submitterEmail: string;
  submitterRelation?: string;
  submissionType: "self" | "other";
  createdAt: string;
  // Verification data
  verifiedLinks?: VerifiedLinkData[];
  verifiedLinkCount?: number;
  primaryProfileImage?: string | null;
  // Ownership verification
  ownershipVerification?: OwnershipVerification;
  verificationCode?: string | null;
}

interface SubmissionsTableProps {
  submissions: Submission[];
}

// Risk badge component
function RiskBadge({ verification }: { verification?: OwnershipVerification }) {
  if (!verification) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 text-xs font-medium">
        <ShieldAlert className="w-3 h-3" />
        Not Checked
      </span>
    );
  }

  switch (verification.riskLevel) {
    case "verified":
      return (
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#319E31]/10 text-[#319E31] text-xs font-medium"
          title={verification.message}
        >
          <ShieldCheck className="w-3 h-3" />
          Verified Owner
        </span>
      );
    case "unverified":
      return (
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFD200]/10 text-[#FFD200] text-xs font-medium"
          title={verification.message}
        >
          <ShieldAlert className="w-3 h-3" />
          Unverified Owner
        </span>
      );
    case "suspicious":
      return (
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DE2010]/10 text-[#DE2010] text-xs font-medium"
          title={verification.message}
        >
          <ShieldX className="w-3 h-3" />
          Suspicious Link
        </span>
      );
    default:
      return null;
  }
}

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [localSubmissions, setLocalSubmissions] = useState(submissions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<Record<string, string>>({});

  const handleApprove = async (submission: Submission) => {
    setProcessingId(submission.pk);
    setActionResult(null);

    try {
      const result = await approveCreator(submission.pk);

      if (result.success) {
        setActionResult({ type: "success", message: result.message });
        setLocalSubmissions((prev) =>
          prev.filter((s) => s.pk !== submission.pk)
        );
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "An error occurred. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveWithBadge = async (submission: Submission) => {
    setProcessingId(submission.pk);
    setActionResult(null);

    try {
      const result = await approveWithBadge(submission.pk);

      if (result.success) {
        setActionResult({ type: "success", message: result.message });
        setLocalSubmissions((prev) =>
          prev.filter((s) => s.pk !== submission.pk)
        );
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "An error occurred. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submission: Submission) => {
    setProcessingId(submission.pk);
    setActionResult(null);

    try {
      const result = await rejectCreator(submission.pk);

      if (result.success) {
        setActionResult({ type: "success", message: result.message });
        setLocalSubmissions((prev) =>
          prev.filter((s) => s.pk !== submission.pk)
        );
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "An error occurred. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestVerification = async (submission: Submission) => {
    setProcessingId(submission.pk);
    setActionResult(null);

    try {
      const result = await requestVerificationProof(submission.pk);

      if (result.success && result.verificationCode) {
        setGeneratedCodes((prev) => ({
          ...prev,
          [submission.pk]: result.verificationCode!,
        }));
        // Update local submission with the code
        setLocalSubmissions((prev) =>
          prev.map((s) =>
            s.pk === submission.pk
              ? { ...s, verificationCode: result.verificationCode! }
              : s
          )
        );
        setActionResult({ type: "success", message: result.message });
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "An error occurred. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReverify = async (submission: Submission) => {
    setProcessingId(submission.pk);
    setActionResult(null);

    try {
      const result = await reverifyOwnership(submission.pk);

      if (result.success) {
        setActionResult({ type: "success", message: result.message });
        // Refresh would be needed to see updated verification data;
        // for now just show the result
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "An error occurred. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setActionResult({ type: "success", message: "Code copied to clipboard!" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (localSubmissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.05] flex items-center justify-center">
          <Check className="w-8 h-8 text-[#319E31]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          All caught up!
        </h3>
        <p className="text-slate-400 text-sm">
          No pending submissions to review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Result Toast */}
      {actionResult && (
        <div
          className={`p-4 rounded-xl border ${
            actionResult.type === "success"
              ? "bg-[#319E31]/10 border-[#319E31]/20 text-[#319E31]"
              : "bg-[#DE2010]/10 border-[#DE2010]/20 text-[#DE2010]"
          }`}
        >
          {actionResult.message}
        </div>
      )}

      {/* Submissions List */}
      <div className="space-y-4">
        {localSubmissions.map((submission) => {
          const isProcessing = processingId === submission.pk;
          const isExpanded = expandedId === submission.pk;
          const displayCode =
            generatedCodes[submission.pk] || submission.verificationCode;

          return (
            <div
              key={submission.pk}
              className="bg-white/[0.02] border border-white/[0.05] rounded-xl"
            >
              {/* Header - Clickable to expand */}
              <div
                className="p-6 cursor-pointer"
                onClick={() =>
                  setExpandedId(isExpanded ? null : submission.pk)
                }
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {/* Profile Image if verified */}
                    {submission.primaryProfileImage ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                        <Image
                          src={submission.primaryProfileImage}
                          alt={submission.creatorName}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-white">
                          {submission.creatorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold text-white">
                          {submission.creatorName}
                        </h3>
                        {/* Risk Badge */}
                        <RiskBadge
                          verification={submission.ownershipVerification}
                        />
                        {/* Platform-specific verified badges */}
                        {submission.verifiedLinks &&
                          submission.verifiedLinks.length > 0 && (
                            <div className="flex items-center gap-1">
                              {submission.verifiedLinks.map((link) => (
                                <span
                                  key={`${link.platform}-badge`}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#319E31]/10 text-[#319E31] text-xs font-medium"
                                  title={`${link.displayName || link.platform} - ${link.followers?.toLocaleString() || 0} followers`}
                                >
                                  <BadgeCheck className="w-3 h-3" />
                                  {link.platform}
                                </span>
                              ))}
                            </div>
                          )}
                        {/* Fallback to count if no detailed verified links */}
                        {(!submission.verifiedLinks ||
                          submission.verifiedLinks.length === 0) &&
                          submission.verifiedLinkCount &&
                          submission.verifiedLinkCount > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#319E31]/10 text-[#319E31] text-xs font-medium">
                              <ShieldCheck className="w-3 h-3" />
                              {submission.verifiedLinkCount} verified
                            </span>
                          )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {/* Display all selected niches */}
                        {(submission.niches || [submission.niche])
                          .filter(Boolean)
                          .map((niche, idx) => (
                            <span
                              key={niche}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                idx === 0
                                  ? "bg-[#DE2010]/10 text-[#DE2010]"
                                  : "bg-white/[0.05] text-slate-300"
                              }`}
                            >
                              {getNicheLabel(niche as string)}
                            </span>
                          ))}
                        {/* Show custom niche if present */}
                        {submission.customNiche && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
                            + {submission.customNiche}
                          </span>
                        )}
                        <span className="text-slate-500">
                          @{submission.slug}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Quick Info Row */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {submission.submitterName} ({submission.submitterEmail})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(submission.createdAt)}
                  </span>
                  <span>
                    {submission.submissionType === "self"
                      ? "Self-submission"
                      : `Suggested by: ${submission.submitterRelation || "Not specified"}`}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-white/[0.05]">
                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 gap-4 pt-4 mb-4">
                    {/* About */}
                    {submission.about && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-slate-400">
                          {submission.about}
                        </p>
                      </div>
                    )}

                    {/* Platforms */}
                    <div>
                      <h4 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Platforms
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {submission.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="px-2 py-1 rounded-md bg-white/[0.05] text-xs text-slate-300"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Submitter Info */}
                    <div>
                      <h4 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Submitted by
                      </h4>
                      <p className="text-sm text-slate-300">
                        {submission.submitterName}
                        <span className="text-slate-500 ml-2">
                          ({submission.submitterEmail})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {submission.submissionType === "self"
                          ? "Self-submission"
                          : `Relationship: ${submission.submitterRelation || "Not specified"}`}
                      </p>
                    </div>
                  </div>

                  {/* Ownership Verification Details */}
                  {submission.ownershipVerification && (
                    <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <h4 className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Ownership Verification
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500">Channel:</span>
                          <span className="ml-2 text-slate-300">
                            {submission.ownershipVerification.channelTitle ||
                              "Unknown"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Channel ID:</span>
                          <span className="ml-2 text-slate-300 font-mono">
                            {submission.ownershipVerification.channelId ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-500">Checked:</span>
                          <span className="ml-1 text-slate-300">
                            {submission.ownershipVerification.emailChecked ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-500">Found:</span>
                          <span className="ml-1 text-slate-300">
                            {submission.ownershipVerification.emailFound ||
                              "None"}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-500">Result:</span>
                          <span className="ml-2 text-slate-300">
                            {submission.ownershipVerification.message}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Checked at:</span>
                          <span className="ml-2 text-slate-300">
                            {formatDate(
                              submission.ownershipVerification.verifiedAt
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* YouTube Enrichment Stats */}
                  {submission.verifiedLinks?.some((l) => l.youtubeEnrichment) && (
                    <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <h4 className="text-xs font-medium text-slate-500 mb-3">YouTube Enrichment Data</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {(() => {
                          let vids = 0, views = 0, eng: number | null = null;
                          let hasVids = false, hasViews = false;
                          for (const l of submission.verifiedLinks!) {
                            const e = l.youtubeEnrichment;
                            if (!e) continue;
                            if (e.totalVideos != null) { vids += e.totalVideos; hasVids = true; }
                            if (e.monthlyViews != null) { views += e.monthlyViews; hasViews = true; }
                            if (eng == null && e.engagementRate != null) eng = e.engagementRate;
                          }
                          return (
                            <>
                              <div className="text-center">
                                <p className="text-lg font-bold text-white">{hasVids ? vids.toLocaleString() : "—"}</p>
                                <p className="text-xs text-slate-500">Total Videos</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-white">{hasViews ? views.toLocaleString() : "—"}</p>
                                <p className="text-xs text-slate-500">Monthly Views</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-white">{eng != null ? `${eng}%` : "—"}</p>
                                <p className="text-xs text-slate-500">Engagement</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Ecosystem Preview */}
                  {submission.verifiedLinks &&
                    submission.verifiedLinks.length > 0 && (
                      <div className="mb-4">
                        <EcosystemPreview
                          creatorName={submission.creatorName}
                          niche={
                            (submission.niches || [submission.niche])
                              .filter(Boolean)
                              .map((n) => getNicheLabel(n as string))
                              .join(", ") || "Creator"
                          }
                          verifiedLinks={submission.verifiedLinks}
                          primaryImage={submission.primaryProfileImage || null}
                        />
                      </div>
                    )}

                  {/* Social Links */}
                  <div className="border-t border-white/[0.05] pt-4 mb-4">
                    <h4 className="text-xs font-medium text-slate-500 mb-3">
                      Social Links
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(submission.platformLinks).map(
                        ([platform, links]) =>
                          links?.map((link, index) => (
                            <a
                              key={`${platform}-${index}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                link.verified
                                  ? "bg-[#319E31]/10 text-[#319E31] border border-[#319E31]/20 hover:bg-[#319E31]/20"
                                  : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
                              }`}
                            >
                              {link.verified && (
                                <BadgeCheck className="w-3 h-3" />
                              )}
                              {link.label || platform}
                              {link.verifiedFollowers && (
                                <span className="text-slate-400 ml-1">
                                  (
                                  {link.verifiedFollowers >= 1000
                                    ? `${(link.verifiedFollowers / 1000).toFixed(link.verifiedFollowers >= 10000 ? 0 : 1)}K`
                                    : link.verifiedFollowers}
                                  )
                                </span>
                              )}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))
                      )}
                      {submission.website && (
                        <a
                          href={submission.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-xs text-slate-300 hover:bg-white/[0.1] transition-colors"
                        >
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Verification Code Display */}
                  {displayCode && (
                    <div className="mb-4 p-3 rounded-lg bg-[#FFD200]/5 border border-[#FFD200]/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-[#FFD200]" />
                          <span className="text-xs text-[#FFD200]">
                            Pending verification code:
                          </span>
                          <code className="text-sm font-mono text-white bg-white/[0.1] px-2 py-0.5 rounded">
                            {displayCode}
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(displayCode);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.1] rounded-lg transition-colors"
                          title="Copy code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Creator should add this code to their YouTube channel
                        description, then click Re-verify.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/[0.05]">
                    {/* Reject */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(submission);
                      }}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#DE2010]/10 text-[#DE2010] hover:bg-[#DE2010]/20 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Reject
                    </button>

                    {/* Request Verification */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestVerification(submission);
                      }}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFD200]/10 text-[#FFD200] hover:bg-[#FFD200]/20 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4" />
                      )}
                      Verify
                    </button>

                    {/* Re-verify Ownership */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReverify(submission);
                      }}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Re-verify
                    </button>

                    {/* Approve */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(submission);
                      }}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#319E31] text-white hover:bg-[#28862a] transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>

                    {/* Approve + Badge (only when ownership is verified) */}
                    {submission.ownershipVerification?.isVerified && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveWithBadge(submission);
                        }}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#319E31] text-white hover:bg-[#28862a] transition-colors disabled:opacity-50 border border-[#319E31]"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <BadgeCheck className="w-4 h-4" />
                        )}
                        Approve + Badge
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      Submitted {formatDate(submission.createdAt)}
                    </div>
                    <span className="text-xs text-slate-600">
                      ID: {submission.requestId}
                    </span>
                  </div>
                </div>
              )}

              {/* Collapsed: show action buttons inline */}
              {!isExpanded && (
                <div className="px-6 pb-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(submission);
                    }}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DE2010]/10 text-[#DE2010] hover:bg-[#DE2010]/20 transition-colors disabled:opacity-50 text-xs"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    Reject
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(submission);
                    }}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#319E31] text-white hover:bg-[#28862a] transition-colors disabled:opacity-50 text-xs"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Approve
                  </button>
                  {displayCode && (
                    <span className="flex items-center gap-1 text-xs text-[#FFD200]">
                      <KeyRound className="w-3 h-3" />
                      Code pending
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
