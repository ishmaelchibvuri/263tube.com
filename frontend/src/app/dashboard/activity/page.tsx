import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { getMyActivity } from "@/lib/actions/activity";
import { ActivityList } from "@/components/activity";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.user) {
    redirect("/login?callbackUrl=/dashboard/activity");
  }

  const items = await getMyActivity();

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#DE2010]/10 mb-4">
          <ClipboardList className="w-6 h-6 text-[#DE2010]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          My Activity
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Track the status of your submissions and claims
        </p>
      </div>
      <ActivityList items={items} />
    </>
  );
}
