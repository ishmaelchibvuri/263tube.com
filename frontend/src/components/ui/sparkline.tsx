"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: "default" | "success" | "warning" | "danger";
  showDot?: boolean;
  filled?: boolean;
}

/**
 * Lightweight SVG-based sparkline chart for inline trend visualization
 * Designed for performance on low-end devices (SA market target)
 */
function Sparkline({
  data,
  width = 80,
  height = 24,
  strokeWidth = 2,
  color = "default",
  showDot = true,
  filled = false,
  className,
  ...props
}: SparklineProps) {
  if (!data || data.length < 2) {
    return null;
  }

  // Calculate trend direction for automatic color if default
  const firstValue = data[0] ?? 0;
  const lastValue = data[data.length - 1] ?? 0;
  const trend = lastValue - firstValue;

  const colorMap = {
    default: trend >= 0 ? "hsl(var(--trust-shield))" : "hsl(var(--destructive))",
    success: "hsl(var(--trust-shield))",
    warning: "hsl(var(--warning))",
    danger: "hsl(var(--destructive))",
  };

  const strokeColor = colorMap[color];

  // Normalize data to fit within SVG bounds
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Generate path points
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y };
  });

  // Create SVG path
  const pathD = points.reduce((path, point, index) => {
    return path + (index === 0 ? `M ${point.x},${point.y}` : ` L ${point.x},${point.y}`);
  }, "");

  // Create filled area path
  const lastPointForFill = points[points.length - 1];
  const filledPathD = filled && lastPointForFill
    ? `${pathD} L ${lastPointForFill.x},${height - padding} L ${padding},${height - padding} Z`
    : "";

  const lastPoint = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("inline-block", className)}
      aria-label={`Trend: ${trend >= 0 ? "increasing" : "decreasing"}`}
      role="img"
      {...props}
    >
      {/* Filled area */}
      {filled && (
        <path
          d={filledPathD}
          fill={strokeColor}
          fillOpacity={0.1}
        />
      )}

      {/* Main line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      {showDot && lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={strokeWidth + 1}
          fill={strokeColor}
        />
      )}
    </svg>
  );
}

/**
 * Sparkline with label for debt cards
 */
interface SparklineWithLabelProps extends SparklineProps {
  label?: string;
  value?: string;
  trendLabel?: string;
}

function SparklineWithLabel({
  label,
  value,
  trendLabel,
  data,
  ...sparklineProps
}: SparklineWithLabelProps) {
  const firstVal = data?.[0] ?? 0;
  const lastVal = data?.[data.length - 1] ?? 0;
  const trend = data && data.length >= 2 ? lastVal - firstVal : 0;
  const isPositive = trend >= 0;

  return (
    <div className="flex items-center gap-2">
      <Sparkline data={data} {...sparklineProps} />
      {trendLabel && (
        <span
          className={cn(
            "text-xs font-medium",
            isPositive ? "text-trust-shield" : "text-destructive"
          )}
        >
          {isPositive ? "+" : ""}{trendLabel}
        </span>
      )}
    </div>
  );
}

export { Sparkline, SparklineWithLabel };
