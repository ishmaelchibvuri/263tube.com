import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-server";
import { getAllCreatorsForAdmin } from "@/lib/actions/sync-engine";
import { CreatorsManagement } from "./CreatorsManagement";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Creators - Admin | 263Tube",
  description: "Search, filter and manage registered creators",
};

export default async function AdminCreatorsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/unauthorized");
  }

  const creators = await getAllCreatorsForAdmin();

  return <CreatorsManagement creators={creators} />;
}
