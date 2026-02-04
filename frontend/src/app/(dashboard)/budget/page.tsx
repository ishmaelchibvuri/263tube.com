"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  Home,
  Car,
  Zap,
  Shield,
  GraduationCap,
  ShoppingCart,
  Scissors,
  Stethoscope,
  Smile,
  MoreHorizontal,
  Plus,
  Trash2,
  Heart,
  Loader2,
  Copy,
  Calendar,
  Trash,
  Tv,
  Baby,
  HeartPulse,
  Lock,
  PiggyBank,
  Banknote,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client-debts";
import { Budget, BudgetLineItem, Debt } from "@/types";
import {
  calculateTotalIncome,
  calculateFixedObligations,
  calculateVariableExpenses,
  calculateDebtAttackBudget,
  calculateNeeds,
  calculateWants,
  calculateSavings,
} from "@/lib/debt-calculations";
import AddBudgetItemModal from "@/components/budget/AddBudgetItemModal";
import EditBudgetItemModal from "@/components/budget/EditBudgetItemModal";
import { CategoryCard } from "@/components/budget/CategoryCard";
import { format, parseISO, isFuture, startOfMonth, subMonths, isSameMonth } from "date-fns";
import MonthNavigator from "@/components/budget/MonthNavigator";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { getStoredMonth, setStoredMonth, getCurrentMonth } from "@/lib/month-storage";
import { AlertModal } from "@/components/ui/alert-modal";
import { StrictConfirmationModal } from "@/components/ui/strict-confirmation-modal";
import { InsufficientFundsAlert } from "@/components/budget/InsufficientFundsAlert";
import { toast } from "sonner";
import { useBudgetStream } from "@/hooks/useBudgetStream";
import { OfflineIndicator, OfflineIndicatorCompact } from "@/components/ui/offline-indicator";
import { trackFirstBudgetCreated } from "@/lib/analytics";

// Category definitions
const INCOME_CATEGORIES = [
  { id: 'netSalary', label: 'Net Salary', icon: DollarSign, description: 'After-tax monthly salary' },
  { id: 'secondaryIncome', label: 'Secondary Income', icon: DollarSign, description: 'Side hustles, freelance work' },
  { id: 'partnerContribution', label: "Partner's Contribution", icon: DollarSign, description: "Partner's income contribution" },
  { id: 'grants', label: 'Grants & Support', icon: DollarSign, description: 'SASSA, child support, etc.' },
];

// 50/30/20 Rule Categories
// NEEDS (50%) - Essential fixed costs you must pay
const NEEDS_CATEGORIES = [
  { id: 'housing', label: 'Housing', icon: Home, description: 'Rent, bond, levies' },
  { id: 'utilities', label: 'Utilities', icon: Zap, description: 'Electricity, water, WiFi' },
  { id: 'transport', label: 'Transport', icon: Car, description: 'Petrol, taxi, car payment' },
  { id: 'groceries', label: 'Groceries', icon: ShoppingCart, description: 'Food and household items' },
  { id: 'insurance', label: 'Insurance', icon: Shield, description: 'Car, home, funeral cover' },
  { id: 'medicalAid', label: 'Medical Aid', icon: HeartPulse, description: 'Medical scheme contributions' },
  { id: 'health', label: 'Health', icon: Stethoscope, description: 'Medical, pharmacy' },
  { id: 'communication', label: 'Communication', icon: Smartphone, description: 'Phone contract, data' },
  { id: 'childcare', label: 'Childcare', icon: Baby, description: 'Daycare, nanny, au pair' },
  { id: 'education', label: 'Education', icon: GraduationCap, description: 'School fees, uniforms' },
  { id: 'security', label: 'Security', icon: Lock, description: 'ADT, armed response' },
  { id: 'loans', label: 'Loans', icon: Banknote, description: 'Personal loans, hire purchase' },
];

// WANTS (30%) - Lifestyle choices and discretionary spending
const WANTS_CATEGORIES = [
  { id: 'entertainment', label: 'Entertainment', icon: Smile, description: 'Streaming, outings, hobbies' },
  { id: 'personalCare', label: 'Personal Care', icon: Scissors, description: 'Haircuts, toiletries, spa' },
  { id: 'subscriptions', label: 'Subscriptions', icon: Tv, description: 'Streaming, gym, apps' },
  { id: 'familySupport', label: 'Family Support', icon: Heart, description: 'Supporting family members' },
  { id: 'other', label: 'Other', icon: MoreHorizontal, description: 'Miscellaneous expenses' },
];

// SAVINGS (20%) - Building wealth and paying off debt
const SAVINGS_CATEGORIES = [
  { id: 'savings', label: 'Savings', icon: PiggyBank, description: 'Emergency fund, investments' },
  { id: 'debtAccelerator', label: 'Debt Accelerator', icon: Banknote, description: 'Additional payments beyond your minimum loan instalments. Use this to pay off debt faster and save on interest. The more you add here, the quicker you become debt-free!' },
];

// Keep these for backwards compatibility with existing data
const FIXED_OBLIGATION_CATEGORIES = [...NEEDS_CATEGORIES, ...SAVINGS_CATEGORIES];
const VARIABLE_EXPENSE_CATEGORIES = WANTS_CATEGORIES;

export default function BudgetPage() {
  const { user } = useAuth();
  // Initialize from shared storage (persists across Dashboard/Budget navigation)
  const [currentMonth, setCurrentMonthState] = useState<string>(() => {
    // Use stored month on client, fallback to today on server
    if (typeof window !== 'undefined') {
      return getStoredMonth();
    }
    return getCurrentMonth();
  });

  // Offline-first budget stream hook
  const {
    budget: streamBudget,
    budgetLineItems,
    isOnline,
    isSyncing,
    pendingChanges,
    syncError,
    isLoading: streamLoading,
    addBudgetLineItem,
    updateBudgetLineItem,
    deleteBudgetLineItem,
    updateBudget: updateStreamBudget,
    syncNow,
    clearLocalData,
  } = useBudgetStream({
    userId: user?.userId || '',
    month: currentMonth,
  });

  // Derive budget from stream with customItems included
  const budget: Partial<Budget> = streamBudget ? {
    ...streamBudget,
    customItems: budgetLineItems,
  } : {
    customItems: [],
    month: currentMonth,
  };

  const loading = streamLoading && !streamBudget;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [modalItemType, setModalItemType] = useState<'income' | 'obligation'>('income');
  const [saving, setSaving] = useState(false);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(true);

  // Edit item state
  const [editingItem, setEditingItem] = useState<BudgetLineItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Modal states
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "default" | "success" | "error" | "warning";
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "default",
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "default" | "destructive";
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const [showClearBudgetModal, setShowClearBudgetModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Track if there are unsaved changes (pending operations)
  const hasUnsavedChanges = pendingChanges > 0;

  // Determine if current view is read-only (historical month)
  // Allow editing for current month, previous month (1 month ago), and future months
  // Lock editing for 2+ months ago
  const viewingDate = parseISO(`${currentMonth}-01`);
  const today = new Date();
  const thisMonth = startOfMonth(today);
  const previousMonth = subMonths(thisMonth, 1);

  const isCurrentMonth = isSameMonth(viewingDate, thisMonth);
  const isPreviousMonth = isSameMonth(viewingDate, previousMonth);
  const isFutureMonth = isFuture(viewingDate);
  const isReadOnly = !isCurrentMonth && !isPreviousMonth && !isFutureMonth;

  useEffect(() => {
    // Debt API endpoint has been removed - set debts to empty
    setDebts([]);
    setDebtsLoading(false);
  }, [user, currentMonth]);

  // Store navigation guard state globally
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [pendingMonthChange, setPendingMonthChange] = useState<string | null>(null);
  const router = useRouter();

  // Navigation guard - warn when leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isReadOnly) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isReadOnly]);

  // Handle internal navigation with unsaved changes prompt
  useEffect(() => {
    // Store reference to navigation handler on window object
    if (typeof window !== 'undefined') {
      (window as any).__budgetPageNavigationGuard = (targetPath: string) => {
        if (hasUnsavedChanges && !isReadOnly && targetPath !== '/budget') {
          setPendingNavigation(targetPath);
          return false; // Block navigation
        }
        return true; // Allow navigation
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__budgetPageNavigationGuard;
      }
    };
  }, [hasUnsavedChanges, isReadOnly]);

  // Handle navigation confirmation
  const handleSaveAndNavigate = useCallback(async () => {
    if (pendingNavigation) {
      await syncNow();
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, router, syncNow]);

  const handleDiscardAndNavigate = useCallback(async () => {
    if (pendingNavigation) {
      // Clear pending operations without syncing
      await clearLocalData();
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, router, clearLocalData]);


  // Helper functions for modals
  const showAlert = (
    title: string,
    description: string,
    variant: "default" | "success" | "error" | "warning" = "default"
  ) => {
    setAlertModal({ isOpen: true, title, description, variant });
  };

  const showConfirm = (
    title: string,
    description: string,
    onConfirm: () => void,
    confirmText?: string,
    variant?: "default" | "destructive"
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      onConfirm,
      confirmText,
      variant,
    });
  };

  // Wrapper to update both local state and shared storage
  const setCurrentMonth = (newMonth: string) => {
    setCurrentMonthState(newMonth);
    setStoredMonth(newMonth); // Persist to localStorage for cross-page sync
  };

  const handleMonthChange = (newMonth: string) => {
    // Save any unsaved changes before switching months
    if (hasUnsavedChanges && !isReadOnly) {
      setPendingMonthChange(newMonth);
      return;
    }
    setCurrentMonth(newMonth);
  };

  const handleSaveAndSwitchMonth = useCallback(async () => {
    if (pendingMonthChange) {
      await syncNow();
      setCurrentMonth(pendingMonthChange);
      setPendingMonthChange(null);
    }
  }, [pendingMonthChange, syncNow]);

  const handleDiscardAndSwitchMonth = useCallback(async () => {
    if (pendingMonthChange) {
      // Clear pending operations without syncing
      await clearLocalData();
      setCurrentMonth(pendingMonthChange);
      setPendingMonthChange(null);
    }
  }, [pendingMonthChange, clearLocalData]);

  const handleSaveBudget = async () => {
    if (isReadOnly) {
      showAlert("Cannot Save", "Budgets older than one month cannot be saved.", "warning");
      return;
    }

    try {
      setSaving(true);
      // Trigger immediate sync
      await syncNow();
      toast.success("Budget saved successfully!");
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error("Failed to save budget. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromPreviousMonth = async () => {
    if (isReadOnly) {
      showAlert("Cannot Edit", "Budgets older than one month cannot be edited.", "warning");
      return;
    }

    // Check for unsaved changes first
    if (hasUnsavedChanges) {
      showConfirm(
        "Unsaved Changes",
        "You have unsaved changes. Please save your budget before copying from a previous month.",
        async () => {
          await handleSaveBudget();
        },
        "Save Budget"
      );
      return;
    }

    // Calculate previous month
    const prevMonthDate = subMonths(parseISO(`${currentMonth}-01`), 1);
    const previousMonth = format(prevMonthDate, 'yyyy-MM');

    // Confirm with user
    showConfirm(
      "Copy from Previous Month",
      `This will copy all budget items from ${format(prevMonthDate, 'MMMM yyyy')} and replace any existing items in the current month. Do you want to continue?`,
      async () => {
        try {
          setSaving(true);

          // Fetch previous month's budget from API
          const previousBudget = await api.budget.getBudget(previousMonth);

          if (!previousBudget || !previousBudget.customItems || previousBudget.customItems.length === 0) {
            showAlert(
              "No Budget Found",
              `No budget found for ${format(prevMonthDate, 'MMMM yyyy')}. Please create a budget for that month first.`,
              "warning"
            );
            setSaving(false);
            return;
          }

          // Clear existing local data for this month
          await clearLocalData();

          // Update budget fields
          await updateStreamBudget({
            netSalary: previousBudget.netSalary,
            secondaryIncome: previousBudget.secondaryIncome,
            partnerContribution: previousBudget.partnerContribution,
            grants: previousBudget.grants,
            housing: previousBudget.housing,
            transport: previousBudget.transport,
            utilities: previousBudget.utilities,
            insurance: previousBudget.insurance,
            education: previousBudget.education,
            familySupport: previousBudget.familySupport,
            groceries: previousBudget.groceries,
            personalCare: previousBudget.personalCare,
            health: previousBudget.health,
            entertainment: previousBudget.entertainment,
            other: previousBudget.other,
          });

          // Add each line item from previous month
          for (const item of previousBudget.customItems) {
            await addBudgetLineItem({
              type: item.type,
              category: item.category,
              name: item.name,
              amount: item.amount,
            });
          }

          toast.success(
            `Budget copied from ${format(prevMonthDate, 'MMMM yyyy')}!`
          );
        } catch (error) {
          console.error('Error copying from previous month:', error);
          toast.error("Failed to copy budget from previous month. Please try again.");
        } finally {
          setSaving(false);
        }
      },
      "Copy Budget"
    );
  };

  const handleClearBudget = async () => {
    try {
      setIsClearing(true);

      // Delete from backend
      await api.budget.deleteBudget(currentMonth);

      // Clear local IndexedDB data
      await clearLocalData();

      toast.success(`Budget for ${format(parseISO(`${currentMonth}-01`), 'MMMM yyyy')} has been cleared successfully.`);
      setShowClearBudgetModal(false);

      // Trigger a sync to reinitialize empty budget
      await syncNow();
    } catch (error) {
      console.error('Error clearing budget:', error);
      toast.error("Failed to clear budget. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleAddItem = async (item: Omit<BudgetLineItem, 'id'>) => {
    if (isReadOnly) {
      showAlert(
        "Cannot Edit",
        "Budgets older than one month cannot be edited. You can only edit the current month and previous month.",
        "warning"
      );
      return;
    }

    // Track first budget creation (activation milestone)
    const isFirstBudgetItem = budgetLineItems.length === 0;

    await addBudgetLineItem(item);

    if (isFirstBudgetItem) {
      // Calculate totals after adding item
      const newTotalIncome = item.type === 'income' ? item.amount : 0;
      const newTotalExpenses = item.type === 'obligation' ? item.amount : 0;
      trackFirstBudgetCreated(currentMonth, newTotalIncome, newTotalExpenses);
    }

    toast.success("Item added successfully");
  };

  const handleRemoveItem = (itemId: string) => {
    if (isReadOnly) {
      showAlert(
        "Cannot Edit",
        "Budgets older than one month cannot be edited. You can only edit the current month and previous month.",
        "warning"
      );
      return;
    }

    showConfirm(
      "Delete Item",
      "Are you sure you want to delete this budget item?",
      async () => {
        await deleteBudgetLineItem(itemId);
        toast.success("Item deleted successfully");
      },
      "Delete",
      "destructive"
    );
  };

  const handleEditItem = (item: BudgetLineItem) => {
    if (isReadOnly) {
      showAlert(
        "Cannot Edit",
        "Budgets older than one month cannot be edited. You can only edit the current month and previous month.",
        "warning"
      );
      return;
    }

    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleSaveEditedItem = async (updatedItem: BudgetLineItem) => {
    await updateBudgetLineItem(updatedItem);
    toast.success("Item updated successfully");
  };

  const getItemsForCategory = (category: string): BudgetLineItem[] => {
    return budgetLineItems.filter(item => item.category === category);
  };

  const getCategoryTotal = (category: string): number => {
    return getItemsForCategory(category).reduce((sum, item) => sum + item.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalIncome = calculateTotalIncome(budget as Budget);
  const fixedObligations = calculateFixedObligations(budget as Budget);
  const variableExpenses = calculateVariableExpenses(budget as Budget);
  const debtAttackBudget = calculateDebtAttackBudget(budget as Budget);

  // 50/30/20 Rule calculations
  const needsTotal = calculateNeeds(budget as Budget);
  const wantsTotal = calculateWants(budget as Budget);
  const savingsTotal = calculateSavings(budget as Budget);

  // Calculate minimum debt payments
  const minimumDebtPayments = debts.reduce((total, debt) => total + (debt.minimumPayment || 0), 0);
  const hasInsufficientFunds = debtAttackBudget < minimumDebtPayments;
  const shortfall = hasInsufficientFunds ? minimumDebtPayments - debtAttackBudget : 0;

  const openAddItemModal = (categoryId: string, type: 'income' | 'obligation') => {
    setSelectedCategory(categoryId);
    setModalItemType(type);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Month Navigator */}
        <MonthNavigator
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
        />

        {/* Read-Only Banner for Historical Months */}
        {isReadOnly && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <div className="bg-amber-100 rounded-full p-2">
              <Calendar className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">Viewing Historical Data</h3>
              <p className="text-sm text-amber-700">This budget is more than one month old and cannot be edited. You can only edit the current month and previous month.</p>
            </div>
          </div>
        )}

        {/* Future Budget Banner */}
        {isFutureMonth && !isReadOnly && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Calendar className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Future Budget</h3>
              <p className="text-sm text-blue-700">You are planning ahead for a future month. Changes can be made and saved.</p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Budget</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:flex items-center gap-2">
              Build your budget by adding items to each category
              <OfflineIndicatorCompact
                isOnline={isOnline}
                isSyncing={isSyncing}
                pendingChanges={pendingChanges}
              />
            </p>
            {/* Mobile: Show only sync indicator */}
            <div className="mt-0.5 sm:hidden">
              <OfflineIndicatorCompact
                isOnline={isOnline}
                isSyncing={isSyncing}
                pendingChanges={pendingChanges}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:gap-3">
            {!isReadOnly && (
              <>
                <Button
                  onClick={handleCopyFromPreviousMonth}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial"
                  size="sm"
                >
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Copy from Previous Month</span>
                  <span className="sm:hidden">Copy Prev</span>
                </Button>
                <Button
                  onClick={() => setShowClearBudgetModal(true)}
                  disabled={loading || isClearing}
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 flex-1 sm:flex-initial"
                  size="sm"
                >
                  <Trash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="sm:hidden">Clear</span>
                  <span className="hidden sm:inline">Clear Budget</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Important Notice */}
        

        {/* 50/30/20 Rule Guide */}

        {/* Summary Cards - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-5 gap-4">
          {/* Income Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-green-700 font-medium">Income</p>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-900">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-green-600 mt-1">Monthly total</p>
            </CardContent>
          </Card>

          {/* Needs Card */}
          <Card className={`bg-gradient-to-br border ${
            totalIncome > 0 && (needsTotal / totalIncome * 100) > 50
              ? 'from-red-50 to-red-100 border-red-300'
              : 'from-blue-50 to-blue-100 border-blue-200'
          }`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-medium ${
                  totalIncome > 0 && (needsTotal / totalIncome * 100) > 50 ? 'text-red-700' : 'text-blue-700'
                }`}>Needs</p>
                <Shield className={`h-4 w-4 ${
                  totalIncome > 0 && (needsTotal / totalIncome * 100) > 50 ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <p className={`text-xl font-bold ${
                totalIncome > 0 && (needsTotal / totalIncome * 100) > 50 ? 'text-red-900' : 'text-blue-900'
              }`}>{formatCurrency(needsTotal)}</p>
              <p className={`text-xs mt-1 ${
                totalIncome > 0 && (needsTotal / totalIncome * 100) > 50 ? 'text-red-600' : 'text-blue-600'
              }`}>{totalIncome > 0 ? Math.round((needsTotal / totalIncome) * 100) : 0}% of income</p>
            </CardContent>
          </Card>

          {/* Wants Card */}
          <Card className={`bg-gradient-to-br border ${
            totalIncome > 0 && (wantsTotal / totalIncome * 100) > 30
              ? 'from-red-50 to-red-100 border-red-300'
              : 'from-purple-50 to-purple-100 border-purple-200'
          }`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-medium ${
                  totalIncome > 0 && (wantsTotal / totalIncome * 100) > 30 ? 'text-red-700' : 'text-purple-700'
                }`}>Wants</p>
                <Smile className={`h-4 w-4 ${
                  totalIncome > 0 && (wantsTotal / totalIncome * 100) > 30 ? 'text-red-600' : 'text-purple-600'
                }`} />
              </div>
              <p className={`text-xl font-bold ${
                totalIncome > 0 && (wantsTotal / totalIncome * 100) > 30 ? 'text-red-900' : 'text-purple-900'
              }`}>{formatCurrency(wantsTotal)}</p>
              <p className={`text-xs mt-1 ${
                totalIncome > 0 && (wantsTotal / totalIncome * 100) > 30 ? 'text-red-600' : 'text-purple-600'
              }`}>{totalIncome > 0 ? Math.round((wantsTotal / totalIncome) * 100) : 0}% of income</p>
            </CardContent>
          </Card>

          {/* Savings Card */}
          <Card className={`bg-gradient-to-br border ${
            totalIncome > 0 && (savingsTotal / totalIncome * 100) >= 20
              ? 'from-emerald-50 to-emerald-100 border-emerald-300'
              : 'from-amber-50 to-amber-100 border-amber-300'
          }`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-medium ${
                  totalIncome > 0 && (savingsTotal / totalIncome * 100) >= 20 ? 'text-emerald-700' : 'text-amber-700'
                }`}>Savings</p>
                <PiggyBank className={`h-4 w-4 ${
                  totalIncome > 0 && (savingsTotal / totalIncome * 100) >= 20 ? 'text-emerald-600' : 'text-amber-600'
                }`} />
              </div>
              <p className={`text-xl font-bold ${
                totalIncome > 0 && (savingsTotal / totalIncome * 100) >= 20 ? 'text-emerald-900' : 'text-amber-900'
              }`}>{formatCurrency(savingsTotal)}</p>
              <p className={`text-xs mt-1 ${
                totalIncome > 0 && (savingsTotal / totalIncome * 100) >= 20 ? 'text-emerald-600' : 'text-amber-600'
              }`}>{totalIncome > 0 ? Math.round((savingsTotal / totalIncome) * 100) : 0}% of income</p>
            </CardContent>
          </Card>

          {/* Available Card */}
          <Card className={`bg-gradient-to-br border-2 ${
            debtAttackBudget >= 0
              ? 'from-emerald-50 to-emerald-100 border-emerald-300'
              : 'from-red-50 to-red-100 border-red-300'
          }`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-semibold ${debtAttackBudget >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Available</p>
                <Banknote className={`h-4 w-4 ${debtAttackBudget >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
              <p className={`text-xl font-bold ${debtAttackBudget >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                {formatCurrency(debtAttackBudget)}
              </p>
              <p className={`text-xs mt-1 ${debtAttackBudget >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalIncome > 0 ? ((debtAttackBudget / totalIncome) * 100).toFixed(1) : 0}% left
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Insufficient Funds Alert */}
        {!debtsLoading && hasInsufficientFunds && debts.length > 0 && (
          <InsufficientFundsAlert
            availableForDebts={debtAttackBudget}
            minimumDebtPayments={minimumDebtPayments}
            shortfall={shortfall}
            onAdjustBudget={() => {
              // Scroll to budget sections
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Income Section */}
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <DollarSign className="h-6 w-6" />
              Income Sources
            </CardTitle>
            <CardDescription>Add all your monthly income sources</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {INCOME_CATEGORIES.map((category) => (
                <CategoryCard
                  key={category.id}
                  categoryId={category.id}
                  label={category.label}
                  icon={category.icon}
                  items={getItemsForCategory(category.id)}
                  total={getCategoryTotal(category.id)}
                  color="green"
                  onAddItem={() => openAddItemModal(category.id, 'income')}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleRemoveItem}
                  isReadOnly={isReadOnly}
                  formatCurrency={formatCurrency}
                  description={category.description}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Section (50%) */}
        <Card>
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Shield className="h-6 w-6" />
                Needs (50%)
              </CardTitle>
              <div className="text-right">
                <span className={`text-sm font-semibold ${
                  totalIncome > 0 && (needsTotal / totalIncome * 100) > 50
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}>
                  {totalIncome > 0
                    ? `${Math.round(needsTotal / totalIncome * 100)}%`
                    : '0%'
                  }
                </span>
                <span className="text-xs text-gray-500 ml-1">of income</span>
              </div>
            </div>
            <CardDescription>Essential expenses: housing, utilities, food, transport, healthcare</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {NEEDS_CATEGORIES.map((category) => (
                <CategoryCard
                  key={category.id}
                  categoryId={category.id}
                  label={category.label}
                  icon={category.icon}
                  items={getItemsForCategory(category.id)}
                  total={getCategoryTotal(category.id)}
                  color="blue"
                  onAddItem={() => openAddItemModal(category.id, 'obligation')}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleRemoveItem}
                  isReadOnly={isReadOnly}
                  formatCurrency={formatCurrency}
                  description={category.description}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wants Section (30%) */}
        <Card>
          <CardHeader className="bg-purple-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Smile className="h-6 w-6" />
                Wants (30%)
              </CardTitle>
              <div className="text-right">
                <span className={`text-sm font-semibold ${
                  totalIncome > 0 && (wantsTotal / totalIncome * 100) > 30
                    ? 'text-red-600'
                    : 'text-purple-600'
                }`}>
                  {totalIncome > 0
                    ? `${Math.round(wantsTotal / totalIncome * 100)}%`
                    : '0%'
                  }
                </span>
                <span className="text-xs text-gray-500 ml-1">of income</span>
              </div>
            </div>
            <CardDescription>Lifestyle choices: entertainment, subscriptions, personal care</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {WANTS_CATEGORIES.map((category) => (
                <CategoryCard
                  key={category.id}
                  categoryId={category.id}
                  label={category.label}
                  icon={category.icon}
                  items={getItemsForCategory(category.id)}
                  total={getCategoryTotal(category.id)}
                  color="purple"
                  onAddItem={() => openAddItemModal(category.id, 'obligation')}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleRemoveItem}
                  isReadOnly={isReadOnly}
                  formatCurrency={formatCurrency}
                  description={category.description}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Savings Section (20%) */}
        <Card>
          <CardHeader className="bg-emerald-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <PiggyBank className="h-6 w-6" />
                Savings (20%)
              </CardTitle>
              <div className="text-right">
                <span className={`text-sm font-semibold ${
                  totalIncome > 0 && (savingsTotal / totalIncome * 100) < 20
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                  {totalIncome > 0
                    ? `${Math.round(savingsTotal / totalIncome * 100)}%`
                    : '0%'
                  }
                </span>
                <span className="text-xs text-gray-500 ml-1">of income</span>
              </div>
            </div>
            <CardDescription>Building wealth: emergency fund, retirement, extra debt payments</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {SAVINGS_CATEGORIES.map((category) => (
                <CategoryCard
                  key={category.id}
                  categoryId={category.id}
                  label={category.label}
                  icon={category.icon}
                  items={getItemsForCategory(category.id)}
                  total={getCategoryTotal(category.id)}
                  color="green"
                  onAddItem={() => openAddItemModal(category.id, 'obligation')}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleRemoveItem}
                  isReadOnly={isReadOnly}
                  formatCurrency={formatCurrency}
                  description={category.description}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Budget Item Modal */}
        <AddBudgetItemModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCategory('');
          }}
          onSave={handleAddItem}
          itemType={modalItemType}
          preSelectedCategory={selectedCategory}
        />

        {/* Edit Budget Item Modal */}
        <EditBudgetItemModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          onSave={handleSaveEditedItem}
          item={editingItem}
        />

        {/* Alert Modal */}
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
          title={alertModal.title}
          description={alertModal.description}
          variant={alertModal.variant}
        />

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
        />

        {/* Navigation Prompt Modal */}
        {pendingNavigation && (
          <ConfirmationModal
            isOpen={true}
            onClose={() => setPendingNavigation(null)}
            onConfirm={handleSaveAndNavigate}
            title="Unsaved Changes"
            description="You have unsaved changes to your budget. How would you like to proceed?"
            confirmText="Save and Continue"
            variant="default"
          >
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleSaveAndNavigate}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Save and Continue
              </Button>
              <Button
                onClick={handleDiscardAndNavigate}
                variant="outline"
                className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                size="lg"
              >
                Skip Saving & Continue Anyway
              </Button>
            </div>
          </ConfirmationModal>
        )}

        {/* Month Change Prompt Modal */}
        {pendingMonthChange && (
          <ConfirmationModal
            isOpen={true}
            onClose={() => setPendingMonthChange(null)}
            onConfirm={handleSaveAndSwitchMonth}
            title="Unsaved Changes"
            description="You have unsaved changes to your budget. How would you like to proceed?"
            confirmText="Save and Switch"
            variant="default"
          >
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleSaveAndSwitchMonth}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Save and Switch
              </Button>
              <Button
                onClick={handleDiscardAndSwitchMonth}
                variant="outline"
                className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                size="lg"
              >
                Don't Save & Switch Anyway
              </Button>
            </div>
          </ConfirmationModal>
        )}

        {/* Clear Budget Modal */}
        <StrictConfirmationModal
          isOpen={showClearBudgetModal}
          onClose={() => setShowClearBudgetModal(false)}
          onConfirm={handleClearBudget}
          title="Clear Budget"
          description={`You are about to permanently delete all budget data for ${format(parseISO(`${currentMonth}-01`), 'MMMM yyyy')}. This will remove all income sources, expenses, and custom budget items.`}
          confirmationPhrase="CLEAR BUDGET"
          confirmText={isClearing ? "Clearing..." : "Clear Budget"}
          cancelText="Cancel"
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
    </div>
  );
}
