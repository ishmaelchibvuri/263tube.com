"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getUserDashboardRoute } from "@/lib/admin-tier";
import { Loader2, LayoutDashboard, Sparkles, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthButton() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#DE2010] text-white flex items-center justify-center text-sm font-bold hover:bg-[#ff2a17] transition-colors focus:outline-none focus:ring-2 focus:ring-[#DE2010]/50">
            {user.email?.charAt(0).toUpperCase() || "U"}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1d] border-white/10">
          <div className="px-2 py-1.5 text-xs text-slate-400 truncate">
            {user.email}
          </div>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem asChild className="cursor-pointer text-white hover:!bg-white/10 focus:!bg-white/10">
            <Link href={dashboardRoute} className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-red-400 hover:!bg-white/10 focus:!bg-white/10 focus:!text-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
