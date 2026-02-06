import { Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { getAllInquiries } from "@/lib/actions/inquiries";
import { InquiriesTable } from "@/components/admin/InquiriesTable";
import { requireAdmin } from "@/lib/auth-server";

export const metadata = {
  title: "Business Inquiries - Admin | 263Tube",
  description: "View and manage business inquiries from brands and sponsors",
};

export default async function InquiriesPage() {
  // Require admin access
  try {
    await requireAdmin();
  } catch {
    redirect("/unauthorized");
  }

  // Fetch inquiries
  const result = await getAllInquiries(50);
  const inquiries = result.success ? result.data : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#DE2010]/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#DE2010]" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Business Inquiries
            </h1>
          </div>
          <p className="text-slate-400">
            Manage incoming business inquiries from brands and sponsors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-white/[0.05] text-sm text-slate-400">
            {inquiries.length} total
          </span>
        </div>
      </div>

      {/* Inquiries Table */}
      <InquiriesTable inquiries={inquiries} />
    </div>
  );
}
