"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  GraduationCap,
  Smartphone,
  Zap,
  RefreshCw,
  Apple,
  ArrowLeft,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import IOSInstallModal from "@/components/IOSInstallModal";
import posthog from "posthog-js";

export default function MobilePage() {
  const router = useRouter();
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/images/header_logo.png"
                alt="Regulatory Exams"
                width={180}
                height={60}
                className="h-12 w-auto"
                unoptimized
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Smartphone className="h-4 w-4" />
            Now Available on Mobile
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-gray-900">
            Study Anywhere,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Anytime
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Download the Regulatory Exams app and master your RE5 exam on the go. Available on Android and iPhone.
          </p>

          {/* Download Badges */}
          <div className="flex flex-col items-center gap-6 mb-16">
            <div className="flex flex-wrap gap-4 items-center justify-center">
              {/* Google Play Badge */}
              <a
                href="https://play.google.com/store/apps/details?id=com.cyberelftechnologies.reexams"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  posthog.capture("mobile_page_google_play_clicked", {
                    location: "mobile_page_hero",
                  });
                }}
                className="hover:opacity-80 transition-all transform hover:scale-105"
              >
                <div className="bg-black rounded-lg h-[60px] px-5 flex items-center gap-3 drop-shadow-lg">
                  <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                    <path d="M8 8L28 24L8 40V8Z" fill="#34A853"/>
                    <path d="M28 24L8 8L38 4L28 24Z" fill="#FBBC04"/>
                    <path d="M28 24L38 44L8 40L28 24Z" fill="#EA4335"/>
                    <path d="M28 24L38 4L38 44L28 24Z" fill="#4285F4"/>
                  </svg>
                  <div className="text-left border-l border-gray-700 pl-3">
                    <div className="text-white text-xs font-light leading-tight">
                      GET IT ON
                    </div>
                    <div className="text-white text-lg font-bold leading-tight">
                      Google Play
                    </div>
                  </div>
                </div>
              </a>

              {/* iOS Install Button */}
              <button
                onClick={() => {
                  setShowIOSModal(true);
                  posthog.capture("mobile_page_ios_clicked", {
                    location: "mobile_page_hero",
                  });
                }}
                className="bg-black hover:bg-gray-800 transition-all transform hover:scale-105 rounded-lg h-[60px] px-5 flex items-center gap-3 drop-shadow-lg"
              >
                <Apple className="h-10 w-10 text-white flex-shrink-0" />
                <div className="text-left border-l border-gray-700 pl-3">
                  <div className="text-white text-xs font-light leading-tight">
                    WEB APP FOR
                  </div>
                  <div className="text-white text-lg font-bold leading-tight">
                    iPhone
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
              <p className="text-sm text-green-900">
                <span className="font-semibold">⭐⭐⭐⭐⭐ 4.3 Stars</span> on Google Play with over <span className="font-semibold">5,000+ downloads</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Features */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Everything you need to pass your RE5 exam
                </h2>
                <p className="text-lg text-gray-600">
                  Don't be tied to your desk. Our app lets you crush practice questions during your commute, lunch break, or load-shedding.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 rounded-full p-3 mt-1">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                    <p className="text-gray-600">Practice questions load instantly, even on slow connections. Optimized for South African networks.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 rounded-full p-3 mt-1">
                    <RefreshCw className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto-Sync Progress</h3>
                    <p className="text-gray-600">Your progress syncs automatically across all devices. Start on mobile, continue on desktop.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-orange-100 rounded-full p-3 mt-1">
                    <CheckCircle2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Full Feature Parity</h3>
                    <p className="text-gray-600">Access all features including analytics, bookmarks, custom quizzes, and exam simulations.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Phone Mockup */}
            <div className="relative">
              <div className="relative mx-auto w-full max-w-sm">
                {/* Phone Frame */}
                <div className="relative bg-gray-900 rounded-[3rem] p-4 shadow-2xl">
                  {/* Screen */}
                  <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                    {/* Phone content - Dashboard preview */}
                    <div className="h-full bg-gradient-to-b from-blue-50 to-white p-6">
                      <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                          <GraduationCap className="h-10 w-10 text-white" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-5 bg-gray-300 rounded w-3/4 mx-auto" />
                          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                        </div>
                        <div className="bg-gray-900 text-white rounded-full py-4 px-8 text-base font-semibold shadow-lg">
                          <Download className="inline h-5 w-5 mr-2" />
                          Start Practice
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-6">
                          <div className="bg-blue-100 rounded-xl p-4 shadow-md">
                            <div className="h-4 bg-blue-400 rounded w-2/3 mb-3" />
                            <div className="h-3 bg-blue-300 rounded w-1/2" />
                          </div>
                          <div className="bg-purple-100 rounded-xl p-4 shadow-md">
                            <div className="h-4 bg-purple-400 rounded w-2/3 mb-3" />
                            <div className="h-3 bg-purple-300 rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-gray-900 rounded-b-2xl" />
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Study on the Go?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join 5,000+ students who are mastering their RE5 exam with our mobile app.
          </p>

          <div className="flex flex-wrap gap-4 items-center justify-center">
            <a
              href="https://play.google.com/store/apps/details?id=com.cyberelftechnologies.reexams"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                posthog.capture("mobile_page_google_play_clicked", {
                  location: "mobile_page_cta",
                });
              }}
              className="hover:opacity-90 transition-all transform hover:scale-105"
            >
              <div className="bg-white rounded-lg h-[60px] px-5 flex items-center gap-3 drop-shadow-lg">
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                  <path d="M8 8L28 24L8 40V8Z" fill="#34A853"/>
                  <path d="M28 24L8 8L38 4L28 24Z" fill="#FBBC04"/>
                  <path d="M28 24L38 44L8 40L28 24Z" fill="#EA4335"/>
                  <path d="M28 24L38 4L38 44L28 24Z" fill="#4285F4"/>
                </svg>
                <div className="text-left border-l border-gray-300 pl-3">
                  <div className="text-gray-600 text-xs font-light leading-tight">
                    GET IT ON
                  </div>
                  <div className="text-gray-900 text-lg font-bold leading-tight">
                    Google Play
                  </div>
                </div>
              </div>
            </a>

            <button
              onClick={() => {
                setShowIOSModal(true);
                posthog.capture("mobile_page_ios_clicked", {
                  location: "mobile_page_cta",
                });
              }}
              className="bg-white hover:bg-gray-50 transition-all transform hover:scale-105 rounded-lg h-[60px] px-5 flex items-center gap-3 drop-shadow-lg"
            >
              <Apple className="h-10 w-10 text-gray-900 flex-shrink-0" />
              <div className="text-left border-l border-gray-300 pl-3">
                <div className="text-gray-600 text-xs font-light leading-tight">
                  WEB APP FOR
                </div>
                <div className="text-gray-900 text-lg font-bold leading-tight">
                  iPhone
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Image
            src="/images/header_logo.png"
            alt="Regulatory Exams"
            width={180}
            height={60}
            unoptimized
            className="h-12 w-auto brightness-0 invert mx-auto mb-4"
          />
          <p className="text-gray-400 text-sm mb-6">
            Making RE5 Actually Enjoyable
          </p>
          <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-400">
            <a href="/" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
          <p className="text-gray-500 text-xs mt-8">
            &copy; 2025 Active Wave Group Pty Ltd. All rights reserved.
          </p>
        </div>
      </footer>

      {/* iOS Install Modal */}
      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
      />
    </div>
  );
}
