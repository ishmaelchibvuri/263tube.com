import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { getCategoryStats } from "@/lib/actions/categories";
import { AuthButton } from "@/components/home/AuthButton";
import { CategoriesPageContent } from "./CategoriesPageContent";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoryStats();

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
                <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/creators" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
                All Creators
              </Link>
              <Link href="/trending" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
                Trending
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Dynamic Content */}
      <CategoriesPageContent categories={categories} />

      {/* CTA Section */}
      <section className="relative py-12 px-4 sm:px-6 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Don&apos;t see your niche?
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            We&apos;re always expanding our categories. Submit a creator and help us grow the directory.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#DE2010] hover:bg-[#ff2a17] text-white font-medium rounded-xl transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Submit a Creator
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.05] bg-black/40">
        <div className="h-1 bg-gradient-to-r from-[#319E31] via-[#FFD200] to-[#DE2010]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded overflow-hidden">
                <Image src="/images/logo.png" alt="263Tube" width={24} height={24} className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-semibold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/creators" className="hover:text-white transition-colors">All Creators</Link>
              <Link href="/trending" className="hover:text-white transition-colors">Trending</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
            </div>
            <p className="text-xs text-slate-600">All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
