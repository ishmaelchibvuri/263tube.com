"use client";

import { useState, useEffect } from "react";
import { Debt, PaymentRecord } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Calendar, DollarSign, TrendingDown, Check, Loader2, Info } from "lucide-react";
import { format, addMonths, parseISO } from "date-fns";
import { api } from "@/lib/api-client-debts";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaymentProjection {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  fees: number;
  balance: number;
  accumulatedInterest: number;
  isActual?: boolean; // Flag to distinguish actual payments from projections
  paymentDate?: string; // Actual date for historical payments
}

interface PaymentProjectionTableProps {
  debt: Debt;
  monthlyPayment: number;
  attackOrder: number;
  extraPayment?: number;
  isPriority?: boolean;
}

/**
 * Calculate payment projection schedule for a single debt
 */
function calculatePaymentSchedule(
  debt: Debt,
  monthlyPayment: number,
  extraPayment: number = 0
): PaymentProjection[] {
  const schedule: PaymentProjection[] = [];
  let remainingBalance = debt.currentBalance;
  let accumulatedInterest = debt.accumulatedInterestAndFees;
  const monthlyRate = debt.annualInterestRate / 100 / 12;
  const totalPayment = monthlyPayment + extraPayment;

  const inDuplumCap = debt.originalPrincipal;
  let month = 0;
  const maxMonths = 600; // 50 years max to prevent infinite loops

  while (remainingBalance > 0.01 && month < maxMonths) {
    month++;

    // Calculate interest for this month
    const interestCharge = remainingBalance * monthlyRate;

    // Check In Duplum cap
    const wouldExceedCap = (accumulatedInterest + interestCharge) > inDuplumCap;
    const actualInterest = wouldExceedCap
      ? Math.max(0, inDuplumCap - accumulatedInterest)
      : interestCharge;

    // Calculate fees
    const fees = debt.monthlyServiceFee + debt.creditLifePremium;

    // Total amount to be paid
    const payment = Math.min(totalPayment, remainingBalance + actualInterest + fees);

    // NCA Section 126 allocation order: Fees → Interest → Principal
    let remainingPayment = payment;

    // 1. Pay fees first
    const feesPaid = Math.min(fees, remainingPayment);
    remainingPayment -= feesPaid;

    // 2. Pay interest
    const interestPaid = Math.min(actualInterest, remainingPayment);
    remainingPayment -= interestPaid;

    // 3. Pay principal
    const principalPaid = Math.min(remainingBalance, remainingPayment);

    // Update balances
    remainingBalance -= principalPaid;
    accumulatedInterest += actualInterest;

    const projectionDate = format(addMonths(new Date(), month), "MMM yyyy");

    schedule.push({
      month,
      date: projectionDate,
      payment,
      principal: principalPaid,
      interest: interestPaid,
      fees: feesPaid,
      balance: remainingBalance,
      accumulatedInterest,
    });

    // If balance is essentially zero, stop
    if (remainingBalance < 0.01) {
      break;
    }
  }

  return schedule;
}

export function PaymentProjectionTable({
  debt,
  monthlyPayment,
  attackOrder,
  extraPayment = 0,
  isPriority = false,
}: PaymentProjectionTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);
  const [actualPayments, setActualPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Load actual payment history
  useEffect(() => {
    const loadPaymentHistory = async () => {
      setLoadingPayments(true);
      try {
        const payments = await api.payments.getPaymentHistory(debt.debtId);
        // Sort by date ascending (oldest first)
        const sorted = payments.sort((a, b) =>
          a.paymentDate.localeCompare(b.paymentDate)
        );
        setActualPayments(sorted);
      } catch (error) {
        console.error("Failed to load payment history:", error);
        // Don't show error toast, just continue with projections only
      } finally {
        setLoadingPayments(false);
      }
    };

    loadPaymentHistory();
  }, [debt.debtId]);

  // Convert actual payments to projection format
  const actualPaymentProjections: PaymentProjection[] = actualPayments.map((payment, index) => ({
    month: index + 1,
    date: format(parseISO(payment.paymentDate), "MMM yyyy"),
    paymentDate: payment.paymentDate,
    payment: payment.amount,
    principal: payment.amountToPrincipal,
    interest: payment.amountToInterest,
    fees: payment.amountToFees,
    balance: payment.balanceAfterPayment,
    accumulatedInterest: 0, // We don't track this historically
    isActual: true,
  }));

  // Calculate future projections starting from current balance
  const futureSchedule = calculatePaymentSchedule(debt, monthlyPayment, extraPayment);

  // Combine actual payments with future projections
  const combinedSchedule = [...actualPaymentProjections, ...futureSchedule];

  const displaySchedule = showAllRows ? combinedSchedule : combinedSchedule.slice(0, 12);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalInterestPaid = futureSchedule.reduce((sum, item) => sum + item.interest, 0);
  const totalFeesPaid = futureSchedule.reduce((sum, item) => sum + item.fees, 0);
  const totalPaid = futureSchedule.reduce((sum, item) => sum + item.payment, 0);
  const monthsToPayoff = futureSchedule.length;

  // Historical totals (already paid)
  const historicalInterest = actualPayments.reduce((sum, p) => sum + p.amountToInterest, 0);
  const historicalFees = actualPayments.reduce((sum, p) => sum + p.amountToFees, 0);
  const historicalPaid = actualPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card className={`border-l-4 ${isPriority ? 'border-l-green-500 bg-green-50/30' : 'border-l-primary'}`}>
      <CardHeader className="pb-3 md:pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`${isPriority ? 'bg-green-600' : 'bg-primary'} text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-bold text-base md:text-lg`}>
              {attackOrder}
            </div>
            <div>
              <div className="flex items-center gap-1 md:gap-2">
                <CardTitle className="text-base md:text-lg">{debt.debtName}</CardTitle>
                {isPriority && (
                  <Badge className="bg-green-600 text-xs">Focus</Badge>
                )}
              </div>
              <CardDescription className="text-xs md:text-sm">{debt.creditor}</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 md:h-auto px-2 md:px-4"
          >
            {isExpanded ? (
              <>
                <span className="hidden md:inline">Hide Details</span>
                <span className="md:hidden">Hide</span>
                <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                <span className="hidden md:inline">View Details</span>
                <span className="md:hidden">View</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-blue-50 p-2 md:p-3 rounded-lg cursor-help">
                  <div className="flex items-center gap-1 md:gap-2 text-blue-600 mb-1">
                    <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs font-medium">Balance</span>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-gray-900">{formatCurrency(debt.currentBalance)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs md:text-sm">Current outstanding balance on this debt</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-green-50 p-2 md:p-3 rounded-lg cursor-help">
                  <div className="flex items-center gap-1 md:gap-2 text-green-600 mb-1">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs font-medium">Payoff</span>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-gray-900">{monthsToPayoff}m</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs md:text-sm">Months until this debt is paid off</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-purple-50 p-2 md:p-3 rounded-lg cursor-help">
                  <div className="flex items-center gap-1 md:gap-2 text-purple-600 mb-1">
                    <TrendingDown className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs font-medium">Interest</span>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-gray-900">{formatCurrency(totalInterestPaid)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs md:text-sm">Total interest you'll pay over the life of this debt</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-amber-50 p-2 md:p-3 rounded-lg cursor-help">
                  <div className="flex items-center gap-1 md:gap-2 text-amber-600 mb-1">
                    <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs font-medium">Payment</span>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-gray-900">{formatCurrency(monthlyPayment + extraPayment)}</p>
                  {extraPayment > 0 && (
                    <p className="text-xs text-green-600 font-semibold mt-0.5 md:mt-1">
                      +{formatCurrency(extraPayment)} extra
                    </p>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs md:text-sm">Your monthly payment amount for this debt</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Expanded Payment Schedule */}
        {isExpanded && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Month</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Date</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-700">Payment</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-700">Principal</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-700">Interest</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-700">Fees</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-700">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {displaySchedule.map((item, index) => (
                    <tr
                      key={item.paymentDate || index}
                      className={`border-b ${
                        item.isActual
                          ? 'bg-green-50 hover:bg-green-100'
                          : index % 2 === 0
                          ? 'bg-gray-50'
                          : 'bg-white'
                      }`}
                    >
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          {item.isActual && <Check className="h-3 w-3 text-green-600" />}
                          <span className={item.isActual ? 'font-semibold text-green-700' : 'text-gray-600'}>
                            {item.month}
                          </span>
                        </div>
                      </td>
                      <td className={`py-2 px-2 ${item.isActual ? 'font-semibold text-green-700' : 'text-gray-600'}`}>
                        {item.date}
                      </td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.payment)}</td>
                      <td className="py-2 px-2 text-right text-green-600">{formatCurrency(item.principal)}</td>
                      <td className="py-2 px-2 text-right text-red-600">{formatCurrency(item.interest)}</td>
                      <td className="py-2 px-2 text-right text-amber-600">{formatCurrency(item.fees)}</td>
                      <td className="py-2 px-2 text-right font-semibold">
                        {formatCurrency(item.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-semibold bg-gray-100">
                    <td colSpan={2} className="py-2 px-2">Totals</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(totalPaid)}</td>
                    <td className="py-2 px-2 text-right text-green-600">{formatCurrency(debt.currentBalance)}</td>
                    <td className="py-2 px-2 text-right text-red-600">{formatCurrency(totalInterestPaid)}</td>
                    <td className="py-2 px-2 text-right text-amber-600">{formatCurrency(totalFeesPaid)}</td>
                    <td className="py-2 px-2 text-right">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Legend */}
            {actualPayments.length > 0 && (
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border border-green-200 rounded flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-gray-600">
                    Actual Payments ({actualPayments.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                  <span className="text-gray-600">
                    Projected Payments ({futureSchedule.length})
                  </span>
                </div>
              </div>
            )}

            {combinedSchedule.length > 12 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllRows(!showAllRows)}
                >
                  {showAllRows ? (
                    <>Show Less</>
                  ) : (
                    <>Show All {combinedSchedule.length} Payments</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
