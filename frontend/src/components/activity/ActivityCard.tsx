"use client";

import { useState } from "react";
import { User, Users, Copy, Check } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { ActivityItem } from "@/lib/actions/activity";

interface ActivityCardProps {
  item: ActivityItem;
}

export function ActivityCard({ item }: ActivityCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!item.verificationCode) return;
    await navigator.clipboard.writeText(item.verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">
            {item.creatorName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">{date}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              {item.submissionType === "self" ? (
                <><User className="w-3 h-3" /> Self</>
              ) : (
                <><Users className="w-3 h-3" /> Suggestion</>
              )}
            </span>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {/* Platform Tags */}
      <div className="flex flex-wrap gap-1.5">
        {item.platforms.map((platform) => (
          <span
            key={platform}
            className="px-2 py-0.5 text-xs rounded bg-white/[0.05] text-slate-400 border border-white/[0.05]"
          >
            {platform}
          </span>
        ))}
      </div>

      {/* Verification Code Action Box */}
      {item.status === "PENDING_VERIFICATION" && item.verificationCode && (
        <div className="p-3 rounded-lg bg-[#DE2010]/5 border border-[#DE2010]/20">
          <p className="text-xs text-slate-400 mb-2">
            Place this code in your YouTube channel description, then ask admin to re-verify:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white/[0.05] rounded-lg text-sm text-white font-mono truncate">
              {item.verificationCode}
            </code>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 h-9 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 bg-[#DE2010]/10 text-[#DE2010] border border-[#DE2010]/20 hover:bg-[#DE2010]/20"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5" /> Copied</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
