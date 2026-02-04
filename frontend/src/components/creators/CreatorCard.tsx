"use client";

import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatorCardProps {
  name: string;
  slug: string;
  profilePicUrl: string;
  coverImageUrl?: string;
  niche: string;
  totalReach: number;
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
  className,
}: CreatorCardProps) {
  return (
    <Link
      href={`/creator/${slug}`}
      className={cn("creator-card group block", className)}
    >
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-secondary overflow-hidden">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={`${name} cover`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-slate-800 to-slate-900" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      </div>

      {/* Avatar */}
      <div className="relative flex justify-center">
        <div className="absolute -top-10 w-20 h-20 rounded-full border-4 border-card overflow-hidden bg-secondary">
          {profilePicUrl ? (
            <Image
              src={profilePicUrl}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/20">
              <span className="text-2xl font-bold text-primary">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 pb-5 px-4 text-center">
        {/* Name */}
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Niche Tag */}
        <span className="niche-tag mt-2">{niche}</span>

        {/* Total Reach */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-sm">
            <span className="font-semibold text-foreground">
              {formatNumber(totalReach)}
            </span>{" "}
            Total Reach
          </span>
        </div>

        {/* View Profile Button */}
        <button className="w-full mt-4 py-2.5 px-4 bg-primary/10 text-primary font-medium rounded-lg border border-primary/20 transition-all duration-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary">
          View Profile
        </button>
      </div>
    </Link>
  );
}

export default CreatorCard;
