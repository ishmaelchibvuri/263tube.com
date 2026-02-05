"use client";

/**
 * 263Tube - Ecosystem Preview Component
 *
 * Shows a live preview of verified social media links as users verify them.
 * This gives users immediate satisfaction and shows how their profile will look.
 */

import Image from "next/image";
import {
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  Globe,
  CheckCircle,
  Users,
  ExternalLink,
} from "lucide-react";
import type { VerifiedLinkData } from "@/lib/actions/creators";

interface EcosystemPreviewProps {
  creatorName: string;
  niche: string;
  verifiedLinks: VerifiedLinkData[];
  primaryImage: string | null;
}

const PLATFORM_CONFIG: Record<
  string,
  { icon: typeof Youtube; color: string; bgColor: string; label: string }
> = {
  youtube: {
    icon: Youtube,
    color: "#FF0000",
    bgColor: "bg-[#FF0000]/10",
    label: "YouTube",
  },
  instagram: {
    icon: Instagram,
    color: "#E4405F",
    bgColor: "bg-[#E4405F]/10",
    label: "Instagram",
  },
  tiktok: {
    icon: Music2,
    color: "#00F2EA",
    bgColor: "bg-[#00F2EA]/10",
    label: "TikTok",
  },
  twitter: {
    icon: Twitter,
    color: "#1DA1F2",
    bgColor: "bg-[#1DA1F2]/10",
    label: "X/Twitter",
  },
  facebook: {
    icon: Facebook,
    color: "#1877F2",
    bgColor: "bg-[#1877F2]/10",
    label: "Facebook",
  },
  website: {
    icon: Globe,
    color: "#319E31",
    bgColor: "bg-[#319E31]/10",
    label: "Website",
  },
};

function formatFollowers(count: number | null): string {
  if (!count) return "";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function EcosystemPreview({
  creatorName,
  niche,
  verifiedLinks,
  primaryImage,
}: EcosystemPreviewProps) {
  if (verifiedLinks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 sm:p-6">
      {/* Preview Header */}
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-4 h-4 text-[#319E31]" />
        <h3 className="text-sm font-semibold text-white">Ecosystem Preview</h3>
        <span className="text-xs text-slate-500">
          ({verifiedLinks.length} verified)
        </span>
      </div>

      {/* Mini Profile Card */}
      <div className="bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.05] rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={creatorName || "Creator"}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#DE2010] to-[#b01a0d]">
                <span className="text-lg font-bold text-white">
                  {(creatorName || "C").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name & Niche */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">
              {creatorName || "Your Name"}
            </h4>
            <span className="text-xs text-slate-500">{niche || "Creator"}</span>
          </div>
        </div>
      </div>

      {/* Verified Links Grid */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 mb-3">
          Your verified social presence:
        </p>

        <div className="grid gap-2">
          {verifiedLinks.map((link, index) => {
            const platformKey = link.platform.toLowerCase();
            const config = PLATFORM_CONFIG[platformKey] ?? PLATFORM_CONFIG.website;
            const Icon = config!.icon;

            return (
              <div
                key={`${link.platform}-${index}`}
                className={`flex items-center gap-3 p-3 rounded-lg ${config!.bgColor} border border-white/[0.05]`}
              >
                {/* Platform Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${config!.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: config!.color }} />
                </div>

                {/* Profile Image (from verification) */}
                {link.image && (
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                    <Image
                      src={link.image}
                      alt={link.displayName || link.platform}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}

                {/* Display Name & Followers */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {link.displayName || config!.label}
                  </p>
                  {link.followers && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatFollowers(link.followers)} followers
                    </p>
                  )}
                </div>

                {/* Verified Badge */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#319E31]/20">
                  <CheckCircle className="w-3 h-3 text-[#319E31]" />
                  <span className="text-xs text-[#319E31]">Verified</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Note */}
      <div className="mt-4 pt-4 border-t border-white/[0.05]">
        <p className="text-xs text-slate-500 text-center">
          This is how your profile will appear on 263Tube
        </p>
      </div>
    </div>
  );
}
