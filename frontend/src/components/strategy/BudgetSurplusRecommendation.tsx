"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Info,
  Edit,
  TrendingUp,
  Wallet,
  Loader2,
} from "lucide-react";
import { AttackOrderItem } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client-debts";
import { toast } from "sonner";

interface BudgetSurplusRecommendationProps {
  totalIncome: number;
  totalExpenses: number;
  totalMinimumPayments: number;
  attackOrder: AttackOrderItem[];
  onApplyRecommendation?: (extraAmount: number, paymentId?: string) => void;
  appliedAmount?: number;
  appliedPaymentId?: string;
}

export function BudgetSurplusRecommendation({
  totalIncome,
  totalExpenses,
  totalMinimumPayments,
  attackOrder,
  onApplyRecommendation,
  appliedAmount = 0,
  appliedPaymentId,
}: BudgetSurplusRecommendationProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate available funds
  const availableAfterExpenses = totalIncome - totalExpenses;
  const surplusAfterMinimums = availableAfterExpenses - totalMinimumPayments;

  // Determine the status
  const hasDeficit = availableAfterExpenses < totalMinimumPayments;
  const hasSurplus = surplusAfterMinimums > 0;

  // Get the top priority debt (first in attack order)
  const topPriorityDebt = attackOrder.length > 0 ? attackOrder[0] : null;

  // State for editing mode and custom amount
  const [isEditing, setIsEditing] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [remainingAmount, setRemainingAmount] = useState<number>(surplusAfterMinimums);
  const [isApplying, setIsApplying] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Suggested amount (80% of surplus) - commonly used approach
  const suggestedExtra = Math.floor(surplusAfterMinimums * 0.8);

  // Update remaining amount when custom amount changes
  useEffect(() => {
    const amount = parseFloat(customAmount) || 0;
    setRemainingAmount(surplusAfterMinimums - amount);
  }, [customAmount, surplusAfterMinimums]);

  // Reset custom amount when toggling edit mode
  useEffect(() => {
    if (isEditing) {
      setCustomAmount(appliedAmount > 0 ? appliedAmount.toString() : suggestedExtra.toString());
    }
  }, [isEditing, appliedAmount, suggestedExtra]);

  const handleApply = async () => {
    const amount = parseFloat(customAmount) || 0;
    if (amount > 0 && amount <= surplusAfterMinimums && topPriorityDebt && onApplyRecommendation) {
      setIsApplying(true);
      try {
        // Create payment record in database
        const payment = await api.payments.logPayment(
          topPriorityDebt.debt.debtId,
          amount,
          new Date().toISOString().split('T')[0]!, // Today's date in YYYY-MM-DD
          {
            paymentType: 'extra',
            paymentSource: 'strategy_allocation',
            notes: `Extra payment allocated via strategy page - ${topPriorityDebt.debt.debtName}`,
          }
        );

        // Notify parent component with amount and payment ID
        onApplyRecommendation(amount, payment.paymentId);
        setIsEditing(false);

        toast.success('Extra payment recorded successfully', {
          description: `${formatCurrency(amount)} applied to ${topPriorityDebt.debt.debtName}`,
        });

        // Scroll to projections
        setTimeout(() => {
          const projectionsSection = document.querySelector('[data-payment-projections]');
          if (projectionsSection) {
            projectionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } catch (error) {
        console.error('Failed to record payment:', error);
        toast.error('Failed to record payment', {
          description: error instanceof Error ? error.message : 'Please try again',
        });
      } finally {
        setIsApplying(false);
      }
    }
  };

  const handleQuickSet = (percentage: number) => {
    const amount = Math.floor(surplusAfterMinimums * percentage);
    setCustomAmount(amount.toString());
  };

  const handleClear = async () => {
    if (!appliedPaymentId || !topPriorityDebt || !onApplyRecommendation) return;

    setIsClearing(true);
    try {
      // Delete payment record from database
      await api.payments.deletePayment(
        appliedPaymentId,
        topPriorityDebt.debt.debtId,
        new Date().toISOString().split('T')[0]! // Today's date in YYYY-MM-DD
      );

      // Notify parent component to clear amount
      onApplyRecommendation(0, undefined);

      toast.success('Payment removed successfully', {
        description: 'The extra payment allocation has been cleared',
      });
    } catch (error) {
      console.error('Failed to delete payment:', error);
      toast.error('Failed to remove payment', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Budget Deficit - Red Alert
  if (hasDeficit) {
    return (
      <Card className="border-red-300 bg-red-50 max-w-5xl mx-auto">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Budget Deficit</p>
                <p className="text-sm text-red-700">
                  Shortfall: {formatCurrency(Math.abs(surplusAfterMinimums))}
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-5 w-5 text-red-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm mb-2">
                    <strong>Available:</strong> {formatCurrency(availableAfterExpenses)}
                  </p>
                  <p className="text-sm mb-2">
                    <strong>Required:</strong> {formatCurrency(totalMinimumPayments)}
                  </p>
                  <p className="text-sm">
                    You need to reduce expenses or increase income to meet minimum debt obligations.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No Surplus - Balanced Budget
  if (!hasSurplus) {
    return (
      <Card className="border-amber-300 bg-amber-50 max-w-5xl mx-auto">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Budget Balanced</p>
                <p className="text-sm text-amber-700">
                  Covers all minimum payments
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-5 w-5 text-amber-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    You're allocating {formatCurrency(availableAfterExpenses)} to debt payments,
                    which covers all {formatCurrency(totalMinimumPayments)} in minimums.
                    Consider increasing income or reducing expenses to accelerate payoff.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has Surplus - Show editable allocation
  return (
    <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 max-w-5xl mx-auto">
      <CardContent className="py-4 md:py-5">
        <div className="space-y-4 md:space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="bg-green-600 text-white p-2 md:p-2.5 rounded-full flex-shrink-0 mt-0.5">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="font-bold text-green-900 text-base md:text-lg">Extra Funds Available</h3>
                  <Badge className="bg-green-600 text-sm w-fit">{formatCurrency(surplusAfterMinimums)}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isEditing && appliedAmount === 0 && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs font-normal whitespace-nowrap">
                  Suggested: {formatCurrency(suggestedExtra)}
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-5 w-5 text-green-600 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                <TooltipContent className="max-w-sm p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-2">Budget Breakdown:</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span>Income:</span>
                          <span className="font-semibold">{formatCurrency(totalIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expenses:</span>
                          <span>{formatCurrency(totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Min Payments:</span>
                          <span>{formatCurrency(totalMinimumPayments)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5">
                          <span className="font-semibold">Surplus:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(surplusAfterMinimums)}</span>
                        </div>
                      </div>
                    </div>
                    {topPriorityDebt && (
                      <div className="border-t pt-2">
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">Priority debt:</span> {topPriorityDebt.debt.debtName}
                        </p>
                      </div>
                    )}
                  </div>
                </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Editing Mode */}
          {isEditing ? (
            <div className="bg-white rounded-lg p-4 md:p-5 space-y-4">
              {/* Amount Input Section */}
              <div className="space-y-3">
                <label className="text-sm md:text-base font-semibold text-gray-900 block">
                  How much do you want to allocate?
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">R</span>
                  <Input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0"
                    className="pl-9 pr-4 text-xl md:text-2xl font-bold h-14 md:h-16"
                    min="0"
                    max={surplusAfterMinimums}
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining after allocation:</span>
                    <span className={`text-lg md:text-xl font-bold ${remainingAmount >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Selection Buttons */}
              <div>
                <p className="text-xs text-gray-600 mb-2">Quick select:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleQuickSet(0.5)}
                    className="text-sm md:text-base font-semibold h-11"
                  >
                    50%
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleQuickSet(0.8)}
                    className="text-sm md:text-base font-semibold bg-green-50 border-green-300 hover:bg-green-100 h-11"
                  >
                    80%
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleQuickSet(1.0)}
                    className="text-sm md:text-base font-semibold h-11"
                  >
                    100%
                  </Button>
                </div>
              </div>

              {/* Warning if exceeding */}
              {parseFloat(customAmount) > surplusAfterMinimums && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">Amount exceeds available funds</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setIsEditing(false);
                    setCustomAmount("");
                  }}
                  disabled={isApplying}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleApply}
                  disabled={!customAmount || parseFloat(customAmount) <= 0 || parseFloat(customAmount) > surplusAfterMinimums || isApplying}
                  className="flex-1 bg-green-600 hover:bg-green-700 h-11"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <span>Apply to Priority Debt</span>
                  )}
                </Button>
              </div>
            </div>
          ) : appliedAmount > 0 ? (
            // Applied State
            <div className="bg-green-600 text-white px-4 py-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-lg md:text-xl">{formatCurrency(appliedAmount)} allocated</p>
                    <p className="text-sm opacity-90 mt-0.5">
                      {formatCurrency(surplusAfterMinimums - appliedAmount)} remaining
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="default"
                    className="flex-1 sm:flex-none text-white hover:text-white hover:bg-green-700 h-10"
                    onClick={() => setIsEditing(true)}
                    disabled={isClearing}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="default"
                    className="flex-1 sm:flex-none text-white hover:text-white hover:bg-green-700 h-10"
                    onClick={handleClear}
                    disabled={isClearing}
                  >
                    {isClearing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Clearing...</span>
                      </>
                    ) : (
                      <span>Clear</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Default State - Not Applied Yet
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                onClick={() => setIsEditing(true)}
              >
                <Wallet className="h-5 w-5 mr-2" />
                <span className="font-semibold">Choose Custom Amount</span>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 border-green-300 text-green-700 hover:bg-green-50 font-semibold h-12"
                      disabled={isApplying}
                      onClick={async () => {
                        if (!topPriorityDebt || !onApplyRecommendation) return;

                        setIsApplying(true);
                        try {
                          // Create payment record in database
                          const payment = await api.payments.logPayment(
                            topPriorityDebt.debt.debtId,
                            suggestedExtra,
                            new Date().toISOString().split('T')[0]!,
                            {
                              paymentType: 'extra',
                              paymentSource: 'strategy_allocation',
                              notes: `Extra payment allocated via strategy page (80% suggested) - ${topPriorityDebt.debt.debtName}`,
                            }
                          );

                          onApplyRecommendation(suggestedExtra, payment.paymentId);

                          toast.success('Extra payment recorded successfully', {
                            description: `${formatCurrency(suggestedExtra)} applied to ${topPriorityDebt.debt.debtName}`,
                          });

                          setTimeout(() => {
                            const projectionsSection = document.querySelector('[data-payment-projections]');
                            if (projectionsSection) {
                              projectionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        } catch (error) {
                          console.error('Failed to record payment:', error);
                          toast.error('Failed to record payment', {
                            description: error instanceof Error ? error.message : 'Please try again',
                          });
                        } finally {
                          setIsApplying(false);
                        }
                      }}
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          <span>Applying...</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-5 w-5 mr-2" />
                          <span>Use Suggested 80%</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Apply {formatCurrency(suggestedExtra)} to priority debt</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
