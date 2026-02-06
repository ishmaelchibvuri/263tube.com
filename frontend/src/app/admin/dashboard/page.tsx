import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-server";
import { getDashboardStats } from "@/lib/actions/sync-engine";
import { DashboardContent } from "./DashboardContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard - Admin | 263Tube",
  description: "263Tube admin dashboard overview",
};

export default async function AdminDashboardPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/unauthorized");
  }

  const stats = await getDashboardStats();

  return <DashboardContent stats={stats} />;
}
