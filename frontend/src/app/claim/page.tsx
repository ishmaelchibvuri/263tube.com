"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  Search,
  Mail,
  User,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  Send,
  AlertCircle,
} from "lucide-react";

// Mock search results
const MOCK_CREATORS = [
  { id: "1", name: "Madam Boss", slug: "madam-boss", profilePicUrl: "/creators/madam-boss.jpg", niche: "Comedy", claimed: true },
  { id: "2", name: "Mai Titi", slug: "mai-titi", profilePicUrl: "/creators/mai-titi.jpg", niche: "Entertainment", claimed: true },
  { id: "3", name: "Tyra Chikocho", slug: "tyra-chikocho", profilePicUrl: "/creators/tyra.jpg", niche: "Comedy", claimed: false },
  { id: "4", name: "Shadaya Knight", slug: "shadaya-knight", profilePicUrl: "/creators/shadaya.jpg", niche: "Commentary", claimed: false },
  { id: "5", name: "Zimbo Kitchen", slug: "zimbo-kitchen", profilePicUrl: "/creators/zimbo-kitchen.jpg", niche: "Cooking", claimed: false },
  { id: "6", name: "TechZim", slug: "techzim", profilePicUrl: "/creators/techzim.jpg", niche: "Technology", claimed: true },
];

export default function ClaimProfilePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof MOCK_CREATORS>([]);
  const [selectedCreator, setSelectedCreator] = useState<typeof MOCK_CREATORS[0] | null>(null);
  const [step, setStep] = useState<"search" | "verify" | "success">("search");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    verificationMethod: "",
    socialHandle: "",
    message: "",
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const results = MOCK_CREATORS.filter((creator) =>
      creator.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleSelectCreator = (creator: typeof MOCK_CREATORS[0]) => {
    if (creator.claimed) return;
    setSelectedCreator(creator);
    setStep("verify");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#319E31]/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#319E31]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Claim Request Submitted!</h1>
          <p className="text-slate-400 mb-4">
            We've received your request to claim <span className="text-white font-medium">{selectedCreator?.name}</span>'s profile.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Our team will review your request and contact you within 48-72 hours to verify your identity.
          </p>
          <div className="space-y-3">
            <Link
              href={`/creator/${selectedCreator?.slug}`}
              className="block w-full px-6 py-3 bg-[#DE2010] hover:bg-[#ff2a17] text-white font-medium rounded-xl transition-colors"
            >
              View Profile
            </Link>
            <Link
              href="/"
              className="block w-full px-6 py-3 bg-white/[0.05] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.1] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#DE2010]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#319E31]/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
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

      <main className="relative max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFD200]/10 mb-4">
            <Shield className="w-6 h-6 text-[#FFD200]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Claim Your Profile</h1>
          <p className="text-sm sm:text-base text-slate-400">
            Verify your identity and take control of your 263Tube profile
          </p>
        </div>

        {step === "search" && (
          <>
            {/* Search Section */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Find Your Profile</h2>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search for your name or channel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 h-12 bg-[#DE2010] hover:bg-[#ff2a17] text-white font-medium rounded-xl transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.05]">
                  <p className="text-sm text-slate-400">
                    Found <span className="text-white font-medium">{searchResults.length}</span> results
                  </p>
                </div>
                <div className="divide-y divide-white/[0.05]">
                  {searchResults.map((creator) => (
                    <button
                      key={creator.id}
                      onClick={() => handleSelectCreator(creator)}
                      disabled={creator.claimed}
                      className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                        creator.claimed
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {creator.profilePicUrl ? (
                          <Image src={creator.profilePicUrl} alt={creator.name} width={48} height={48} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center text-white font-bold">
                            {creator.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{creator.name}</h3>
                        <p className="text-xs text-slate-500">{creator.niche}</p>
                      </div>
                      {creator.claimed ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-[#319E31]/10 rounded text-xs text-[#319E31]">
                          <CheckCircle className="w-3 h-3" />
                          Claimed
                        </span>
                      ) : (
                        <span className="text-xs text-[#FFD200]">Claim →</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No profiles found matching "{searchQuery}"</p>
                <p className="text-sm text-slate-500">
                  Your profile might not be listed yet.{" "}
                  <Link href="/submit" className="text-[#FFD200] hover:underline">
                    Submit it here
                  </Link>
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-8 bg-[#FFD200]/5 border border-[#FFD200]/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#FFD200] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Why claim your profile?</h3>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>• Update and manage your profile information</li>
                    <li>• Add or remove social media links</li>
                    <li>• Get a verified badge on your profile</li>
                    <li>• Access analytics and insights (coming soon)</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {step === "verify" && selectedCreator && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Back button */}
            <button
              type="button"
              onClick={() => {
                setStep("search");
                setSelectedCreator(null);
              }}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Choose different profile
            </button>

            {/* Selected Profile */}
            <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
              <div className="w-14 h-14 rounded-lg overflow-hidden">
                {selectedCreator.profilePicUrl ? (
                  <Image src={selectedCreator.profilePicUrl} alt={selectedCreator.name} width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center text-white font-bold text-xl">
                    {selectedCreator.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">{selectedCreator.name}</h3>
                <p className="text-sm text-slate-500">{selectedCreator.niche}</p>
              </div>
            </div>

            {/* Verification Form */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-white">Verify Your Identity</h2>

              {/* Full Name */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Your Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="As it appears on your official channels"
                    className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">We'll use this to contact you about your claim</p>
              </div>

              {/* Verification Method */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">How should we verify you? *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "youtube", label: "YouTube", icon: Youtube, color: "#FF0000" },
                    { value: "instagram", label: "Instagram", icon: Instagram, color: "#E4405F" },
                    { value: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2" },
                    { value: "twitter", label: "X / Twitter", icon: Twitter, color: "#1DA1F2" },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, verificationMethod: method.value })}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          formData.verificationMethod === method.value
                            ? "bg-white/[0.05] border-white/[0.2]"
                            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]"
                        }`}
                      >
                        <Icon className="w-4 h-4" style={{ color: formData.verificationMethod === method.value ? method.color : "#64748b" }} />
                        <span className={`text-sm ${formData.verificationMethod === method.value ? "text-white" : "text-slate-400"}`}>
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  We'll ask you to post a verification message or send a DM from this account
                </p>
              </div>

              {/* Social Handle */}
              {formData.verificationMethod && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Your {formData.verificationMethod} Handle *</label>
                  <input
                    type="text"
                    required
                    value={formData.socialHandle}
                    onChange={(e) => setFormData({ ...formData, socialHandle: e.target.value })}
                    placeholder="@yourusername"
                    className="w-full h-12 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                  />
                </div>
              )}

              {/* Additional Message */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Additional Information (optional)</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Any additional context to help verify your identity..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.verificationMethod}
              className="w-full h-12 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Claim Request
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
