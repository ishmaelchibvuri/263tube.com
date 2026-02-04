import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface SubscriptionBadgeProps {
  tier: "free" | "pro";
  className?: string;
}

export function SubscriptionBadge({ tier, className = "" }: SubscriptionBadgeProps) {
  if (tier === "pro") {
    return (
      <Badge className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-white ${className}`}>
        <Crown className="w-3 h-3 mr-1" />
        Pro
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={className}>
      Free
    </Badge>
  );
}
