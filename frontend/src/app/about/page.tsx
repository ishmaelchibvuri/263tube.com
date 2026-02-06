"use client";

import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "@/components/home/AuthButton";
import {
  ArrowLeft,
  Heart,
  Users,
  Globe,
  Target,
  Sparkles,
  Youtube,
  Instagram,
  Twitter,
  Mail,
  MapPin,
  ArrowRight,
  Star,
} from "lucide-react";

const STATS = [
  { label: "Creators Listed", value: "500+", icon: Users },
  { label: "Monthly Visitors", value: "50K+", icon: Globe },
  { label: "Content Categories", value: "12", icon: Target },
  { label: "Countries Reached", value: "15+", icon: Star },
];

const VALUES = [
  {
    title: "Celebrate Local Talent",
    description: "We believe Zimbabwean creators deserve a spotlight. From comedians to musicians, tech reviewers to chefs, we showcase the diversity of Zim talent.",
    icon: "🌟",
  },
  {
    title: "Connect Communities",
    description: "We bridge the gap between creators and their audiences, making it easy to discover new content and support local creators.",
    icon: "🤝",
  },
  {
    title: "Empower Growth",
    description: "By providing visibility and discoverability, we help creators grow their audiences and reach new fans both in Zimbabwe and worldwide.",
    icon: "📈",
  },
  {
    title: "Free & Accessible",
    description: "Our platform is completely free for both creators and users. We believe in democratizing access to opportunities.",
    icon: "💚",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#DE2010]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#319E31]/5 rounded-full blur-[80px] sm:blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#FFD200]/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#DE2010]/10 border border-[#DE2010]/20 rounded-full text-[#DE2010] text-sm font-medium mb-6">
              <Heart className="w-4 h-4" />
              Made in Zimbabwe
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Showcasing{" "}
              <span className="text-gradient-zim">Zimbabwe's</span>{" "}
              Creative Talent
            </h1>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              263Tube is the largest directory of Zimbabwean content creators, connecting audiences
              with the talented YouTubers, TikTokers, and social media influencers shaping our culture.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-center"
                  >
                    <Icon className="w-5 h-5 text-[#FFD200] mx-auto mb-2" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-slate-500">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#FFD200]" />
                Our Story
              </h2>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>
                  263Tube was born from a simple observation: Zimbabwe has an incredible wealth of
                  creative talent, but discovering these creators was often a matter of chance.
                  Social media algorithms don't always surface local content, and there was no
                  central place to explore Zimbabwean creators.
                </p>
                <p>
                  We set out to change that. Our mission is to create a comprehensive, searchable
                  directory that makes it easy for anyone—whether in Harare, Bulawayo, or the
                  diaspora—to discover and support Zimbabwean content creators.
                </p>
                <p>
                  From comedy legends like Madam Boss to rising tech reviewers and cooking channels,
                  263Tube celebrates the full spectrum of Zimbabwean creativity. We're proud to
                  showcase creators who are entertaining, educating, and inspiring audiences
                  across the globe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-8">
              What We Stand For
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {VALUES.map((value) => (
                <div
                  key={value.title}
                  className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 sm:p-6"
                >
                  <span className="text-3xl mb-3 block">{value.icon}</span>
                  <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Creators */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#DE2010]/10 to-[#319E31]/10 border border-white/[0.05] rounded-2xl p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                    Are You a Creator?
                  </h2>
                  <p className="text-slate-400 mb-4">
                    Join hundreds of Zimbabwean creators already featured on 263Tube.
                    Get discovered by new audiences, gain visibility, and connect with
                    potential brand partners and collaborators.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-400 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="text-[#319E31]">✓</span> Free profile listing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#319E31]">✓</span> Verified creator badge
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#319E31]">✓</span> All your social links in one place
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#319E31]">✓</span> Featured in category rankings
                    </li>
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DE2010] hover:bg-[#ff2a17] text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      Submit Your Profile
                    </Link>
                    <Link
                      href="/claim"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white text-sm font-medium rounded-xl hover:bg-white/[0.1] transition-colors"
                    >
                      Claim Existing Profile
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Get in Touch</h2>
            <p className="text-slate-400 mb-6">
              Have questions, feedback, or partnership inquiries? We'd love to hear from you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
              <a
                href="mailto:hello@263tube.com"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5 text-[#DE2010]" />
                hello@263tube.com
              </a>
              <span className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-5 h-5 text-[#319E31]" />
                Harare, Zimbabwe
              </span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/[0.05] hover:bg-[#DE2010]/20 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5 text-slate-400 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/[0.05] hover:bg-[#DE2010]/20 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5 text-slate-400 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/[0.05] hover:bg-[#DE2010]/20 flex items-center justify-center transition-colors"
              >
                <Youtube className="w-5 h-5 text-slate-400 hover:text-white" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.05] bg-black/40 mt-12">
        <div className="h-1 bg-gradient-to-r from-[#319E31] via-[#FFD200] to-[#DE2010]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded overflow-hidden">
                <Image src="/images/logo.png" alt="263Tube" width={24} height={24} className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-semibold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/creators" className="hover:text-white transition-colors">Creators</Link>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-xs text-slate-600">&copy; 2025 263Tube. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
