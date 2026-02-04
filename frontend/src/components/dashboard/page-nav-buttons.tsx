"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client-debts";
import { Crown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PageNavButtons() {
  const pathname = usePathname();
  const router = useRouter();
  const [tier, setTier] = useState<'free' | 'pro'>('free');

  useEffect(() => {
    loadUserAccess();
  }, []);

  const loadUserAccess = async () => {
    try {
      const access = await api.access.getUserAccess();
      setTier(access.tier);
    } catch (error) {
      console.error("Failed to load user access:", error);
      setTier('free');
    }
  };

  const isFree = tier === 'free';

  const navButtons = [
    { label: "DASHBOARD", href: "/dashboard" },
    { label: "MY DEBTS", href: "/debts" },
    { label: "STRATEGY", href: "/strategy" },
    { label: "BUDGET", href: "/budget" },
    { label: "AUDIT", href: "/audit" },
  ];

  // Add upgrade button for free users
  if (isFree) {
    navButtons.push({ label: "UPGRADE", href: "/pricing" });
  }

  const isActive = (href: string) => {
    // Check if current pathname matches or starts with the button's href
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  // Mobile: Show max 3 buttons + More dropdown if > 4
  const mobileVisibleButtons = navButtons.slice(0, 3);
  const mobileDropdownButtons = navButtons.length > 4 ? navButtons.slice(3) : [];
  const showMobileDropdown = navButtons.length > 4;

  const renderButton = (button: { label: string; href: string }, isMobileDropdown = false, isMobile = false) => {
    const active = isActive(button.href);
    const isUpgrade = button.label === "UPGRADE";

    return (
      <button
        key={button.href}
        onClick={() => handleNavigation(button.href)}
        className={`
          flex items-center gap-1.5 ${isMobile ? 'px-4 py-3.5' : 'px-4 py-2'} rounded-lg font-semibold text-sm transition-all duration-200 whitespace-nowrap
          ${
            active
              ? isUpgrade
                ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 shadow-md"
                : "bg-gradient-to-r from-primary to-secondary text-white shadow-md"
              : isUpgrade
              ? "bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 hover:from-yellow-100 hover:to-orange-100 border border-yellow-300"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
          }
          ${isMobileDropdown ? "w-full justify-start" : ""}
          ${isMobile ? "touch-manipulation" : ""}
          active:scale-95
        `}
      >
        {isUpgrade && <Crown className="w-4 h-4" />}
        {button.label}
      </button>
    );
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start gap-2 py-3">
          {/* Desktop: Show all buttons */}
          <div className="hidden md:flex items-center gap-2 w-full overflow-x-auto no-scrollbar">
            {navButtons.map((button) => renderButton(button))}
          </div>

          {/* Mobile: Show max 3 buttons + More dropdown */}
          <div className="flex md:hidden items-center gap-2 w-full">
            {mobileVisibleButtons.map((button) => renderButton(button, false, true))}

            {showMobileDropdown && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-1.5 px-4 py-3.5 rounded-lg font-semibold text-sm transition-all duration-200 whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 active:scale-95 touch-manipulation"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    MORE
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {mobileDropdownButtons.map((button) => {
                    const active = isActive(button.href);
                    const isUpgrade = button.label === "UPGRADE";

                    return (
                      <DropdownMenuItem
                        key={button.href}
                        onClick={() => handleNavigation(button.href)}
                        className={`
                          flex items-center gap-2 cursor-pointer font-semibold
                          ${active ? "bg-blue-50 text-blue-700" : ""}
                          ${isUpgrade ? "text-yellow-700" : ""}
                        `}
                      >
                        {isUpgrade && <Crown className="w-4 h-4" />}
                        {button.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* If exactly 4 buttons, show 4th normally without dropdown */}
            {navButtons.length === 4 && navButtons[3] && renderButton(navButtons[3], false, true)}
          </div>
        </div>
      </div>
    </div>
  );
}
