"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { User as UserType } from "@/types";
import Image from "next/image";

interface DashboardNavProps {
  user: UserType;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/budget", label: "Budget", icon: Wallet },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const handleNavigationClick = (e: React.MouseEvent, href: string) => {
    if (typeof window !== 'undefined' && (window as any).__budgetPageNavigationGuard) {
      const canNavigate = (window as any).__budgetPageNavigationGuard(href);
      if (!canNavigate) {
        e.preventDefault();
      }
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
              <Image
                src="/images/header_logo.png"
                alt="QuickBudget"
                width={150}
                height={50}
                priority
                className="h-8 md:h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-full">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavigationClick(e, item.href)}
                  className={`
                    flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition-all duration-200
                    ${
                      active
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile - Page Title (centered) */}
          <div className="md:hidden flex-1 text-center">
            <span className="font-semibold text-gray-800">
              {pathname === '/dashboard' && 'Dashboard'}
              {pathname === '/budget' && 'Budget'}
              {pathname === '/profile' && 'Profile'}
            </span>
          </div>

          {/* User Menu */}
          <div className="flex items-center flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-auto px-2 py-1.5 rounded-full hover:bg-gray-100 transition-all"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-gray-200">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-700">
                      {user.firstName}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    onClick={(e) => handleNavigationClick(e, '/profile')}
                    className="flex items-center cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
