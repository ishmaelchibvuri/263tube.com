"use client";

import { Users, Eye, Heart, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type IconName = "users" | "eye" | "heart" | "play";

const iconMap = {
  users: Users,
  eye: Eye,
  heart: Heart,
  play: Play,
};

interface StatsBadgeProps {
  label: string;
  value: number | string;
  icon?: IconName;
  className?: string;
  size?: "sm" | "md" | "lg";
  subtitle?: string;
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
  icon,
  className,
  size = "md",
  subtitle,
}: StatsBadgeProps) {
  const Icon = icon ? iconMap[icon] : null;

  const sizeClasses = {
    sm: "px-3 py-3",
    md: "px-4 py-4",
    lg: "px-6 py-5",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
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
        "flex flex-col items-center text-center rounded-xl bg-white/[0.03] border border-white/[0.06]",
        sizeClasses[size],
        className
      )}
    >
      {Icon && (
        <Icon className={cn("text-[#DE2010] mb-1.5", iconSizeClasses[size])} />
      )}
      <span
        className={cn(
          "font-bold text-white leading-tight truncate w-full",
          valueSizeClasses[size]
        )}
      >
        {formattedValue}
      </span>
      <span className="text-[11px] text-slate-500 uppercase tracking-wider mt-1 leading-tight">
        {label}
      </span>
      {subtitle && (
        <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default StatsBadge;
