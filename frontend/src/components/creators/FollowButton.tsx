"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { followCreator } from "@/lib/actions/follow";

interface FollowButtonProps {
  slug: string;
  initialCount: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toString();
}

export function FollowButton({ slug, initialCount }: FollowButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [followed, setFollowed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    if (followed || isPending) return;

    // Optimistic update
    setCount((prev) => prev + 1);
    setFollowed(true);

    startTransition(async () => {
      try {
        const result = await followCreator(slug);
        setCount(result.followCount);
      } catch {
        // Revert on failure
        setCount((prev) => prev - 1);
        setFollowed(false);
      }
    });
  };

  return (
    <button
      onClick={handleFollow}
      disabled={followed || isPending}
      className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
        followed
          ? "bg-pink-500/20 border border-pink-500/30 text-pink-400 cursor-default"
          : "bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white"
      }`}
    >
      <Heart
        className={`w-4 h-4 transition-all ${followed ? "fill-pink-400 text-pink-400 scale-110" : ""}`}
      />
      {followed ? "Followed" : "Follow"}
      {count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          followed
            ? "bg-pink-500/20 text-pink-300"
            : "bg-white/[0.08] text-slate-400"
        }`}>
          {formatCount(count)}
        </span>
      )}
    </button>
  );
}
