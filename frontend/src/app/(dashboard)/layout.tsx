"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { SupportWidget } from "@/components/support/SupportWidget";

function DashboardLayoutContent({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Record<string, string | string[]>>;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <DashboardNav user={user} />

      {/* Main Content - with bottom padding on mobile for bottom nav */}
      <main className="pb-20 md:pb-6">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />

      {/* Support Widget */}
      <SupportWidget />
    </div>
  );
}

export default dynamic(() => Promise.resolve(DashboardLayoutContent), {
  ssr: false,
});
