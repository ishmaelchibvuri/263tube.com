"use client";

import { useState } from "react";
import { Share2, Check, Copy, Twitter, Facebook } from "lucide-react";

interface ShareButtonProps {
  creatorName: string;
  slug: string;
}

export function ShareButton({ creatorName, slug }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/creator/${slug}`
    : `/creator/${slug}`;

  const shareText = `Check out ${creatorName} on 263Tube!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${creatorName} - 263Tube`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      setShowMenu(!showMenu);
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] rounded-lg border border-white/[0.05] hover:border-[#DE2010]/30 transition-colors"
      >
        <Share2 className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-white">Share</span>
      </button>

      {/* Share Menu (for browsers without native share) */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1d] border border-white/[0.1] rounded-xl shadow-xl z-50 overflow-hidden">
            <button
              onClick={() => {
                handleCopyLink();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.05] transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#319E31]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </button>

            <button
              onClick={() => {
                shareToTwitter();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.05] transition-colors"
            >
              <Twitter className="w-4 h-4" />
              Share on X
            </button>

            <button
              onClick={() => {
                shareToFacebook();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.05] transition-colors"
            >
              <Facebook className="w-4 h-4" />
              Share on Facebook
            </button>
          </div>
        </>
      )}
    </div>
  );
}
