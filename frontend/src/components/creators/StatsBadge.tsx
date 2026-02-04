"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsBadgeProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function formatNumber(num: number): string {
  if (typeof num !== "number") return String(num);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString();
}

export function StatsBadge({
  label,
  value,
  icon: Icon,
  className,
  size = "md",
}: StatsBadgeProps) {
  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-6 py-4",
  };

  const valueSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const formattedValue =
    typeof value === "number" ? formatNumber(value) : value;

  return (
    <div
      className={cn(
        "stats-badge",
        sizeClasses[size],
        className
      )}
    >
      {Icon && (
        <Icon className="w-5 h-5 text-primary mb-1" />
      )}
      <span className={cn("stats-badge-value", valueSizeClasses[size])}>
        {formattedValue}
      </span>
      <span className="stats-badge-label">{label}</span>
    </div>
  );
}

export default StatsBadge;
