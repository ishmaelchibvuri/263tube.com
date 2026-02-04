"use client";

import { useAuth } from "@/lib/auth-context";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useState } from "react";
import { identifyUser } from "@/lib/analytics";

// Initialize PostHog only on the client side
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie', // Offline-first persistence
  });
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Fetch subscription data when user logs in
  useEffect(() => {
    if (user) {
      const fetchSubscriptionData = async () => {
        try {
          const { accessApi } = await import("@/lib/api-client-debts");
          const access = await accessApi.getUserAccess();

          setSubscriptionData({
            tier: access.tier,
            status: access.status,
            totalPurchases: 0,
            totalSpent: 0,
          });
        } catch (error) {
          console.warn('Failed to fetch subscription data:', error);
          // Set defaults if fetch fails
          setSubscriptionData({
            tier: 'free',
            status: 'active',
            totalPurchases: 0,
            totalSpent: 0,
          });
        }
      };

      fetchSubscriptionData();
    } else {
      setSubscriptionData(null);
    }
  }, [user]);

  // Identify user with full subscription data
  useEffect(() => {
    if (user && subscriptionData) {
      identifyUser({
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        subscriptionTier: subscriptionData.tier,
        subscriptionStatus: subscriptionData.status,
        totalPurchases: subscriptionData.totalPurchases,
        totalSpent: subscriptionData.totalSpent,
      });
    } else if (!user) {
      posthog.reset();
    }
  }, [user, subscriptionData]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
