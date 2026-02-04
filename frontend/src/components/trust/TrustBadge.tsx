"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ShieldCheck, BadgeCheck, FileCheck, Award } from "lucide-react";

const trustBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        ncr: "bg-blue-50 text-blue-700 border border-blue-200",
        fais: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        verified: "bg-primary/10 text-primary border border-primary/20",
        trusted: "bg-trust-shield/10 text-trust-shield border border-trust-shield/20",
        warning: "bg-warning-subtle text-warning-foreground border border-warning/30",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        default: "text-xs px-2.5 py-1",
        lg: "text-sm px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "verified",
      size: "default",
    },
  }
);

export interface TrustBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof trustBadgeVariants> {
  showIcon?: boolean;
  pulse?: boolean;
}

const badgeIcons = {
  ncr: ShieldCheck,
  fais: FileCheck,
  verified: BadgeCheck,
  trusted: Award,
  warning: ShieldCheck,
};

const badgeLabels = {
  ncr: "NCR Registered",
  fais: "FAIS Compliant",
  verified: "Verified",
  trusted: "Trusted",
  warning: "Caution",
};

function TrustBadge({
  className,
  variant = "verified",
  size,
  showIcon = true,
  pulse = false,
  children,
  ...props
}: TrustBadgeProps) {
  const Icon = badgeIcons[variant || "verified"];
  const defaultLabel = badgeLabels[variant || "verified"];

  return (
    <div
      className={cn(
        trustBadgeVariants({ variant, size }),
        pulse && "animate-trust-pulse",
        className
      )}
      {...props}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{children || defaultLabel}</span>
    </div>
  );
}

/**
 * NCR Registration Badge with registration number
 */
interface NCRBadgeProps extends Omit<TrustBadgeProps, "variant"> {
  registrationNumber?: string;
}

function NCRBadge({ registrationNumber, ...props }: NCRBadgeProps) {
  return (
    <TrustBadge variant="ncr" {...props}>
      {registrationNumber ? `NCR ${registrationNumber}` : "NCR Registered"}
    </TrustBadge>
  );
}

/**
 * Bank Verified Badge for imported transactions
 */
function VerifiedByBankBadge(props: Omit<TrustBadgeProps, "variant" | "children">) {
  return (
    <TrustBadge variant="verified" {...props}>
      Verified by Bank
    </TrustBadge>
  );
}

/**
 * Composite trust badge group for displaying multiple credentials
 */
interface TrustBadgeGroupProps {
  ncr?: boolean;
  ncrNumber?: string;
  fais?: boolean;
  verified?: boolean;
  className?: string;
}

function TrustBadgeGroup({
  ncr,
  ncrNumber,
  fais,
  verified,
  className,
}: TrustBadgeGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {ncr && <NCRBadge registrationNumber={ncrNumber} size="sm" />}
      {fais && <TrustBadge variant="fais" size="sm" />}
      {verified && <TrustBadge variant="verified" size="sm" />}
    </div>
  );
}

export {
  TrustBadge,
  NCRBadge,
  VerifiedByBankBadge,
  TrustBadgeGroup,
  trustBadgeVariants,
};
