"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Wallet,
  TrendingDown,
  AlertCircle,
  PiggyBank,
  BarChart3,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client-debts";
import { Budget, BudgetDashboardStats, UserRiskProfile, MonthlySummary } from "@/types";
import {
  calculateTotalIncome,
  calculateFixedObligations,
  calculateVariableExpenses,
  calculateDebtAttackBudget,
  calculateNeeds,
  calculateWants,
  calculateSavings,
  calculateLoans,
} from "@/lib/debt-calculations";
import { format, parseISO } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IncomeVsExpensesChart } from "@/components/dashboard/IncomeVsExpensesChart";
import { BudgetNudge } from "@/components/dashboard/BudgetNudge";
import {
  getStoredMonth,
  setStoredMonth,
  getPreviousMonth,
  getNextMonth,
  formatMonthDisplay,
  getCurrentMonth,
  isFutureMonth,
} from "@/lib/month-storage";

// Trust Stack imports
import { SkeletonDashboard } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { UpsellCard } from "@/components/upsell/UpsellCard";
import { PopiaConsentModal } from "@/components/consent/PopiaConsentModal";
import { CriticalInterventionModal } from "@/components/upsell/CriticalInterventionModal";
import { RegulatoryDisclaimer } from "@/components/compliance/RegulatoryDisclaimer";

// Offline-first imports
import { useBudgetStream } from "@/hooks/useBudgetStream";
import { OfflineIndicator } from "@/components/ui/offline-indicator";

export default function DashboardHome() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  // Initialize from storage to persist month across page refreshes
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getStoredMonth();
    }
    return getCurrentMonth();
  });

  // Offline-first budget stream
  const {
    budget: streamBudget,
    budgetLineItems,
    isOnline,
    isSyncing,
    pendingChanges,
    syncError,
    isLoading: streamLoading,
    syncNow,
  } = useBudgetStream({
    userId: user?.userId || '',
    month: selectedMonth,
  });

  // Risk profile and upsell state (Trust Stack)
  const [riskProfile, setRiskProfile] = useState<UserRiskProfile | null>(null);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [upsellDismissed, setUpsellDismissed] = useState(false);

  // Memoize calculated values to avoid infinite loops
  const { budgetStats, needsTotal, wantsTotal, savingsTotal, loansTotal } = useMemo(() => {
    if (streamBudget) {
      const budgetData = {
        ...streamBudget,
        customItems: budgetLineItems,
      } as Budget;

      // Calculate stats from budget data
      const totalIncome = calculateTotalIncome(budgetData);
      const totalFixed = calculateFixedObligations(budgetData);
      const totalVariable = calculateVariableExpenses(budgetData);
      const available = calculateDebtAttackBudget(budgetData);

      // 50/30/20 breakdown
      const needs = calculateNeeds(budgetData);
      const wants = calculateWants(budgetData);
      const savings = calculateSavings(budgetData);
      const loans = calculateLoans(budgetData);

      // Determine health status
      let healthStatus: 'HEALTHY' | 'TIGHT' | 'DEFICIT' = 'HEALTHY';
      const healthPercentage = totalIncome > 0 ? (available / totalIncome) * 100 : 0;

      if (available < 0) {
        healthStatus = 'DEFICIT';
      } else if (healthPercentage < 10) {
        healthStatus = 'TIGHT';
      }

      const hasBudgetData = totalIncome > 0 || totalFixed > 0 || totalVariable > 0;

      const stats: BudgetDashboardStats = {
        totalIncome,
        totalFixedObligations: totalFixed,
        totalVariableExpenses: totalVariable,
        availableBalance: available,
        healthStatus,
        healthPercentage,
        monthlyHistory: [],
        currentMonth: selectedMonth,
        budgetExists: !!(streamBudget?.budgetId) || hasBudgetData,
      };

      return {
        budgetStats: stats,
        needsTotal: needs,
        wantsTotal: wants,
        savingsTotal: savings,
        loansTotal: loans,
      };
    }

    // Default empty state
    return {
      budgetStats: {
        totalIncome: 0,
        totalFixedObligations: 0,
        totalVariableExpenses: 0,
        availableBalance: 0,
        healthStatus: 'HEALTHY' as const,
        healthPercentage: 0,
        monthlyHistory: [],
        currentMonth: selectedMonth,
        budgetExists: false,
      },
      needsTotal: 0,
      wantsTotal: 0,
      savingsTotal: 0,
      loansTotal: 0,
    };
  }, [streamBudget, budgetLineItems, selectedMonth]);

  // Derive loading states
  const loading = streamLoading;
  const isInitialLoad = streamLoading && !streamBudget;

  // Load risk profile (separate from offline-first budget data)
  useEffect(() => {
    if (user?.userId && selectedMonth) {
      loadRiskProfile();
    }
  }, [user, selectedMonth]);

  const loadRiskProfile = async () => {
    try {
      const [profile, summaries] = await Promise.all([
        api.riskProfile.getRiskProfile(),
        api.riskProfile.getMonthlySummaries(6),
      ]);
      setRiskProfile(profile);
      setMonthlySummaries(summaries);

      // Check if we should show critical intervention modal
      if (profile && (profile.dtiRatio > 50 || profile.riskLevel === 'HIGH') && !upsellDismissed) {
        setShowCriticalModal(true);
      }
    } catch (riskError) {
      console.log('Risk profile not available:', riskError);
    }
  };


  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setStoredMonth(newMonth);
  };

  const goToPreviousMonth = () => {
    const prevMonth = getPreviousMonth(selectedMonth);
    handleMonthChange(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = getNextMonth(selectedMonth);
    handleMonthChange(nextMonth);
  };

  // South African multilingual greetings - cycles randomly on each load
  const getGreeting = () => {
    const firstName = user?.firstName || 'Friend';

    // Greetings from all 11 official SA languages + common variations
    const greetings = [
      // Zulu
      { greeting: 'Sawubona', language: 'isiZulu' },
      // Xhosa
      { greeting: 'Molo', language: 'isiXhosa' },
      // Afrikaans
      { greeting: 'Goeie dag', language: 'Afrikaans' },
      { greeting: 'Hallo', language: 'Afrikaans' },
      // Sepedi / Northern Sotho
      { greeting: 'Dumela', language: 'Sepedi' },
      { greeting: 'Thobela', language: 'Sepedi' },
      // Setswana
      { greeting: 'Dumelang', language: 'Setswana' },
      // Sesotho
      { greeting: 'Dumela', language: 'Sesotho' },
      // Tshivenda
      { greeting: 'Ndaa', language: 'Tshivenda' },
      { greeting: 'Aa', language: 'Tshivenda' },
      // Xitsonga
      { greeting: 'Avuxeni', language: 'Xitsonga' },
      // siSwati
      { greeting: 'Sawubona', language: 'siSwati' },
      // isiNdebele
      { greeting: 'Lotjhani', language: 'isiNdebele' },
      // English
      { greeting: 'Hello', language: 'English' },
      { greeting: 'Welcome back', language: 'English' },
      { greeting: 'Good to see you', language: 'English' },
    ];

    // Pick a random greeting (changes on each page load/render)
    const randomIndex = Math.floor(Math.random() * greetings.length);
    const selected = greetings[randomIndex]!; // Array is never empty

    return {
      text: `${selected.greeting}, ${firstName}!`,
      language: selected.language,
    };
  };

  // Memoize greeting to prevent it from changing on every re-render
  const greeting = useMemo(() => getGreeting(), [user?.firstName]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-100';
      case 'TIGHT': return 'text-yellow-600 bg-yellow-100';
      case 'DEFICIT': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthLabel = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'Healthy';
      case 'TIGHT': return 'Tight';
      case 'DEFICIT': return 'Deficit';
      default: return status;
    }
  };

  // Upsell action handlers (Trust Stack)
  const handleUpsellAction = () => {
    setShowConsentModal(true);
  };

  const handleConsentGranted = async (consentId: string) => {
    try {
      await api.partner.submitLead({
        fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email: user?.email || '',
        consentId,
      });
      console.log('Lead submitted successfully');
    } catch (err) {
      console.error('Failed to submit lead:', err);
    }
  };

  const handleConsentDeclined = () => {
    setUpsellDismissed(true);
  };

  const handleCriticalDismiss = () => {
    setShowCriticalModal(false);
    setUpsellDismissed(true);
  };

  // Extract income trend data for sparklines
  const incomeTrendData = monthlySummaries.map(s => s.totalIncome);
  const expenseTrendData = budgetStats?.monthlyHistory.map(h => h.expenses) || [];

  // Only show full skeleton on initial load
  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="p-6 max-w-6xl mx-auto">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  if (!budgetStats) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {error || 'Unable to load dashboard data. Please try again.'}
            </p>
            <Button onClick={() => syncNow()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state - No budget yet
  if (!budgetStats.budgetExists && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-6xl mx-auto">
          {/* Greeting Header */}
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              {greeting.text}
            </h1>
            <p className="text-gray-600 text-sm">
              {format(new Date(), 'EEEE, dd MMMM yyyy')}
              <span className="mx-2">•</span>
              <span className="text-gray-400 italic">{greeting.language}</span>
            </p>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="px-4 py-2 bg-white rounded-full shadow-sm border min-w-[180px] text-center">
              <span className="font-semibold text-gray-900">
                {formatMonthDisplay(selectedMonth)}
              </span>
              {selectedMonth !== getCurrentMonth() && (
                <span className="text-xs text-gray-500 block">
                  {isFutureMonth(selectedMonth) ? 'Future' : 'Past'}
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-9 w-9"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Empty State Card */}
          <Card className="max-w-2xl w-full shadow-xl mx-auto">
            <CardContent className="py-12 text-center">
              <div className="bg-blue-100 rounded-full p-6 w-fit mx-auto mb-6">
                <Wallet className="h-12 w-12 text-blue-600" />
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                No Budget for {formatMonthDisplay(selectedMonth)}
              </h2>

              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Create a budget for this month to track your income, expenses, and see exactly where your money goes.
              </p>

              <Button
                size="lg"
                className="flex items-center gap-2 mx-auto"
                onClick={() => {
                  setStoredMonth(selectedMonth);
                  window.location.href = '/budget';
                }}
              >
                <Wallet className="h-5 w-5" />
                Create Budget
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalExpenses = budgetStats.totalFixedObligations + budgetStats.totalVariableExpenses;
  const isViewingCurrentMonth = selectedMonth === getCurrentMonth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-6xl mx-auto">
        {/* Error Banner */}
        {error && (
          <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <p className="text-orange-900 text-sm flex-1">
                Connection issue - showing sample data
              </p>
              <Button onClick={() => syncNow()} size="sm" variant="ghost">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Greeting Header */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {greeting.text}
          </h1>
          <p className="text-gray-600 text-sm">
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
            <span className="mx-2">•</span>
            <span className="text-gray-400 italic">{greeting.language}</span>
          </p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="px-4 py-2 bg-white rounded-full shadow-sm border min-w-[180px] text-center">
            <span className="font-semibold text-gray-900">
              {formatMonthDisplay(selectedMonth)}
            </span>
            {!isViewingCurrentMonth && (
              <span className="text-xs text-gray-500 block">
                {isFutureMonth(selectedMonth) ? 'Future' : 'Past'}
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Loading overlay for month switching */}
        {loading && !isInitialLoad && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
              <span className="text-sm">Loading {formatMonthDisplay(selectedMonth)}...</span>
            </div>
          </div>
        )}

        {/* Hero - Budget Snapshot */}
        <Card className={`shadow-xl overflow-hidden ${loading && !isInitialLoad ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
            <p className="text-sm mb-4 opacity-90 text-center">
              Budget Snapshot
            </p>

            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-xs opacity-75 mb-1">Income</p>
                <p className="text-lg md:text-2xl font-bold">{formatCurrency(budgetStats.totalIncome)}</p>
              </div>
              <div>
                <p className="text-xs opacity-75 mb-1">Expenses</p>
                <p className="text-lg md:text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
              <div>
                <p className="text-xs opacity-75 mb-1">What's Left</p>
                <p className={`text-lg md:text-2xl font-bold ${budgetStats.availableBalance < 0 ? 'text-red-300' : ''}`}>
                  {formatCurrency(budgetStats.availableBalance)}
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getHealthColor(budgetStats.healthStatus)}`}>
                {getHealthLabel(budgetStats.healthStatus)}
              </span>
            </div>
          </div>
        </Card>

        {/* 5 Budget Metric Cards - Hidden on mobile */}
        <div className={`hidden md:grid grid-cols-5 gap-4 ${loading && !isInitialLoad ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Card 1: Total Income */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-help hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-green-700 font-medium">Income</p>
                      <Wallet className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(budgetStats.totalIncome)}
                      </p>
                      {incomeTrendData.length >= 2 && (
                        <Sparkline
                          data={incomeTrendData}
                          width={50}
                          height={20}
                          color="success"
                        />
                      )}
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Monthly total
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Total Income</p>
                <p className="text-sm text-gray-600">All income sources for this month including salary, secondary income, and grants.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Card 2: Needs (50%) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={`cursor-help hover:shadow-lg transition-shadow bg-gradient-to-br border ${
                  budgetStats.totalIncome > 0 && (needsTotal / budgetStats.totalIncome * 100) > 50
                    ? 'from-red-50 to-red-100 border-red-300'
                    : 'from-blue-50 to-blue-100 border-blue-200'
                }`}>
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-medium ${
                        budgetStats.totalIncome > 0 && (needsTotal / budgetStats.totalIncome * 100) > 50
                          ? 'text-red-700'
                          : 'text-blue-700'
                      }`}>Needs</p>
                      <Receipt className={`h-5 w-5 ${
                        budgetStats.totalIncome > 0 && (needsTotal / budgetStats.totalIncome * 100) > 50
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`} />
                    </div>
                    <p className={`text-2xl font-bold ${
                      budgetStats.totalIncome > 0 && (needsTotal / budgetStats.totalIncome * 100) > 50
                        ? 'text-red-900'
                        : 'text-blue-900'
                    }`}>
                      {formatCurrency(needsTotal)}
                    </p>
                    <p className={`text-xs mt-2 ${
                      budgetStats.totalIncome > 0 && (needsTotal / budgetStats.totalIncome * 100) > 50
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}>
                      {budgetStats.totalIncome > 0 ? Math.round((needsTotal / budgetStats.totalIncome) * 100) : 0}% of income
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Needs (50%)</p>
                <p className="text-sm text-gray-600">Essential expenses: housing, transport, utilities, insurance, education. Target: 50% of income.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Card 3: Wants (30%) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={`cursor-help hover:shadow-lg transition-shadow bg-gradient-to-br border ${
                  budgetStats.totalIncome > 0 && (wantsTotal / budgetStats.totalIncome * 100) > 30
                    ? 'from-red-50 to-red-100 border-red-300'
                    : 'from-purple-50 to-purple-100 border-purple-200'
                }`}>
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-medium ${
                        budgetStats.totalIncome > 0 && (wantsTotal / budgetStats.totalIncome * 100) > 30
                          ? 'text-red-700'
                          : 'text-purple-700'
                      }`}>Wants</p>
                      <TrendingDown className={`h-5 w-5 ${
                        budgetStats.totalIncome > 0 && (wantsTotal / budgetStats.totalIncome * 100) > 30
                          ? 'text-red-600'
                          : 'text-purple-600'
                      }`} />
                    </div>
                    <p className={`text-2xl font-bold ${
                      budgetStats.totalIncome > 0 && (wantsTotal / budgetStats.totalIncome * 100) > 30
                        ? 'text-red-900'
                        : 'text-purple-900'
                    }`}>
                      {formatCurrency(wantsTotal)}
                    </p>
                    <p className={`text-xs mt-2 ${
                      budgetStats.totalIncome > 0 && (wantsTotal / budgetStats.totalIncome * 100) > 30
                        ? 'text-red-600'
                        : 'text-purple-600'
                    }`}>
                      {budgetStats.totalIncome > 0 ? Math.round((wantsTotal / budgetStats.totalIncome) * 100) : 0}% of income
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Wants (30%)</p>
                <p className="text-sm text-gray-600">Lifestyle choices: entertainment, subscriptions, personal care. Target: 30% of income.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Card 4: Savings (20%) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={`cursor-help hover:shadow-lg transition-shadow bg-gradient-to-br border ${
                  budgetStats.totalIncome > 0 && (savingsTotal / budgetStats.totalIncome * 100) >= 20
                    ? 'from-emerald-50 to-emerald-100 border-emerald-300'
                    : 'from-amber-50 to-amber-100 border-amber-300'
                }`}>
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-medium ${
                        budgetStats.totalIncome > 0 && (savingsTotal / budgetStats.totalIncome * 100) >= 20
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}>Savings</p>
                      <PiggyBank className={`h-5 w-5 ${
                        budgetStats.totalIncome > 0 && (savingsTotal / budgetStats.totalIncome * 100) >= 20
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`} />
                    </div>
                    <p className={`text-2xl font-bold ${
                      budgetStats.totalIncome > 0 && (savingsTotal / budgetStats.totalIncome * 100) >= 20
                        ? 'text-emerald-900'
                        : 'text-amber-900'
                    }`}>
                      {formatCurrency(savingsTotal)}
                    </p>
                    <p className={`text-xs mt-2 ${
                      budgetStats.totalIncome > 0 && (savingsTotal / budgetStats.totalIncome * 100) >= 20
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}>
                      {budgetStats.totalIncome > 0 ? Math.round((savingsTotal / budgetStats.totalIncome) * 100) : 0}% of income
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Savings (20%)</p>
                <p className="text-sm text-gray-600">Money allocated to savings: emergency fund, investments, debt accelerator. Combined with Available funds, your target is 20% of income.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Card 5: Available Balance */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={`cursor-help hover:shadow-lg transition-shadow bg-gradient-to-br border-2 ${
                  budgetStats.availableBalance >= 0
                    ? 'from-emerald-50 to-emerald-100 border-emerald-300'
                    : 'from-red-50 to-red-100 border-red-300'
                }`}>
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-semibold ${budgetStats.availableBalance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Available</p>
                      <Wallet className={`h-5 w-5 ${budgetStats.availableBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                    </div>
                    <p className={`text-2xl font-bold ${budgetStats.availableBalance >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                      {formatCurrency(budgetStats.availableBalance)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${budgetStats.availableBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {budgetStats.healthPercentage.toFixed(1)}% left
                      </p>
                      {expenseTrendData.length >= 2 && (
                        <Sparkline
                          data={expenseTrendData}
                          width={40}
                          height={16}
                          color={budgetStats.availableBalance >= 0 ? 'success' : 'danger'}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Available Balance</p>
                <p className="text-sm text-gray-600">
                  {budgetStats.availableBalance >= 0
                    ? 'Money remaining after all expenses. Use for extra savings or debt payments.'
                    : 'You\'re spending more than you earn. Review your expenses.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Upsell Card - Shows for users with elevated risk profiles (Trust Stack) */}
        {riskProfile && riskProfile.upsellStatus !== 'NONE' && !upsellDismissed && (
          <UpsellCard
            riskLevel={riskProfile.riskLevel}
            upsellStatus={riskProfile.upsellStatus}
            debtVelocity={riskProfile.debtVelocity}
            dtiRatio={riskProfile.dtiRatio}
            onAction={handleUpsellAction}
            onDismiss={() => setUpsellDismissed(true)}
          />
        )}

        {/* Income vs Expenses Chart */}
        <Card className={loading && !isInitialLoad ? 'opacity-50 pointer-events-none' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Income vs Expenses
            </CardTitle>
            <CardDescription>How your money is allocated this month</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeVsExpensesChart
              totalIncome={budgetStats.totalIncome}
              needsTotal={needsTotal}
              wantsTotal={wantsTotal}
              savingsTotal={savingsTotal}
              availableBalance={budgetStats.availableBalance}
            />
          </CardContent>
        </Card>

        {/* Budget Nudge - 50/30/20 Analysis with Loan Tracking */}
        <div className={loading && !isInitialLoad ? 'opacity-50 pointer-events-none' : ''}>
          <BudgetNudge
            totalIncome={budgetStats.totalIncome}
            totalFixedObligations={budgetStats.totalFixedObligations}
            totalVariableExpenses={budgetStats.totalVariableExpenses}
            availableBalance={budgetStats.availableBalance}
            loansTotal={loansTotal}
            savingsTotal={savingsTotal}
            needsTotal={needsTotal}
          />
        </div>

        {/* Regulatory Disclaimer (Trust Stack) */}
        {riskProfile && riskProfile.upsellStatus !== 'NONE' && (
          <RegulatoryDisclaimer variant="footer" />
        )}
      </div>

      {/* POPIA Consent Modal (Trust Stack) */}
      <PopiaConsentModal
        open={showConsentModal}
        onOpenChange={setShowConsentModal}
        onConsentGranted={handleConsentGranted}
        onConsentDeclined={handleConsentDeclined}
        userEmail={user?.email || ''}
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
      />

      {/* Critical Intervention Modal (Trust Stack) */}
      <CriticalInterventionModal
        open={showCriticalModal}
        onOpenChange={setShowCriticalModal}
        onGetHelp={handleUpsellAction}
        onDismiss={handleCriticalDismiss}
        profile={riskProfile}
      />

      {/* Offline Indicator */}
      <OfflineIndicator
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingChanges={pendingChanges}
        syncError={syncError}
        onRetry={syncNow}
      />
    </div>
  );
}
