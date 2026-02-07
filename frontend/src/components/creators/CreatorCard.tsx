"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, ArrowUpRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatorCardProps {
  name: string;
  slug: string;
  profilePicUrl: string;
  coverImageUrl?: string;
  niche: string;
  totalReach: number;
  engagementScore?: number;
  engagementLabel?: string;
  engagementColor?: string;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function CreatorCard({
  name,
  slug,
  profilePicUrl,
  coverImageUrl,
  niche,
  totalReach,
  engagementScore,
  engagementLabel,
  engagementColor,
  className,
}: CreatorCardProps) {
  return (
    <Link
      href={`/creator/${slug}`}
      className={cn(
        "group relative block rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] transition-all duration-300 hover:border-[#DE2010]/30 hover:-translate-y-1",
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative h-28 overflow-hidden">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={`${name} cover`}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#DE2010]/20 via-slate-800 to-slate-900" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-transparent" />

        {/* Hover indicator */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowUpRight className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Avatar */}
      <div className="relative flex justify-center">
        <div className="absolute -top-8 w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#09090b] bg-slate-800 shadow-lg">
          {profilePicUrl ? (
            <Image
              src={profilePicUrl}
              alt={name}
              fill
              loading="lazy"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#DE2010] to-[#b01a0d]">
              <span className="text-xl font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 pb-5 px-4 text-center">
        {/* Name */}
        <h3 className="text-base font-semibold text-white truncate group-hover:text-[#FFD200] transition-colors duration-300">
          {name}
        </h3>

        {/* Niche Tag */}
        <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.05] text-slate-400 border border-white/[0.05] group-hover:bg-[#DE2010]/10 group-hover:text-[#DE2010] group-hover:border-[#DE2010]/20 transition-all duration-300">
          {niche}
        </span>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-4 mt-4 text-slate-500">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span className="text-sm">
              <span className="font-medium text-white">
                {formatNumber(totalReach)}
              </span>
            </span>
          </div>
          {engagementScore !== undefined && (
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-sm">
                <span className={cn("font-medium", engagementColor || "text-white")}>
                  {engagementScore}
                </span>
                <span className="text-[10px] text-slate-600">/10</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default CreatorCard;
