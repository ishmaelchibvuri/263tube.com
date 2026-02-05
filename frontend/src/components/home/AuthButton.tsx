"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getUserDashboardRoute } from "@/lib/admin-tier";
import { Loader2, LayoutDashboard, Sparkles } from "lucide-react";

export function AuthButton() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium bg-[#DE2010]/50 text-white rounded-lg sm:rounded-xl">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (user) {
    const dashboardRoute = getUserDashboardRoute(user);
    return (
      <Link
        href={dashboardRoute}
        className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium bg-[#DE2010] text-white rounded-lg sm:rounded-xl hover:bg-[#ff2a17] transition-colors flex items-center gap-2"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
    );
  }

  return (
    <Link
      href="/register"
      className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium bg-[#DE2010] text-white rounded-lg sm:rounded-xl hover:bg-[#ff2a17] transition-colors flex items-center gap-2"
    >
      <Sparkles className="w-4 h-4" />
      <span className="hidden sm:inline">Creator/Sponsor Start Here</span>
      <span className="sm:hidden">Join Free</span>
    </Link>
  );
}
