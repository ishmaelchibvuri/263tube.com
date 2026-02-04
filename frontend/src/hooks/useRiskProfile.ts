"use client";

import useSWR from "swr";
import { api } from "@/lib/api-client-debts";
import {
  UserRiskProfile,
  MonthlySummary,
  RiskLevel,
  UpsellStatus,
} from "@/types";

interface RiskProfileData {
  profile: UserRiskProfile | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  mutate: () => void;
  shouldShowUpsell: boolean;
  upsellLevel: UpsellStatus;
}

/**
 * SWR hook for user risk profile with upsell logic
 * Part of the Debt Intelligence system for Debt Payoff SA integration
 */
export function useRiskProfile(): RiskProfileData {
  const { data, error, isLoading, mutate } = useSWR<UserRiskProfile>(
    "risk-profile",
    () => api.riskProfile.getRiskProfile(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute - risk profile changes less frequently
      errorRetryCount: 2,
    }
  );

  // Determine if upsell should be shown based on risk profile
  const shouldShowUpsell = data
    ? data.upsellStatus !== "NONE" && data.riskLevel !== "LOW"
    : false;

  const upsellLevel = data?.upsellStatus || "NONE";

  return {
    profile: data || null,
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
    shouldShowUpsell,
    upsellLevel,
  };
}

/**
 * Hook for monthly summaries (sparkline data)
 */
export function useMonthlySummaries(months: number = 6) {
  const { data, error, isLoading, mutate } = useSWR<MonthlySummary[]>(
    `monthly-summaries-${months}`,
    () => api.riskProfile.getMonthlySummaries(months),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes - historical data changes rarely
    }
  );

  // Extract debt trend data for sparklines
  const debtTrend = data?.map((s) => s.totalDebt) || [];
  const dtiTrend = data?.map((s) => s.dtiRatio) || [];

  return {
    summaries: data || [],
    debtTrend,
    dtiTrend,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Utility function to determine risk level color
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case "LOW":
      return "text-trust-shield";
    case "MEDIUM":
      return "text-warning";
    case "HIGH":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

/**
 * Utility function to determine risk level background
 */
export function getRiskLevelBg(level: RiskLevel): string {
  switch (level) {
    case "LOW":
      return "bg-green-50 border-green-200";
    case "MEDIUM":
      return "bg-amber-50 border-amber-200";
    case "HIGH":
      return "bg-red-50 border-red-200";
    default:
      return "bg-muted";
  }
}

/**
 * Determine if user should see critical intervention modal
 * Based on DTI > 50% or presence of distress events
 */
export function shouldShowCriticalIntervention(
  profile: UserRiskProfile | null
): boolean {
  if (!profile) return false;

  const hasDistressEvents = profile.distressEvents && profile.distressEvents.length > 0;

  return (
    profile.dtiRatio > 50 ||
    profile.riskLevel === "HIGH" ||
    hasDistressEvents === true
  );
}

/**
 * Get appropriate upsell message based on risk level
 */
export function getUpsellMessage(profile: UserRiskProfile | null): {
  title: string;
  body: string;
  actionLabel: string;
} {
  if (!profile) {
    return {
      title: "",
      body: "",
      actionLabel: "",
    };
  }

  switch (profile.upsellStatus) {
    case "NUDGE":
      return {
        title: "Keep your financial health strong",
        body: "Did you know keeping your credit utilization under 30% improves your score?",
        actionLabel: "Learn More",
      };

    case "TARGET":
      return {
        title: "Your interest costs are rising",
        body: `You're spending ${Math.abs(profile.debtVelocity).toFixed(0)}% more on debt this month. Let's look at options to reduce this.`,
        actionLabel: "See Savings Options",
      };

    case "CRITICAL":
      return {
        title: "Critical: Debt Alert",
        body: "Your debt profile suggests you may be over-indebted. Protect your assets with a free assessment.",
        actionLabel: "Get Help Now",
      };

    default:
      return {
        title: "",
        body: "",
        actionLabel: "",
      };
  }
}
