import { FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { getPendingRequests } from "@/lib/actions/creators";
import { SubmissionsTable, type Submission } from "@/components/admin/SubmissionsTable";
import { requireAdmin } from "@/lib/auth-server";

export const metadata = {
  title: "Creator Submissions - Admin | 263Tube",
  description: "Review and approve pending creator submissions",
};

export default async function SubmissionsPage() {
  // Require admin access
  try {
    await requireAdmin();
  } catch {
    redirect("/unauthorized");
  }

  // Fetch pending submissions
  const result = await getPendingRequests(50);
  const submissions = (result.success ? result.data : []) as Submission[];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#DE2010]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#DE2010]" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Creator Submissions
            </h1>
          </div>
          <p className="text-slate-400">
            Review and approve pending creator profile submissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-white/[0.05] text-sm text-slate-400">
            {submissions.length} pending
          </span>
        </div>
      </div>

      {/* Submissions Table */}
      <SubmissionsTable submissions={submissions} />
    </div>
  );
}
