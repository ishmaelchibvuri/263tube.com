"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Loader2,
  LayoutDashboard,
  BookOpen,
  Mail,
  Users,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/submissions", icon: BookOpen, label: "Submissions" },
  { href: "/admin/inquiries", icon: Mail, label: "Inquiries" },
  { href: "/admin/creators", icon: Users, label: "Creators" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#DE2010]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f0f12] border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#DE2010] font-bold text-lg">263</span>
          <span className="text-white font-bold text-lg">Tube</span>
          <span className="text-slate-500 text-sm ml-1">Admin</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/[0.05]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0f0f12] border-r border-white/[0.08] transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Brand */}
          <div className="p-6 border-b border-white/[0.08]">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center">
                <span className="text-white font-bold text-sm">263</span>
              </div>
              <div>
                <span className="text-white font-bold text-lg">Tube</span>
                <span className="text-slate-500 text-xs ml-1.5">Admin</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#DE2010]/10 text-[#DE2010] border border-[#DE2010]/20"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-white/[0.08]">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#DE2010] to-[#b01a0d] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.email}
                </p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full mt-2 px-4 py-2 rounded-lg border border-white/[0.1] text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Back to Site
            </Link>
            <button
              className="flex items-center justify-center gap-2 w-full mt-2 px-4 py-2 rounded-lg text-[#DE2010] hover:bg-[#DE2010]/10 transition-colors text-sm"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Zimbabwe flag stripe accent */}
          <div className="zim-stripe" />
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
