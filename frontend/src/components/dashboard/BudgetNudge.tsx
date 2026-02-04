"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  PiggyBank,
  Banknote,
  ExternalLink,
} from "lucide-react";

interface BudgetNudgeProps {
  totalIncome: number;
  totalFixedObligations: number; // "Needs" (legacy, but we also accept needsTotal)
  totalVariableExpenses: number; // "Wants"
  availableBalance: number; // Unallocated funds
  loansTotal?: number; // Total loan payments
  savingsTotal?: number; // Actual savings category items
  needsTotal?: number; // Actual needs category items (if provided, used instead of totalFixedObligations)
}

interface NudgeMessage {
  icon: React.ReactNode;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'tip' | 'alert' | 'loan-warning';
  actionButton?: {
    label: string;
    href: string;
  };
}

export function BudgetNudge({
  totalIncome,
  totalFixedObligations,
  totalVariableExpenses,
  availableBalance,
  loansTotal = 0,
  savingsTotal = 0,
  needsTotal,
}: BudgetNudgeProps) {
  if (totalIncome === 0) return null;

  // Use needsTotal if provided (more accurate), otherwise fallback to totalFixedObligations
  const actualNeeds = needsTotal ?? totalFixedObligations;

  // Combined savings = allocated savings + available (unallocated) funds
  // This represents total money going towards savings/wealth building
  const combinedSavings = savingsTotal + Math.max(0, availableBalance);

  // Calculate percentages
  const needsPercent = Math.round((actualNeeds / totalIncome) * 100);
  const wantsPercent = Math.round((totalVariableExpenses / totalIncome) * 100);
  const savingsPercent = Math.round((combinedSavings / totalIncome) * 100);
  const allocatedSavingsPercent = Math.round((savingsTotal / totalIncome) * 100);
  const availablePercent = Math.round((Math.max(0, availableBalance) / totalIncome) * 100);
  const loansPercent = Math.round((loansTotal / totalIncome) * 100);

  // 50/30/20 Rule targets
  const NEEDS_TARGET = 50;
  const WANTS_TARGET = 30;
  const SAVINGS_TARGET = 20;

  // Loan thresholds for warnings
  const LOANS_MODERATE = 10;
  const LOANS_HIGH = 15;
  const LOANS_CRITICAL = 25;

  // Generate nudge messages based on analysis
  const getNudges = (): NudgeMessage[] => {
    const nudges: NudgeMessage[] = [];

    // Overall budget health
    if (availableBalance < 0) {
      nudges.push({
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        title: "Budget Deficit",
        message: `You're spending R${Math.abs(availableBalance).toLocaleString()} more than you earn. Review your expenses to find areas to cut back.`,
        type: 'alert'
      });
    } else if (savingsPercent >= SAVINGS_TARGET) {
      const savingsBreakdown = savingsTotal > 0 && availableBalance > 0
        ? ` (${allocatedSavingsPercent}% allocated to savings + ${availablePercent}% available)`
        : '';
      nudges.push({
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        title: "Great Savings Rate!",
        message: `You're putting ${savingsPercent}% of your income towards savings${savingsBreakdown}. That's ${savingsPercent >= 25 ? 'excellent' : 'on target'} for building wealth!`,
        type: 'success'
      });
    }

    // Needs analysis (Fixed obligations)
    if (needsPercent > NEEDS_TARGET + 10) {
      nudges.push({
        icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
        title: "High Fixed Costs",
        message: `Your essentials take ${needsPercent}% of income (target: 50%). Consider if any fixed costs can be reduced, like insurance or subscriptions.`,
        type: 'warning'
      });
    } else if (needsPercent <= NEEDS_TARGET) {
      nudges.push({
        icon: <Target className="h-5 w-5 text-blue-500" />,
        title: "Needs Under Control",
        message: `Your fixed costs are ${needsPercent}% of income - well within the 50% guideline. Nice work managing essentials!`,
        type: 'tip'
      });
    }

    // Wants analysis (Variable expenses)
    if (wantsPercent > WANTS_TARGET + 10) {
      nudges.push({
        icon: <TrendingDown className="h-5 w-5 text-purple-500" />,
        title: "High Lifestyle Spending",
        message: `Variable expenses are ${wantsPercent}% of income (target: 30%). Small cuts here can boost your savings significantly.`,
        type: 'warning'
      });
    }

    // Savings specific nudge
    if (savingsPercent > 0 && savingsPercent < SAVINGS_TARGET) {
      const shortfall = SAVINGS_TARGET - savingsPercent;
      const monthlyGap = Math.round((shortfall / 100) * totalIncome);
      const currentBreakdown = savingsTotal > 0 && availableBalance > 0
        ? ` (currently: ${allocatedSavingsPercent}% in savings + ${availablePercent}% available)`
        : savingsTotal > 0
        ? ` (currently: ${allocatedSavingsPercent}% allocated to savings)`
        : ` (currently: ${availablePercent}% available)`;
      nudges.push({
        icon: <PiggyBank className="h-5 w-5 text-emerald-500" />,
        title: "Boost Your Savings",
        message: `You're ${shortfall}% away from the 20% savings target${currentBreakdown}. Finding R${monthlyGap.toLocaleString()}/month extra would get you there!`,
        type: 'tip'
      });
    }

    // Loan-specific warnings with upsell to debtpayoff.co.za
    if (loansTotal > 0 && loansPercent >= LOANS_CRITICAL) {
      nudges.unshift({
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
        title: "Loan Payments Need Urgent Attention",
        message: `Your loan payments are ${loansPercent}% of your income (R${loansTotal.toLocaleString()}/month). This is above the safe threshold and may be putting you at financial risk. A structured debt payoff plan can help you take control.`,
        type: 'loan-warning',
        actionButton: {
          label: "Get Debt Help",
          href: "https://debtpayoff.co.za?ref=quickbudget"
        }
      });
    } else if (loansTotal > 0 && loansPercent >= LOANS_HIGH) {
      nudges.unshift({
        icon: <Banknote className="h-5 w-5 text-orange-600" />,
        title: "High Loan Payments Detected",
        message: `Your loans take up ${loansPercent}% of your income (R${loansTotal.toLocaleString()}/month). Consider a debt payoff strategy to reduce this faster and save on interest.`,
        type: 'warning',
        actionButton: {
          label: "Explore Payoff Strategies",
          href: "https://debtpayoff.co.za?ref=quickbudget"
        }
      });
    } else if (loansTotal > 0 && loansPercent >= LOANS_MODERATE) {
      nudges.push({
        icon: <Banknote className="h-5 w-5 text-blue-500" />,
        title: "Track Your Loan Progress",
        message: `Loan payments are ${loansPercent}% of your income. You're managing them, but tracking your payoff could help you become debt-free sooner.`,
        type: 'tip',
        actionButton: {
          label: "Learn More",
          href: "https://debtpayoff.co.za?ref=quickbudget"
        }
      });
    }

    // If everything is good
    if (nudges.length === 0 || (nudges.length === 1 && nudges[0]?.type === 'success')) {
      if (needsPercent <= NEEDS_TARGET && wantsPercent <= WANTS_TARGET && savingsPercent >= SAVINGS_TARGET) {
        if (nudges.length === 0) {
          nudges.push({
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            title: "Perfect Balance!",
            message: `Your budget follows the 50/30/20 rule beautifully. Keep up the excellent financial discipline!`,
            type: 'success'
          });
        }
      }
    }

    // Show up to 3 nudges if there's a loan warning, otherwise 2
    const hasLoanWarning = nudges.some(n => n.type === 'loan-warning' || (n.actionButton && n.actionButton.href.includes('debtpayoff')));
    return nudges.slice(0, hasLoanWarning ? 3 : 2);
  };

  const nudges = getNudges();

  if (nudges.length === 0) return null;

  const getCardStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-green-500 bg-green-50';
      case 'warning':
        return 'border-l-4 border-l-orange-500 bg-orange-50';
      case 'alert':
        return 'border-l-4 border-l-red-500 bg-red-50';
      case 'loan-warning':
        return 'border-l-4 border-l-red-600 bg-gradient-to-r from-red-50 to-orange-50';
      case 'tip':
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">Budget Insights</h3>
          <span className="text-xs text-gray-500 ml-auto">50/30/20 Rule</span>
        </div>

        {/* 50/30/20 Progress Bar */}
        <div className="mb-4">
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
            <div
              className="bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(needsPercent, 100)}%` }}
              title={`Needs: ${needsPercent}%`}
            />
            <div
              className="bg-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(wantsPercent, 100 - needsPercent)}%` }}
              title={`Wants: ${wantsPercent}%`}
            />
            {/* Allocated savings portion */}
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(allocatedSavingsPercent, Math.max(0, 100 - needsPercent - wantsPercent))}%` }}
              title={`Allocated Savings: ${allocatedSavingsPercent}%`}
            />
            {/* Available/unallocated portion */}
            <div
              className={`transition-all duration-500 ${availableBalance >= 0 ? 'bg-green-400' : 'bg-red-500'}`}
              style={{ width: `${Math.max(availablePercent, 0)}%` }}
              title={`Available: ${availablePercent}%`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Needs {needsPercent}%</span>
            <span>Wants {wantsPercent}%</span>
            <span>Savings + Available {savingsPercent}%</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>(Target: 50%)</span>
            <span>(Target: 30%)</span>
            <span>(Target: 20%)</span>
          </div>
          {/* Savings breakdown detail */}
          {(savingsTotal > 0 || availableBalance > 0) && (
            <div className="text-xs text-gray-400 text-right mt-0.5">
              {savingsTotal > 0 && <span className="text-emerald-600">Savings: {allocatedSavingsPercent}%</span>}
              {savingsTotal > 0 && availableBalance > 0 && <span className="mx-1">+</span>}
              {availableBalance > 0 && <span className="text-green-600">Available: {availablePercent}%</span>}
            </div>
          )}
        </div>

        {/* Nudge Messages */}
        <div className="space-y-3">
          {nudges.map((nudge, index) => (
            <div key={index} className={`p-3 rounded-lg ${getCardStyle(nudge.type)}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {nudge.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${nudge.type === 'loan-warning' ? 'text-red-900' : 'text-gray-900'}`}>
                    {nudge.title}
                  </p>
                  <p className={`text-sm mt-0.5 ${nudge.type === 'loan-warning' ? 'text-red-800' : 'text-gray-600'}`}>
                    {nudge.message}
                  </p>
                  {nudge.actionButton && (
                    <Button
                      variant={nudge.type === 'loan-warning' ? 'default' : 'outline'}
                      size="sm"
                      className={`mt-3 ${
                        nudge.type === 'loan-warning'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : nudge.type === 'warning'
                          ? 'border-orange-400 text-orange-700 hover:bg-orange-100'
                          : 'border-blue-400 text-blue-700 hover:bg-blue-100'
                      }`}
                      asChild
                    >
                      <a href={nudge.actionButton.href} target="_blank" rel="noopener noreferrer">
                        {nudge.actionButton.label}
                        <ExternalLink className="h-3 w-3 ml-1.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
