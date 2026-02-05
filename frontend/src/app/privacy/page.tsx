"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield, Mail, MapPin, Eye, Database, Lock, UserCheck, Trash2 } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#DE2010]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#319E31]/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title Section */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#319E31]/10 mb-4 sm:mb-6">
            <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-[#319E31]" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400">
            <strong className="text-slate-300">Last updated:</strong> January 2025
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8 mb-6">
          <p className="text-slate-300 leading-relaxed">
            This Privacy Policy describes how 263Tube ("we", "us", or "our") collects, uses,
            and protects your information when you use our Zimbabwean creator directory platform
            (the "Service"). We are committed to protecting your privacy and being transparent
            about our data practices.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Information We Collect */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#DE2010]/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-[#DE2010]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Information We Collect</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">For Visitors</h3>
                <p className="text-slate-400 mb-2">When you browse our platform, we may collect:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
                  <li>Browser type and version</li>
                  <li>Device type and operating system</li>
                  <li>Pages visited and time spent on site</li>
                  <li>Referring website or search terms</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">For Registered Users</h3>
                <p className="text-slate-400 mb-2">When you create an account, we collect:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
                  <li>Email address</li>
                  <li>Name (optional)</li>
                  <li>Password (encrypted)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">For Creator Submissions</h3>
                <p className="text-slate-400 mb-2">When you submit a creator profile, we collect:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
                  <li>Creator name and channel names</li>
                  <li>Social media profile URLs</li>
                  <li>Content niche/category</li>
                  <li>Bio and description</li>
                  <li>Submitter contact information</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#FFD200]/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#FFD200]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">How We Use Your Information</h2>
            </div>

            <p className="text-slate-400 mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>Operate and maintain the 263Tube creator directory</li>
              <li>Display creator profiles publicly on the platform</li>
              <li>Process and review creator submissions</li>
              <li>Communicate with you about submissions and account updates</li>
              <li>Improve our platform and user experience</li>
              <li>Protect against spam, fraud, and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Public Information */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#319E31]/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-[#319E31]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Public Information</h2>
            </div>

            <p className="text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Please note:</strong> Creator profiles on 263Tube are
              designed to be publicly visible. This includes creator names, profile images, social media
              links, content niches, and biographical information. By submitting a creator profile
              (whether your own or someone else's), you acknowledge that this information will be
              displayed publicly on our platform.
            </p>
          </section>

          {/* Data Security */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#DE2010]/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#DE2010]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Data Security</h2>
            </div>

            <p className="text-slate-400 leading-relaxed mb-4">
              We implement appropriate security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>Passwords are encrypted using industry-standard hashing</li>
              <li>All data transmission uses HTTPS encryption</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal data on a need-to-know basis</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#FFD200]/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-[#FFD200]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Your Rights</h2>
            </div>

            <p className="text-slate-400 mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li><strong className="text-slate-300">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-slate-300">Correction:</strong> Request correction of inaccurate data</li>
              <li><strong className="text-slate-300">Deletion:</strong> Request removal of your data or creator profile</li>
              <li><strong className="text-slate-300">Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-slate-400 mt-4">
              To exercise these rights, please contact us at the email address below.
            </p>
          </section>

          {/* Cookies */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Cookies</h2>
            <p className="text-slate-400 leading-relaxed">
              We use essential cookies to keep you logged in and remember your preferences.
              We may also use analytics cookies to understand how visitors interact with our
              platform. You can control cookie settings through your browser preferences.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Third-Party Links</h2>
            <p className="text-slate-400 leading-relaxed">
              Creator profiles contain links to external social media platforms (YouTube, TikTok,
              Instagram, Facebook, X, etc.). These third-party sites have their own privacy policies,
              and we are not responsible for their content or practices.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
            <p className="text-slate-400 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the
              "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-gradient-to-br from-[#DE2010]/10 to-[#319E31]/10 rounded-xl p-6 sm:p-8 border border-white/[0.05]">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Contact Us</h2>
          <p className="text-slate-400 mb-4">
            If you have any questions about this Privacy Policy or wish to exercise your rights,
            you can contact us:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#DE2010]" />
              <a href="mailto:privacy@263tube.com" className="text-[#FFD200] hover:underline">
                privacy@263tube.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[#319E31]" />
              <span className="text-slate-300">Harare, Zimbabwe</span>
            </div>
          </div>
        </div>

        {/* Back to Top */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="px-6 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-sm font-medium hover:bg-white/[0.1] transition-all"
          >
            Back to Top
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.05] bg-black/40 mt-12">
        <div className="h-1 bg-gradient-to-r from-[#319E31] via-[#FFD200] to-[#DE2010]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-slate-500 text-sm">
            &copy; 2025 263Tube. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
