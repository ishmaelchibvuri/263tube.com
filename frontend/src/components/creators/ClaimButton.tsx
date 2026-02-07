"use client";

import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

interface ClaimButtonProps {
  slug: string;
  isAuthenticated: boolean;
}

export function ClaimButton({ slug, isAuthenticated }: ClaimButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (isAuthenticated) {
      router.push(`/claim?creator=${slug}`);
    } else {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/claim?creator=${slug}`)}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD200]/10 hover:bg-[#FFD200]/20 border border-[#FFD200]/30 text-[#FFD200] text-sm font-semibold rounded-xl transition-all"
    >
      <Shield className="w-4 h-4" />
      Claim This Page
    </button>
  );
}
