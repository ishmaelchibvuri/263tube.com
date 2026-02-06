"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Building2,
  Mail,
  MessageSquare,
  DollarSign,
  Briefcase,
  Sparkles,
  LogIn,
} from "lucide-react";

interface ContactCreatorFormProps {
  creatorSlug: string;
  creatorName: string;
}

const INTEREST_TYPES = [
  { value: "sponsorship", label: "Sponsorship Deal", icon: DollarSign },
  { value: "collaboration", label: "Collaboration", icon: Sparkles },
  { value: "brand_deal", label: "Brand Partnership", icon: Briefcase },
  { value: "other", label: "Other Inquiry", icon: MessageSquare },
];

const BUDGET_RANGES = [
  { value: "", label: "Prefer not to say" },
  { value: "under_500", label: "Under $500" },
  { value: "500_1000", label: "$500 - $1,000" },
  { value: "1000_5000", label: "$1,000 - $5,000" },
  { value: "5000_10000", label: "$5,000 - $10,000" },
  { value: "over_10000", label: "Over $10,000" },
];

export function ContactCreatorForm({ creatorSlug, creatorName }: ContactCreatorFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "",
    companyName: "",
    email: user?.email || "",
    interestType: "sponsorship",
    subject: "",
    message: "",
    budget: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/creators/${creatorSlug}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          senderUserId: user?.userId || null,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: "",
          companyName: "",
          email: "",
          interestType: "sponsorship",
          subject: "",
          message: "",
          budget: "",
        });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to send message. Please try again.");
      }
    } catch (err) {
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="bg-gradient-to-r from-[#319E31]/10 via-white/[0.02] to-[#319E31]/10 rounded-xl border border-[#319E31]/20 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#319E31]/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-[#319E31]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Message Sent!</h3>
        <p className="text-sm text-slate-400 mb-4">
          Your enquiry has been sent to {creatorName}. They'll get back to you soon!
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setShowForm(false);
          }}
          className="text-sm text-[#319E31] hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  // Initial CTA state
  if (!showForm) {
    return (
      <div className="bg-gradient-to-r from-[#DE2010]/10 via-white/[0.02] to-[#DE2010]/10 rounded-xl border border-[#DE2010]/20 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-2">
          Work with {creatorName}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-4">
          Interested in collaborations, sponsorships, or brand deals?
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Send className="w-4 h-4" />
          Get in Touch
        </button>
      </div>
    );
  }

  // Form state
  return (
    <div className="bg-gradient-to-r from-[#DE2010]/10 via-white/[0.02] to-[#DE2010]/10 rounded-xl border border-[#DE2010]/20 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-white">
          Contact {creatorName}
        </h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-xs text-slate-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Login prompt for non-authenticated users */}
      {!user && (
        <div className="mb-4 p-3 bg-[#FFD200]/10 border border-[#FFD200]/20 rounded-lg">
          <p className="text-xs text-[#FFD200] flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            <span>
              <Link href="/login" className="underline hover:no-underline">
                Sign in
              </Link>{" "}
              as a sponsor to track your enquiries and get faster responses.
            </span>
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Company */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Your Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="John Doe"
                className="w-full h-10 pl-9 pr-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Company / Brand
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Optional"
                className="w-full h-10 pl-9 pr-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Email Address <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="you@company.com"
              className="w-full h-10 pl-9 pr-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
            />
          </div>
        </div>

        {/* Interest Type */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Type of Enquiry <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {INTEREST_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.interestType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, interestType: type.value })}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#DE2010]/20 border-[#DE2010]/50 text-white"
                      : "bg-white/[0.02] border-white/[0.1] text-slate-400 hover:border-white/[0.2]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-[#DE2010]" : ""}`} />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Subject <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            placeholder="e.g., Product Review Partnership"
            className="w-full h-10 px-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Your Message <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={4}
            placeholder={`Tell ${creatorName} about your project, goals, and what you're looking for...`}
            className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 resize-none"
          />
        </div>

        {/* Budget Range */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Budget Range (Optional)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full h-10 pl-9 pr-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-[#DE2010]/50 appearance-none cursor-pointer"
            >
              {BUDGET_RANGES.map((range) => (
                <option key={range.value} value={range.value} className="bg-[#09090b]">
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] disabled:from-slate-700 disabled:to-slate-800 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Enquiry
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-500 text-center">
          Your contact information will be shared with {creatorName} for this enquiry only.
        </p>
      </form>
    </div>
  );
}
