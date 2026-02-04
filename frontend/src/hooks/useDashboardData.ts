"use client";

import useSWR from "swr";
import { api } from "@/lib/api-client-debts";
import { DashboardStats, Debt, PaymentRecord } from "@/types";

interface DashboardData {
  stats: DashboardStats | null;
  debts: Debt[];
  payments: PaymentRecord[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  mutate: () => void;
}

/**
 * SWR hook for dashboard data with stale-while-revalidate caching
 * Optimized for the SA market with offline-first approach
 */
export function useDashboardData(): DashboardData {
  // Fetch dashboard stats
  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR<DashboardStats>(
    "dashboard-stats",
    () => api.dashboard.getDashboardStats(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  // Fetch debts
  const {
    data: debts,
    error: debtsError,
    isLoading: debtsLoading,
    mutate: mutateDebts,
  } = useSWR<Debt[]>(
    "user-debts",
    () => api.debts.getDebts(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );

  // Fetch payments
  const {
    data: payments,
    error: paymentsError,
    isLoading: paymentsLoading,
    mutate: mutatePayments,
  } = useSWR<PaymentRecord[]>(
    "user-payments",
    () => api.payments.getAllPayments(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );

  const isLoading = statsLoading || debtsLoading || paymentsLoading;
  const isError = !!(statsError || debtsError || paymentsError);
  const error = statsError || debtsError || paymentsError || null;

  const mutate = () => {
    mutateStats();
    mutateDebts();
    mutatePayments();
  };

  return {
    stats: stats || null,
    debts: debts || [],
    payments: payments || [],
    isLoading,
    isError,
    error,
    mutate,
  };
}

/**
 * Lightweight stats-only hook for quick dashboard rendering
 */
export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    "dashboard-stats",
    () => api.dashboard.getDashboardStats(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      errorRetryCount: 3,
    }
  );

  return {
    stats: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for debt data with caching
 */
export function useDebts() {
  const { data, error, isLoading, mutate } = useSWR<Debt[]>(
    "user-debts",
    () => api.debts.getDebts(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    debts: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for payment history with caching
 */
export function usePayments() {
  const { data, error, isLoading, mutate } = useSWR<PaymentRecord[]>(
    "user-payments",
    () => api.payments.getAllPayments(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    payments: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
