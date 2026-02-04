"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskLevel, UpsellStatus } from "@/types";

interface UpsellCardProps {
  riskLevel: RiskLevel;
  upsellStatus: UpsellStatus;
  debtVelocity?: number;
  dtiRatio?: number;
  onAction: () => void;
  onDismiss?: () => void;
  className?: string;
}

interface UpsellContent {
  color: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
}

/**
 * UpsellCard component for Debt Payoff SA integration
 * Implements the Trust Stack "Graduated Intervention" model:
 * - Level 1 (LOW): Educational nudge
 * - Level 2 (MEDIUM): Contextual alert with amber styling
 * - Level 3 (HIGH): Critical intervention with urgent CTA
 *
 * Part of QuickBudget SA's intelligent debt remediation system
 */
function UpsellCard({
  riskLevel,
  upsellStatus,
  debtVelocity = 0,
  dtiRatio = 0,
  onAction,
  onDismiss,
  className,
}: UpsellCardProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Don't show if status is NONE or already dismissed
  if (upsellStatus === "NONE" || isDismissed) {
    return null;
  }

  const content: Record<UpsellStatus, UpsellContent> = {
    NONE: {
      color: "",
      icon: null,
      title: "",
      body: "",
      actionLabel: "",
    },
    NUDGE: {
      color: "bg-blue-50 border-blue-200",
      icon: <ShieldCheck className="h-6 w-6 text-blue-500" />,
      title: "Keep your budget on track",
      body: "Did you know? Keeping your debt payments under 36% of income helps maintain financial health.",
      actionLabel: "Learn More",
    },
    TARGET: {
      color: "bg-amber-50 border-amber-200",
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
      title: "Your interest costs are rising",
      body: `Your debt-to-income ratio is ${dtiRatio.toFixed(0)}%. ${
        debtVelocity > 0
          ? `Debt increased ${debtVelocity.toFixed(0)}% this month.`
          : ""
      } We can help you reduce this.`,
      actionLabel: "See Savings Options",
    },
    CRITICAL: {
      color: "bg-red-50 border-red-200",
      icon: <AlertCircle className="h-6 w-6 text-red-600" />,
      title: "Critical: Budget Alert",
      body: "Your debt levels need attention. Speak to a registered Debt Counsellor for a free assessment.",
      actionLabel: "Get Help Now",
    },
  };

  const current = content[upsellStatus];

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "rounded-lg border-l-4 p-4 shadow-sm relative",
          current.color,
          className
        )}
      >
        {/* Dismiss button for non-critical alerts */}
        {upsellStatus !== "CRITICAL" && onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{current.icon}</div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {current.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{current.body}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                onClick={onAction}
                className={cn(
                  upsellStatus === "CRITICAL" &&
                    "bg-red-600 hover:bg-red-700"
                )}
              >
                {current.actionLabel}
              </Button>

              {/* Regulatory disclaimer - always visible per NCA compliance */}
              <p className="text-[10px] text-gray-400 max-w-[200px]">
                Service by Debt Payoff SA (NCR Registered)
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact inline upsell for toast notifications
 */
interface UpsellToastProps {
  message: string;
  onAction: () => void;
  onDismiss: () => void;
}

function UpsellToast({ message, onAction, onDismiss }: UpsellToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-20 right-4 z-50 max-w-sm"
    >
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">{message}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={onDismiss}>
                Later
              </Button>
              <Button size="sm" onClick={onAction}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { UpsellCard, UpsellToast };
