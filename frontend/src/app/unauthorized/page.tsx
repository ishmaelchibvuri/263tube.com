"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldX, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#DE2010]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#319E31]/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2">
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
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#DE2010]/10 border border-[#DE2010]/20">
            <ShieldX className="w-10 h-10 text-[#DE2010]" />
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Access Denied
          </h1>

          {/* Description */}
          <p className="text-slate-400 mb-8 leading-relaxed">
            You don't have permission to access this page. If you believe this
            is an error, please contact the site administrator.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.history.back();
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.05] border border-white/[0.1] text-white text-sm font-medium rounded-xl hover:bg-white/[0.1] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-4 sm:px-6 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-slate-600">
            &copy; 2025 263Tube. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
