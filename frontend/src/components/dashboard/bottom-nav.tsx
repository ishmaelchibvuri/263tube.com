"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wallet, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Budget", href: "/budget", icon: Wallet },
    { label: "Profile", href: "/profile", icon: User },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`
                flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-xl transition-all duration-200 touch-manipulation
                ${active
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700 active:bg-gray-100"
                }
              `}
            >
              <div className={`
                p-2 rounded-full transition-all duration-200
                ${active ? "bg-blue-100" : ""}
              `}>
                <Icon className={`w-5 h-5 ${active ? "text-blue-600" : ""}`} />
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? "text-blue-600" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
