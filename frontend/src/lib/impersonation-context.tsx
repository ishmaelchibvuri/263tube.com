'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { isAdminPath } from './admin-tier';

type SubscriptionTier = 'free' | 'premium' | 'pro';

interface ImpersonationContextType {
  impersonatedTier: SubscriptionTier | null;
  setImpersonatedTier: (tier: SubscriptionTier | null, redirectToUser?: boolean) => void;
  clearImpersonation: (redirectToAdmin?: boolean) => void;
  isImpersonating: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

const STORAGE_KEY = 'admin_impersonated_tier';

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [impersonatedTier, setImpersonatedTierState] = useState<SubscriptionTier | null>(null);

  // Load impersonated tier from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.role === 'admin') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['free', 'premium', 'pro'].includes(stored)) {
        setImpersonatedTierState(stored as SubscriptionTier);
      }
    }
  }, [user]);

  const setImpersonatedTier = useCallback((tier: SubscriptionTier | null, redirectToUser: boolean = true) => {
    // Only admins can impersonate
    if (user?.role !== 'admin') {
      console.warn('Only admins can impersonate tiers');
      return;
    }

    setImpersonatedTierState(tier);

    if (typeof window !== 'undefined') {
      if (tier) {
        localStorage.setItem(STORAGE_KEY, tier);
        console.log(`🎭 Impersonating tier: ${tier}`);

        // Redirect to user dashboard when switching to user mode
        if (redirectToUser && pathname && isAdminPath(pathname)) {
          console.log('📍 Redirecting from admin to user dashboard...');
          router.push('/dashboard');
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
        console.log('👤 Cleared impersonation');
      }
    }
  }, [user, router, pathname]);

  const clearImpersonation = useCallback((redirectToAdmin: boolean = true) => {
    setImpersonatedTierState(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      console.log('👤 Cleared impersonation');

      // Redirect to admin dashboard when exiting user mode
      if (redirectToAdmin && pathname && !isAdminPath(pathname)) {
        console.log('📍 Redirecting from user to admin dashboard...');
        router.push('/admin/dashboard');
      }
    }
  }, [router, pathname]);

  const value = {
    impersonatedTier,
    setImpersonatedTier,
    clearImpersonation,
    isImpersonating: impersonatedTier !== null,
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
