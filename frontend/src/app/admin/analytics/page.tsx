import { BarChart3 } from "lucide-react";
import { fetchAllCreators } from "@/lib/api-client";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Analytics - Admin | 263Tube",
  description: "Platform analytics and creator statistics",
};

export default async function AnalyticsPage() {
  // Fetch all active creators for analytics
  const creators = await fetchAllCreators();

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#319E31]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#319E31]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        </div>
        <p className="text-slate-400">
          Overview of creator metrics and platform performance
        </p>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard creators={creators} />
    </div>
  );
}
