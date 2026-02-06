"use client";

import { useState } from "react";
import {
  Mail,
  Building2,
  Calendar,
  Loader2,
  CheckCircle,
  Phone,
  XCircle,
  Briefcase,
  DollarSign,
} from "lucide-react";
import {
  updateInquiryStatus,
  type Inquiry,
} from "@/lib/actions/inquiries";

interface InquiriesTableProps {
  inquiries: Inquiry[];
}

const STATUS_STYLES: {
  [key: string]: { bg: string; text: string; label: string };
  PENDING: { bg: string; text: string; label: string };
} = {
  PENDING: {
    bg: "bg-[#FFD200]/10 border-[#FFD200]/20",
    text: "text-[#FFD200]",
    label: "Pending",
  },
  CONTACTED: {
    bg: "bg-blue-500/10 border-blue-500/20",
    text: "text-blue-400",
    label: "Contacted",
  },
  CLOSED: {
    bg: "bg-[#319E31]/10 border-[#319E31]/20",
    text: "text-[#319E31]",
    label: "Closed",
  },
};

const COLLAB_LABELS: Record<string, string> = {
  video_shoutout: "Video Shoutout",
  event_hosting: "Event Hosting",
  long_term_partnership: "Long-term Partnership",
  brand_deal: "Brand Deal",
  other: "Other",
};

const BUDGET_LABELS: Record<string, string> = {
  "100_500": "$100 - $500",
  "500_2000": "$500 - $2,000",
  "2000_plus": "$2,000+",
};

export function InquiriesTable({ inquiries }: InquiriesTableProps) {
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [localInquiries, setLocalInquiries] = useState(inquiries);

  const handleStatusUpdate = async (
    inquiry: Inquiry,
    newStatus: "CONTACTED" | "CLOSED"
  ) => {
    const key = `${inquiry.pk}#${inquiry.sk}`;
    setProcessingKey(key);
    setActionResult(null);

    try {
      const result = await updateInquiryStatus(
        inquiry.pk,
        inquiry.sk,
        newStatus
      );

      if (result.success) {
        setActionResult({ type: "success", message: result.message });
        // Update local state
        setLocalInquiries((prev) =>
          prev.map((i) =>
            i.pk === inquiry.pk && i.sk === inquiry.sk
              ? { ...i, status: newStatus }
              : i
          )
        );
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "An error occurred. Please try again.",
      });
    } finally {
      setProcessingKey(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (localInquiries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.05] flex items-center justify-center">
          <Mail className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          No inquiries yet
        </h3>
        <p className="text-slate-400 text-sm">
          Business inquiries from brands will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Result Toast */}
      {actionResult && (
        <div
          className={`p-4 rounded-xl border ${
            actionResult.type === "success"
              ? "bg-[#319E31]/10 border-[#319E31]/20 text-[#319E31]"
              : "bg-[#DE2010]/10 border-[#DE2010]/20 text-[#DE2010]"
          }`}
        >
          {actionResult.message}
        </div>
      )}

      {/* Inquiries List */}
      <div className="space-y-4">
        {localInquiries.map((inquiry) => {
          const key = `${inquiry.pk}#${inquiry.sk}`;
          const isProcessing = processingKey === key;
          const statusStyle = STATUS_STYLES[inquiry.status] || STATUS_STYLES.PENDING;

          return (
            <div
              key={key}
              className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {inquiry.companyName}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        {statusStyle.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {inquiry.email}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        Creator: @{inquiry.creatorSlug}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {inquiry.status === "PENDING" && (
                    <button
                      onClick={() => handleStatusUpdate(inquiry, "CONTACTED")}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50 text-sm"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                      Mark Contacted
                    </button>
                  )}
                  {inquiry.status !== "CLOSED" && (
                    <button
                      onClick={() => handleStatusUpdate(inquiry, "CLOSED")}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#319E31]/10 text-[#319E31] hover:bg-[#319E31]/20 transition-colors disabled:opacity-50 text-sm"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    Collaboration Type
                  </h4>
                  <p className="text-sm text-slate-300">
                    {COLLAB_LABELS[inquiry.collaborationType] ||
                      inquiry.collaborationType}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Budget
                  </h4>
                  <p className="text-sm text-slate-300">
                    {inquiry.budget
                      ? BUDGET_LABELS[inquiry.budget] || inquiry.budget
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Received
                  </h4>
                  <p className="text-sm text-slate-300">
                    {formatDate(inquiry.createdAt)}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="bg-white/[0.02] rounded-lg border border-white/[0.05] p-4">
                <h4 className="text-xs font-medium text-slate-500 mb-2">
                  Message
                </h4>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {inquiry.message.length > 500
                    ? `${inquiry.message.substring(0, 500)}...`
                    : inquiry.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
