"use client";

import Link from "next/link";
import Image from "next/image";
import { Flame, ArrowRight } from "lucide-react";
import type { Creator } from "@/lib/creators";

interface FeaturedCarouselProps {
  creators: Creator[];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

function FeaturedCard({
  creator,
  rank,
}: {
  creator: Creator;
  rank: number;
}) {
  const engagementRate = creator.metrics.engagementRate
    ? parseFloat(creator.metrics.engagementRate).toFixed(1) + "%"
    : creator.metrics.engagement
    ? creator.metrics.engagement.toFixed(1) + "%"
    : "N/A";

  return (
    <Link
      href={`/creator/${creator.slug}`}
      className="group relative flex-shrink-0 w-[200px] sm:w-[260px] rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.05] hover:border-[#DE2010]/30 transition-all duration-300"
    >
      {/* Cover Image */}
      <div className="relative h-24 sm:h-32 overflow-hidden">
        {creator.coverImageUrl || creator.bannerUrl ? (
          <Image
            src={creator.coverImageUrl || creator.bannerUrl || ""}
            alt={creator.name}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#DE2010]/30 via-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />

        {/* Rank Badge */}
        <div
          className={`absolute top-2 left-2 w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-xs font-bold ${
            rank === 1
              ? "bg-gradient-to-br from-[#FFD200] to-amber-500 text-amber-900"
              : rank === 2
              ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800"
              : rank === 3
              ? "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900"
              : "bg-white/20 backdrop-blur-sm text-white"
          }`}
        >
          {rank}
        </div>

        {/* Verified Badge */}
        {creator.verified && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-[#319E31]/30 backdrop-blur-md rounded-full flex items-center justify-center">
            <span className="text-[10px] text-[#319E31]">✓</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
            {creator.profilePicUrl ? (
              <Image
                src={creator.profilePicUrl}
                alt={creator.name}
                width={40}
                height={40}
                loading="lazy"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center text-white text-sm font-bold">
                {creator.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#FFD200] transition-colors">
              {creator.name}
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500">{creator.niche}</p>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-[10px] sm:text-xs text-slate-500">Engagement</span>
          <span className="text-xs sm:text-sm font-bold text-[#DE2010]">
            {engagementRate}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function FeaturedCarousel({ creators }: FeaturedCarouselProps) {
  if (creators.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-6 sm:mt-10 px-4 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#DE2010]" />
          <h2 className="text-sm sm:text-lg font-bold text-white">
            Most Engaging Creators
          </h2>
        </div>
        <Link
          href="/creators?sort=shares"
          className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1"
        >
          All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Scrolling Carousel - Contained */}
      <div className="relative overflow-hidden rounded-xl">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none" />

        {/* Scrolling Container */}
        <div className="flex gap-3 py-2 animate-scroll-left hover:pause-animation">
          {/* First set */}
          {creators.map((creator, index) => (
            <FeaturedCard key={creator.slug} creator={creator} rank={index + 1} />
          ))}
          {/* Duplicate set for seamless loop */}
          {creators.map((creator, index) => (
            <FeaturedCard
              key={`dup-${creator.slug}`}
              creator={creator}
              rank={index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
