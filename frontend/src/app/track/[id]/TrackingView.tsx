"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Copy, Check, SearchX } from "lucide-react";
import { StatusBadge } from "@/components/activity/StatusBadge";
import { AuthButton } from "@/components/home/AuthButton";
import type { TrackingResult } from "@/lib/actions/track";

interface TrackingViewProps {
  data: TrackingResult | null;
}

export default function TrackingView({ data }: TrackingViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data?.verificationCode) return;
    await navigator.clipboard.writeText(data.verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="263Tube"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-base font-bold text-white">
                263<span className="text-[#DE2010]">Tube</span>
              </span>
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {!data ? (
          /* Not Found */
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/[0.05] flex items-center justify-center">
              <SearchX className="w-7 h-7 text-slate-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Request Not Found
            </h1>
            <p className="text-sm text-slate-400 mb-8">
              This tracking link is invalid or the request has already been processed.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#DE2010] hover:bg-[#ff2a17] text-white font-medium rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        ) : (
          /* Tracking Card */
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Submission Tracker
              </h1>
              <p className="text-sm text-slate-400">
                Current status of your submission
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-4">
              {/* Creator & Status */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {data.creatorName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Submitted{" "}
                    {new Date(data.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <StatusBadge status={data.status} />
              </div>

              {/* Platforms */}
              <div className="flex flex-wrap gap-1.5">
                {data.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-2 py-0.5 text-xs rounded bg-white/[0.05] text-slate-400 border border-white/[0.05]"
                  >
                    {platform}
                  </span>
                ))}
              </div>

              {/* Verification Code Action Box */}
              {data.status === "PENDING_VERIFICATION" &&
                data.verificationCode && (
                  <div className="p-3 rounded-lg bg-[#DE2010]/5 border border-[#DE2010]/20">
                    <p className="text-xs text-slate-400 mb-2">
                      Place this code in your YouTube channel description, then
                      ask admin to re-verify:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white/[0.05] rounded-lg text-sm text-white font-mono truncate">
                        {data.verificationCode}
                      </code>
                      <button
                        onClick={handleCopy}
                        className="flex-shrink-0 h-9 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 bg-[#DE2010]/10 text-[#DE2010] border border-[#DE2010]/20 hover:bg-[#DE2010]/20"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
