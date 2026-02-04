"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wallet } from "lucide-react";

export function MobileTopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navButtons = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Budget", href: "/budget", icon: Wallet },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="w-full bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-center px-4 py-2 gap-3">
        {navButtons.map((button) => {
          const active = isActive(button.href);
          const Icon = button.icon;

          return (
            <button
              key={button.href}
              onClick={() => handleNavigation(button.href)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 touch-manipulation
                ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
                active:scale-95
              `}
            >
              <Icon className="w-4 h-4" />
              {button.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
