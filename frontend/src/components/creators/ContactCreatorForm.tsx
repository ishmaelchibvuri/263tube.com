"use client";

import { useState, useRef } from "react";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  MessageSquare,
  DollarSign,
  Briefcase,
  Sparkles,
  Video,
  Calendar,
  MoreHorizontal,
  Handshake,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { submitBusinessInquiry } from "@/lib/actions/inquiries";

interface ContactCreatorFormProps {
  creatorSlug: string;
  creatorName: string;
}

const COLLABORATION_TYPES = [
  { value: "video_shoutout", label: "Video Shoutout", icon: Video },
  { value: "event_hosting", label: "Event Hosting", icon: Calendar },
  { value: "long_term_partnership", label: "Long-term Partnership", icon: Handshake },
  { value: "brand_deal", label: "Brand Deal", icon: Briefcase },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const BUDGET_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "100_500", label: "$100 - $500" },
  { value: "500_2000", label: "$500 - $2,000" },
  { value: "2000_plus", label: "$2,000+" },
];

export function ContactCreatorForm({
  creatorSlug,
  creatorName,
}: ContactCreatorFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collaborationType, setCollaborationType] = useState("brand_deal");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("collaborationType", collaborationType);

    try {
      const result = await submitBusinessInquiry(creatorSlug, formData);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message);
      }
    } catch {
      setError("Failed to send inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after close animation
    setTimeout(() => {
      setSuccess(false);
      setError(null);
      setCollaborationType("brand_deal");
      formRef.current?.reset();
    }, 200);
  };

  return (
    <>
      {/* CTA Card */}
      <div className="bg-gradient-to-r from-[#DE2010]/10 via-white/[0.02] to-[#DE2010]/10 rounded-xl border border-[#DE2010]/20 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-2">
          Work with {creatorName}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-4">
          Interested in collaborations, sponsorships, or brand deals? 263Tube
          facilitates professional connections between brands and creators.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#DE2010]/20"
        >
          <Briefcase className="w-4 h-4" />
          Work With This Creator
        </button>
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
        <DialogContent className="bg-[#09090b] border-white/[0.1] text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {success ? (
            /* ---- Success State ---- */
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#319E31]/20 flex items-center justify-center mx-auto mb-5 animate-in zoom-in-50 duration-300">
                <CheckCircle className="w-8 h-8 text-[#319E31]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Inquiry Sent!
              </h3>
              <p className="text-sm text-slate-400 mb-2">
                Your inquiry has been sent to{" "}
                <span className="text-white font-medium">{creatorName}</span>.
              </p>
              <p className="text-xs text-slate-500 mb-6">
                263Tube helps facilitate these connections to ensure professional
                delivery.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white text-sm font-medium rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          ) : (
            /* ---- Form State ---- */
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#DE2010]" />
                  Work With {creatorName}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Fill out the details below and 263Tube will facilitate the
                  connection.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Honeypot — hidden from users, bots will fill it */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
                />

                {/* Company / Name */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Company Name / Your Name{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      name="companyName"
                      required
                      placeholder="e.g., Acme Inc. or John Doe"
                      className="w-full h-10 pl-9 pr-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Contact Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="you@company.com"
                      className="w-full h-10 pl-9 pr-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
                    />
                  </div>
                </div>

                {/* Collaboration Type */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Type of Collaboration{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COLLABORATION_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = collaborationType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setCollaborationType(type.value)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-[#DE2010]/20 border-[#DE2010]/50 text-white"
                              : "bg-white/[0.02] border-white/[0.1] text-slate-400 hover:border-white/[0.2]"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-[#DE2010]" : ""}`}
                          />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Estimated Budget (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      name="budget"
                      className="w-full h-10 pl-9 pr-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-[#DE2010]/50 appearance-none cursor-pointer"
                    >
                      {BUDGET_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-[#09090b]"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Message Details <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <textarea
                      name="message"
                      required
                      rows={4}
                      placeholder={`Tell us about your project, goals, and what you'd like ${creatorName} to help with...`}
                      className="w-full pl-9 pr-3 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 resize-none"
                    />
                  </div>
                </div>

                {/* Submit */}
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
                      <Briefcase className="w-4 h-4" />
                      Send Inquiry
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-500 text-center">
                  263Tube acts as a facilitator to ensure professional and
                  reliable connections between brands and creators.
                </p>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
