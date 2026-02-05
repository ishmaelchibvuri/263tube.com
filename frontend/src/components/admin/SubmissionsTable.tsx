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
} from "lucide-react";
import { approveCreator, rejectCreator } from "@/lib/actions/admin";
import { getNicheLabel } from "@/constants/niches";

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
}

interface SubmissionsTableProps {
  submissions: Submission[];
}

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [localSubmissions, setLocalSubmissions] = useState(submissions);

  const handleApprove = async (submission: Submission) => {
    setProcessingId(submission.pk);
    setActionResult(null);

    try {
      const result = await approveCreator(submission.pk);

      if (result.success) {
        setActionResult({ type: "success", message: result.message });
        // Remove from local state
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
        // Remove from local state
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

          return (
            <div
              key={submission.pk}
              className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6"
            >
              {/* Header */}
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {submission.creatorName}
                      </h3>
                      {/* Platform-specific verified badges */}
                      {submission.verifiedLinks && submission.verifiedLinks.length > 0 && (
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
                      {(!submission.verifiedLinks || submission.verifiedLinks.length === 0) &&
                       submission.verifiedLinkCount && submission.verifiedLinkCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#319E31]/10 text-[#319E31] text-xs font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          {submission.verifiedLinkCount} verified
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {/* Display all selected niches */}
                      {(submission.niches || [submission.niche]).filter(Boolean).map((niche, idx) => (
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
                      <span className="text-slate-500">@{submission.slug}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(submission)}
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
                  <button
                    onClick={() => handleApprove(submission)}
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
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* About */}
                {submission.about && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-slate-400">{submission.about}</p>
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

              {/* Social Links */}
              <div className="border-t border-white/[0.05] pt-4">
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
                          {link.verified && <BadgeCheck className="w-3 h-3" />}
                          {link.label || platform}
                          {link.verifiedFollowers && (
                            <span className="text-slate-400 ml-1">
                              ({link.verifiedFollowers >= 1000
                                ? `${(link.verifiedFollowers / 1000).toFixed(link.verifiedFollowers >= 10000 ? 0 : 1)}K`
                                : link.verifiedFollowers})
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
          );
        })}
      </div>
    </div>
  );
}
