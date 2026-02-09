import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getAllCreators } from "@/lib/creators";
import { getAllCategories } from "@/lib/actions/categories";
import { isAdmin } from "@/lib/auth-server";
import { CreatorsGrid } from "@/components/creators/CreatorsGrid";
import { AuthButton } from "@/components/home/AuthButton";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Discover Creators - 263Tube",
  description:
    "Browse 500+ Zimbabwean content creators across YouTube, TikTok, Instagram, and more. Find creators by category, platform, or search.",
};

// Loading skeleton for the grid
function CreatorsGridSkeleton() {
  return (
    <div className="px-4 sm:px-6 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden animate-pulse"
            >
              <div className="h-24 bg-white/[0.05]" />
              <div className="p-3">
                <div className="h-4 bg-white/[0.05] rounded mb-2 w-3/4" />
                <div className="h-3 bg-white/[0.05] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CreatorsPage() {
  // Fetch all creators (all statuses), categories, and admin status in parallel
  const [active, featured, pending, categories, adminStatus] = await Promise.all([
    getAllCreators("ACTIVE"),
    getAllCreators("FEATURED"),
    getAllCreators("PENDING_REVIEW"),
    getAllCategories(),
    isAdmin(),
  ]);
  const creators = [...active, ...featured, ...pending];

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#DE2010]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#319E31]/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-3">
              <Link
                href="/submit"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Submit Creator
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="relative py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
            Discover <span className="text-gradient-zim">Zim Creators</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Browse {creators.length > 0 ? `${creators.length}+` : "500+"} Zimbabwean
            content creators across all platforms
          </p>
        </div>
      </header>

      {/* Creators Grid with Client-side Filtering */}
      <Suspense fallback={<CreatorsGridSkeleton />}>
        <CreatorsGrid creators={creators} categories={categories} isAdmin={adminStatus} />
      </Suspense>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.05] bg-black/40">
        <div className="h-1 bg-gradient-to-r from-[#319E31] via-[#FFD200] to-[#DE2010]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="263Tube"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm font-semibold text-white">
                263<span className="text-[#DE2010]">Tube</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/submit" className="hover:text-white transition-colors">
                Submit Creator
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
            <p className="text-xs text-slate-600">
              &copy; 2025 263Tube. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
