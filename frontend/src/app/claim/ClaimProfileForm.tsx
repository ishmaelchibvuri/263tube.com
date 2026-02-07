"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { AuthButton } from "@/components/home/AuthButton";
import { verifyChannelWithCode, type CodeVerificationResult } from "@/lib/actions/verify-owner";
import { searchCreatorsForClaim, getCreatorForClaim, type ClaimCreatorResult } from "@/lib/actions/search-creators";
import { CreatorSearchAutocomplete } from "@/components/creators/CreatorSearchAutocomplete";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  Search,
  User,
  Youtube,
  Send,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";

/** Generate a unique verification code for this claim session */
function generateVerificationCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `263tube-verify-${code}`;
}

export interface ClaimSessionData {
  name: string;
  email: string;
  role: string;
}

interface Props {
  session: ClaimSessionData | null;
  preSelectedCreator: ClaimCreatorResult | null;
}

export default function ClaimProfileForm({ session, preSelectedCreator }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClaimCreatorResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<ClaimCreatorResult | null>(
    preSelectedCreator
  );
  const [step, setStep] = useState<"search" | "verify" | "success">(
    preSelectedCreator ? "verify" : "search"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSuggestions, setHasSuggestions] = useState(false);

  // Ownership verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<CodeVerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Generate a stable verification code per session
  const verificationCode = useMemo(() => generateVerificationCode(), []);

  const [formData, setFormData] = useState({
    fullName: session?.name || "",
    email: session?.email || "",
    message: "",
  });

  // Pre-fill form data when session changes
  useEffect(() => {
    if (session) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || session.name,
        email: prev.email || session.email,
      }));
    }
  }, [session]);

  const handleSearch = async (query?: string) => {
    const q = query || searchQuery;
    if (!q.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchCreatorsForClaim(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCreator = async (creator: ClaimCreatorResult) => {
    if (creator.claimedBy) return;
    // Fetch full creator data from primary table to ensure all fields
    // (like platforms) are present — GSI queries may not project everything.
    const full = await getCreatorForClaim(creator.slug);
    if (full && !full.claimedBy) {
      setSelectedCreator(full);
      setStep("verify");
    }
  };

  const handleAutocompletePick = async (suggestion: { slug: string }) => {
    const creator = await getCreatorForClaim(suggestion.slug);
    if (creator && !creator.claimedBy) {
      setSelectedCreator(creator);
      setStep("verify");
    }
  };

  // Verify YouTube channel ownership by checking for verification code in description
  const handleVerifyOwnership = async () => {
    const youtubeHandle = selectedCreator?.youtubeHandle;

    if (!youtubeHandle) {
      setVerificationError("No YouTube channel found for this creator profile.");
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      const result = await verifyChannelWithCode(youtubeHandle, verificationCode);
      setVerificationResult(result);

      if (!result.isVerified) {
        setVerificationError(result.message);
      }
    } catch {
      setVerificationError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(verificationCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = verificationCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationResult?.isVerified) return;

    setIsSubmitting(true);

    // Simulate API call for claim submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);

    if (session) {
      toast.success("Your claim request has been submitted. You can track its progress on your dashboard.");
      router.push("/dashboard/activity");
      return;
    }

    setStep("success");
  };

  if (step === "success") {
    const isOwnershipVerified = verificationResult?.isVerified === true;

    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isOwnershipVerified ? "bg-[#319E31]/20" : "bg-[#FFD200]/20"
          }`}>
            {isOwnershipVerified ? (
              <ShieldCheck className="w-8 h-8 text-[#319E31]" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-[#FFD200]" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {isOwnershipVerified ? "Profile Claimed!" : "Claim Request Submitted!"}
          </h1>
          <p className="text-slate-400 mb-4">
            {isOwnershipVerified ? (
              <>Your ownership of <span className="text-white font-medium">{selectedCreator?.name}</span>&apos;s profile has been verified.</>
            ) : (
              <>We&apos;ve received your request to claim <span className="text-white font-medium">{selectedCreator?.name}</span>&apos;s profile.</>
            )}
          </p>
          <p className="text-sm text-slate-500 mb-8">
            {isOwnershipVerified
              ? "You now have full control of your 263Tube profile."
              : "Your request has been flagged for manual review. Our team will contact you within 48-72 hours to verify your identity."}
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
              <CreatorSearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
                onSelect={handleAutocompletePick}
                onSuggestionsVisibleChange={setHasSuggestions}
                placeholder="Search for your name or channel..."
                showIcon={true}
                inputClassName="h-12"
              />
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
                      key={creator.slug}
                      onClick={() => handleSelectCreator(creator)}
                      disabled={!!creator.claimedBy}
                      className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                        creator.claimedBy
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
                      {creator.claimedBy ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-[#319E31]/10 rounded text-xs text-[#319E31]">
                          <CheckCircle className="w-3 h-3" />
                          Claimed
                        </span>
                      ) : (
                        <span className="text-xs text-[#FFD200]">Claim &rarr;</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && !hasSuggestions && (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No profiles found matching &quot;{searchQuery}&quot;</p>
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
                    <li>- Update and manage your profile information</li>
                    <li>- Add or remove social media links</li>
                    <li>- Get a verified badge on your profile</li>
                    <li>- Access analytics and insights (coming soon)</li>
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
                setVerificationResult(null);
                setVerificationError(null);
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

            {/* Step 1: Verification Code */}
            <div className="p-5 rounded-xl bg-[#FFD200]/5 border border-[#FFD200]/20 space-y-4">
              <div className="flex items-start gap-3">
                <Youtube className="w-5 h-5 text-[#FF0000] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Step 1: Add verification code to your channel</h3>
                  <p className="text-xs text-slate-400">
                    Copy the code below and add it anywhere in your YouTube channel description.
                    Once added, click &quot;Verify&quot; below. You can remove it after verification.
                  </p>
                </div>
              </div>

              {/* Verification Code Display */}
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-black/40 border border-white/[0.1] rounded-lg text-[#FFD200] text-sm font-mono tracking-wider select-all">
                  {verificationCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`h-11 px-4 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    codeCopied
                      ? "bg-[#319E31]/20 text-[#319E31] border border-[#319E31]/30"
                      : "bg-white/[0.05] text-white border border-white/[0.1] hover:bg-white/[0.1]"
                  }`}
                >
                  {codeCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 2: Verify */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-white">Step 2: Verify Ownership</h2>

              {/* Full Name (read-only from session) */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Your Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.fullName}
                    readOnly
                    className="w-full h-12 pl-12 pr-4 bg-white/[0.03] border border-white/[0.05] rounded-xl text-slate-300 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* YouTube Handle (auto-loaded from DB, read-only) */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">YouTube Channel</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Youtube className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#FF0000]" />
                    <input
                      type="text"
                      value={selectedCreator?.youtubeHandle || "No YouTube channel on file"}
                      readOnly
                      className={`w-full h-12 pl-12 pr-4 bg-white/[0.03] border rounded-xl cursor-not-allowed ${
                        verificationResult?.isVerified
                          ? "border-[#319E31]/50 text-[#319E31]"
                          : verificationError
                          ? "border-red-500/50 text-slate-300"
                          : "border-white/[0.05] text-slate-300"
                      }`}
                    />
                  </div>
                  {/* Verify Button */}
                  {selectedCreator?.youtubeHandle && (
                    <button
                      type="button"
                      onClick={handleVerifyOwnership}
                      disabled={isVerifying || verificationResult?.isVerified === true}
                      className={`h-12 px-4 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                        verificationResult?.isVerified
                          ? "bg-[#319E31]/20 text-[#319E31] border border-[#319E31]/30"
                          : isVerifying
                          ? "bg-white/[0.05] text-slate-400 border border-white/[0.1] cursor-wait"
                          : "bg-[#FFD200]/10 text-[#FFD200] border border-[#FFD200]/30 hover:bg-[#FFD200]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Checking...</span>
                        </>
                      ) : verificationResult?.isVerified ? (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span className="hidden sm:inline">Verified</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          <span className="hidden sm:inline">Verify</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Verification Success */}
                {verificationResult?.isVerified && (
                  <div className="mt-2 p-3 rounded-lg bg-[#319E31]/10 border border-[#319E31]/20 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#319E31] flex-shrink-0" />
                    <div>
                      <p className="text-xs text-[#319E31] font-medium">
                        Ownership verified{verificationResult.channelTitle ? ` - ${verificationResult.channelTitle}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">Verification code found in channel description. You can now remove it.</p>
                    </div>
                  </div>
                )}

                {/* Verification Error */}
                {verificationError && (
                  <div className="mt-2 p-3 rounded-lg bg-[#FFD200]/10 border border-[#FFD200]/20 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#FFD200] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-[#FFD200] font-medium">{verificationError}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Make sure you&apos;ve added the code to your channel description and saved it, then try again.
                      </p>
                    </div>
                  </div>
                )}
              </div>

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
              disabled={isSubmitting || !verificationResult?.isVerified}
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
            <p className="text-xs text-slate-500 text-center">
              {verificationResult?.isVerified
                ? "Your ownership has been verified. Submit to complete your claim."
                : "You must verify your channel ownership before submitting."}
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
