import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text" | "card";
  width?: string | number;
  height?: string | number;
}

function Skeleton({
  className,
  variant = "default",
  width,
  height,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    default: "rounded-md",
    circular: "rounded-full",
    text: "rounded h-4",
    card: "rounded-lg",
  };

  return (
    <div
      className={cn(
        "animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]",
        variantStyles[variant],
        className
      )}
      style={{
        width: width,
        height: height,
      }}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton variant="circular" className="h-5 w-5" />
      </div>
      <Skeleton className="h-8 w-32 mb-2" />
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Greeting skeleton */}
      <div className="text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>

      {/* Hero - Budget Snapshot skeleton */}
      <Skeleton variant="card" className="h-36 w-full" />

      {/* 4 Budget metrics grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Chart skeleton */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton variant="circular" className="h-5 w-5" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-4 w-56 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton variant="card" className="h-24" />
        <Skeleton variant="card" className="h-24" />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonDashboard };
