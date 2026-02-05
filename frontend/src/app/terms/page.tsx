"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, Mail, MapPin, AlertTriangle, CheckCircle, Users, Ban } from "lucide-react";

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#DE2010]/10 mb-4 sm:mb-6">
            <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-[#DE2010]" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-400">
            <strong className="text-slate-300">Last updated:</strong> January 2025
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8 mb-6">
          <p className="text-slate-300 leading-relaxed mb-4">
            Please read these Terms of Service ("Terms") carefully before using 263Tube
            (the "Service"), a directory platform for discovering Zimbabwean content creators.
          </p>
          <p className="text-slate-400 leading-relaxed">
            Your access to and use of the Service is conditioned on your acceptance of and
            compliance with these Terms. By accessing or using the Service, you agree to be
            bound by these Terms.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Description of Service */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#319E31]/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#319E31]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">1. Description of Service</h2>
            </div>
            <p className="text-slate-400 leading-relaxed">
              263Tube is a free online directory that showcases Zimbabwean content creators
              across various platforms including YouTube, TikTok, Instagram, Facebook, and X (Twitter).
              Our Service allows users to discover creators by niche, platform, or popularity,
              and provides links to their official social media profiles.
            </p>
          </section>

          {/* User Accounts */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#FFD200]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#FFD200]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">2. User Accounts</h2>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              Some features of our Service may require you to create an account. When you do:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>You may not share your account with others or create multiple accounts</li>
            </ul>
          </section>

          {/* Creator Submissions */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">3. Creator Submissions</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              When submitting a creator profile (your own or someone else's), you agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>The information provided is accurate to the best of your knowledge</li>
              <li>The creator is genuinely Zimbabwean or creates content primarily for Zimbabwean audiences</li>
              <li>You have the right to submit the information or are acting in good faith</li>
              <li>The profile information may be publicly displayed on our platform</li>
              <li>We reserve the right to reject, modify, or remove any submission</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#DE2010]/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-[#DE2010]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">4. Acceptable Use</h2>
            </div>
            <p className="text-slate-400 leading-relaxed mb-3">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>Submit false, misleading, or defamatory information about creators</li>
              <li>Impersonate another person or falsely claim to be a creator</li>
              <li>Use automated systems to scrape, harvest, or collect data from our platform</li>
              <li>Attempt to access other users' accounts or private data</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Interfere with or disrupt the Service or its servers</li>
              <li>Upload malicious code or attempt to compromise our security</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              The 263Tube platform, including its design, features, and functionality, is owned
              by 263Tube and protected by copyright and other intellectual property laws.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Creator content, images, and profiles belong to their respective creators.
              We display publicly available information and links to help users discover creators.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">6. Third-Party Links</h2>
            <p className="text-slate-400 leading-relaxed">
              Our Service contains links to third-party websites and social media platforms.
              We are not responsible for the content, privacy policies, or practices of these
              external sites. You access third-party sites at your own risk.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#FFD200]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#FFD200]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">7. Disclaimer</h2>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties
              of any kind. We do not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>The accuracy or completeness of creator information</li>
              <li>That external links will always be functional or up-to-date</li>
              <li>Uninterrupted or error-free access to the Service</li>
              <li>The behavior or content of listed creators</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-slate-400 leading-relaxed">
              To the fullest extent permitted by law, 263Tube shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from
              your use of the Service or your interaction with creators discovered through
              our platform.
            </p>
          </section>

          {/* Profile Removal */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">9. Profile Removal</h2>
            <p className="text-slate-400 leading-relaxed">
              Creators may request removal of their profile from 263Tube at any time by
              contacting us. We will process removal requests within a reasonable timeframe.
              We also reserve the right to remove profiles that violate these Terms or for
              any other reason at our discretion.
            </p>
          </section>

          {/* Termination */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">10. Termination</h2>
            <p className="text-slate-400 leading-relaxed">
              We may terminate or suspend your access to the Service immediately, without
              prior notice, for any reason including violation of these Terms. Upon termination,
              your right to use the Service will cease immediately.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
            <p className="text-slate-400 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be effective
              when posted on this page with an updated "Last updated" date. Continued use of the
              Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">12. Governing Law</h2>
            <p className="text-slate-400 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of
              Zimbabwe, without regard to conflict of law principles.
            </p>
          </section>
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-gradient-to-br from-[#DE2010]/10 to-[#319E31]/10 rounded-xl p-6 sm:p-8 border border-white/[0.05]">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Contact Us</h2>
          <p className="text-slate-400 mb-4">
            If you have any questions about these Terms of Service, you can contact us:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#DE2010]" />
              <a href="mailto:legal@263tube.com" className="text-[#FFD200] hover:underline">
                legal@263tube.com
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
