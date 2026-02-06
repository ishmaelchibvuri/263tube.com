import { Inbox } from "lucide-react";
import { ActivityCard } from "./ActivityCard";
import type { ActivityItem } from "@/lib/actions/activity";

interface ActivityListProps {
  items: ActivityItem[];
}

export function ActivityList({ items }: ActivityListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/[0.05] flex items-center justify-center">
          <Inbox className="w-7 h-7 text-slate-500" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">No activity yet</h2>
        <p className="text-sm text-slate-500">
          When you submit or claim a creator profile, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ActivityCard key={item.pk} item={item} />
      ))}
    </div>
  );
}
