"use client";

import { Clock, ShieldAlert, CheckCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFD200]/10 text-[#FFD200] border border-[#FFD200]/20">
          <Clock className="w-3 h-3" />
          Pending Review
        </span>
      );
    case "PENDING_VERIFICATION":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#DE2010]/10 text-[#DE2010] border border-[#DE2010]/20">
          <ShieldAlert className="w-3 h-3" />
          Action Required
        </span>
      );
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#319E31]/10 text-[#319E31] border border-[#319E31]/20">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.05] text-slate-400 border border-white/[0.1]">
          <Clock className="w-3 h-3" />
          {status}
        </span>
      );
  }
}
