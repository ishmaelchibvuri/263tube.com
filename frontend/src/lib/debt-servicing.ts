import { Debt, PaymentRecord } from "@/types";
import { differenceInMonths, addMonths, parseISO, format } from "date-fns";

/**
 * Debt Servicing Calculations
 * Complies with NCA Section 103(5) (In Duplum Rule) and Section 126 (Payment Allocation Order)
 */

export interface MonthlyDebtSnapshot {
  month: string; // "YYYY-MM"
  openingBalance: number;
  interestCharged: number;
  feesCharged: number;
  totalCostsCharged: number;
  paymentsReceived: number;
  closingBalance: number;
  accumulatedInterestAndFees: number;
  inDuplumCapReached: boolean;
  principalReduction: number;
}

export interface PaymentAllocation {
  totalPayment: number;
  toFees: number;
  toInterest: number;
  toPrincipal: number;
  remainingBalance: number;
}

/**
 * Calculate monthly interest charge for a debt
 * Formula: (currentBalance * annualInterestRate) / 12
 */
export function calculateMonthlyInterest(
  currentBalance: number,
  annualInterestRate: number
): number {
  if (currentBalance <= 0) return 0;
  const monthlyRate = annualInterestRate / 100 / 12;
  return currentBalance * monthlyRate;
}

/**
 * Calculate total monthly fees for a debt
 * Includes: service fee, credit life premium, etc.
 */
export function calculateMonthlyFees(debt: Debt): number {
  return (debt.monthlyServiceFee || 0) + (debt.creditLifePremium || 0);
}

/**
 * Check if In Duplum cap has been reached
 * Per NCA Section 103(5): Total interest + fees cannot exceed original principal
 */
export function checkInDuplumCap(
  accumulatedInterestAndFees: number,
  originalPrincipal: number
): {
  capReached: boolean;
  capRemaining: number;
  capPercentageUsed: number;
} {
  const capRemaining = Math.max(0, originalPrincipal - accumulatedInterestAndFees);
  const capPercentageUsed = (accumulatedInterestAndFees / originalPrincipal) * 100;

  return {
    capReached: accumulatedInterestAndFees >= originalPrincipal,
    capRemaining,
    capPercentageUsed: Math.min(100, capPercentageUsed),
  };
}

/**
 * Apply In Duplum cap to interest charge
 * If cap would be exceeded, reduce interest to stay within cap
 */
export function applyInDuplumCap(
  proposedInterest: number,
  proposedFees: number,
  accumulatedInterestAndFees: number,
  originalPrincipal: number
): {
  allowedInterest: number;
  allowedFees: number;
  cappedAmount: number;
  capReached: boolean;
} {
  const totalProposed = proposedInterest + proposedFees;
  const newAccumulated = accumulatedInterestAndFees + totalProposed;

  if (newAccumulated <= originalPrincipal) {
    // Within cap
    return {
      allowedInterest: proposedInterest,
      allowedFees: proposedFees,
      cappedAmount: 0,
      capReached: false,
    };
  }

  // Cap would be exceeded - calculate allowed amount
  const allowedTotal = Math.max(0, originalPrincipal - accumulatedInterestAndFees);
  const cappedAmount = totalProposed - allowedTotal;

  // Allocate allowed amount proportionally between interest and fees
  const interestRatio = proposedInterest / totalProposed;
  const feesRatio = proposedFees / totalProposed;

  return {
    allowedInterest: allowedTotal * interestRatio,
    allowedFees: allowedTotal * feesRatio,
    cappedAmount,
    capReached: true,
  };
}

/**
 * Allocate payment according to NCA Section 126 order
 * Order: Fees → Interest → Principal
 */
export function allocatePayment(
  paymentAmount: number,
  outstandingFees: number,
  outstandingInterest: number,
  outstandingPrincipal: number
): PaymentAllocation {
  let remaining = paymentAmount;
  let toFees = 0;
  let toInterest = 0;
  let toPrincipal = 0;

  // 1. Pay fees first
  if (remaining > 0 && outstandingFees > 0) {
    toFees = Math.min(remaining, outstandingFees);
    remaining -= toFees;
  }

  // 2. Pay interest second
  if (remaining > 0 && outstandingInterest > 0) {
    toInterest = Math.min(remaining, outstandingInterest);
    remaining -= toInterest;
  }

  // 3. Pay principal last
  if (remaining > 0 && outstandingPrincipal > 0) {
    toPrincipal = Math.min(remaining, outstandingPrincipal);
    remaining -= toPrincipal;
  }

  const newPrincipal = outstandingPrincipal - toPrincipal;
  const newInterest = outstandingInterest - toInterest;
  const newFees = outstandingFees - toFees;
  const remainingBalance = newPrincipal + newInterest + newFees;

  return {
    totalPayment: paymentAmount,
    toFees,
    toInterest,
    toPrincipal,
    remainingBalance,
  };
}

/**
 * Calculate debt servicing for a single month
 */
export function calculateMonthlyServicing(
  debt: Debt,
  monthDate: Date,
  paymentsThisMonth: number = 0
): MonthlyDebtSnapshot {
  const month = format(monthDate, 'yyyy-MM');

  // Calculate charges
  const monthlyFees = calculateMonthlyFees(debt);
  let monthlyInterest = calculateMonthlyInterest(debt.currentBalance, debt.annualInterestRate);

  // Apply In Duplum cap
  const { allowedInterest, allowedFees, capReached } = applyInDuplumCap(
    monthlyInterest,
    monthlyFees,
    debt.accumulatedInterestAndFees,
    debt.originalPrincipal
  );

  const totalCosts = allowedInterest + allowedFees;
  const newAccumulatedCosts = debt.accumulatedInterestAndFees + totalCosts;

  // Apply payment
  const balanceBeforePayment = debt.currentBalance + totalCosts;
  const allocation = allocatePayment(
    paymentsThisMonth,
    allowedFees,
    allowedInterest,
    debt.currentBalance
  );

  const principalReduction = allocation.toPrincipal;
  const closingBalance = allocation.remainingBalance;

  return {
    month,
    openingBalance: debt.currentBalance,
    interestCharged: allowedInterest,
    feesCharged: allowedFees,
    totalCostsCharged: totalCosts,
    paymentsReceived: paymentsThisMonth,
    closingBalance,
    accumulatedInterestAndFees: newAccumulatedCosts,
    inDuplumCapReached: capReached,
    principalReduction,
  };
}

/**
 * Project debt balance over multiple months
 * Useful for strategy simulation and debt-free date calculation
 */
export function projectDebtBalance(
  debt: Debt,
  monthlyPayment: number,
  numberOfMonths: number,
  startDate?: Date
): MonthlyDebtSnapshot[] {
  const snapshots: MonthlyDebtSnapshot[] = [];
  const start = startDate || new Date();

  // Create working copy of debt
  let workingDebt: Debt = { ...debt };

  for (let i = 0; i < numberOfMonths; i++) {
    const monthDate = addMonths(start, i);
    const snapshot = calculateMonthlyServicing(workingDebt, monthDate, monthlyPayment);

    snapshots.push(snapshot);

    // Update working debt for next iteration
    workingDebt = {
      ...workingDebt,
      currentBalance: snapshot.closingBalance - snapshot.feesCharged - snapshot.interestCharged,
      accumulatedInterestAndFees: snapshot.accumulatedInterestAndFees,
      inDuplumCapReached: snapshot.inDuplumCapReached,
    };

    // Stop if debt is paid off
    if (workingDebt.currentBalance <= 0) {
      break;
    }
  }

  return snapshots;
}

/**
 * Calculate months until debt is paid off
 * Returns -1 if payment is insufficient to cover monthly costs
 */
export function calculateMonthsToPayoff(
  debt: Debt,
  monthlyPayment: number
): number {
  const monthlyFees = calculateMonthlyFees(debt);
  const monthlyInterest = calculateMonthlyInterest(debt.currentBalance, debt.annualInterestRate);
  const minimumToMakeProgress = monthlyFees + monthlyInterest;

  if (monthlyPayment <= minimumToMakeProgress) {
    return -1; // Payment insufficient
  }

  // Project up to 600 months (50 years) - should be more than enough
  const projections = projectDebtBalance(debt, monthlyPayment, 600);

  // Find month where balance reaches zero
  const payoffMonth = projections.find(s => s.closingBalance <= 0);

  return payoffMonth ? projections.indexOf(payoffMonth) + 1 : -1;
}

/**
 * Calculate total interest that will be paid over the life of the debt
 */
export function calculateTotalInterestToBePaid(
  debt: Debt,
  monthlyPayment: number
): {
  totalInterest: number;
  totalFees: number;
  totalCosts: number;
  monthsToPayoff: number;
} {
  const projections = projectDebtBalance(debt, monthlyPayment, 600);

  const totalInterest = projections.reduce((sum, s) => sum + s.interestCharged, 0);
  const totalFees = projections.reduce((sum, s) => sum + s.feesCharged, 0);
  const totalCosts = totalInterest + totalFees;
  const monthsToPayoff = projections.length;

  return {
    totalInterest,
    totalFees,
    totalCosts,
    monthsToPayoff,
  };
}

/**
 * Get months elapsed since debt agreement date
 * Used for historical balance calculations
 */
export function getMonthsSinceAgreement(debt: Debt): number {
  const agreementDate = parseISO(debt.agreementDate);
  const today = new Date();
  return differenceInMonths(today, agreementDate);
}

/**
 * Calculate what the balance SHOULD be based on payment history
 * Useful for detecting discrepancies with creditor statements
 */
export function calculateExpectedBalance(
  debt: Debt,
  paymentHistory: PaymentRecord[]
): {
  expectedBalance: number;
  expectedAccumulatedCosts: number;
  discrepancy: number;
  inDuplumStatus: 'compliant' | 'approaching' | 'near_cap' | 'breached';
} {
  // Group payments by month
  const paymentsByMonth = new Map<string, number>();
  paymentHistory.forEach(payment => {
    const month = format(parseISO(payment.paymentDate), 'yyyy-MM');
    const existing = paymentsByMonth.get(month) || 0;
    paymentsByMonth.set(month, existing + payment.amount);
  });

  // Project from agreement date to today
  const agreementDate = parseISO(debt.agreementDate);
  const monthsElapsed = getMonthsSinceAgreement(debt);

  const projections = [];
  let workingDebt = {
    ...debt,
    currentBalance: debt.openingBalance,
    accumulatedInterestAndFees: 0,
  };

  for (let i = 0; i < monthsElapsed; i++) {
    const monthDate = addMonths(agreementDate, i);
    const month = format(monthDate, 'yyyy-MM');
    const paymentsThisMonth = paymentsByMonth.get(month) || 0;

    const snapshot = calculateMonthlyServicing(workingDebt, monthDate, paymentsThisMonth);
    projections.push(snapshot);

    workingDebt = {
      ...workingDebt,
      currentBalance: snapshot.closingBalance - snapshot.feesCharged - snapshot.interestCharged,
      accumulatedInterestAndFees: snapshot.accumulatedInterestAndFees,
      inDuplumCapReached: snapshot.inDuplumCapReached,
    };
  }

  const latestSnapshot = projections[projections.length - 1] || {
    closingBalance: debt.openingBalance,
    accumulatedInterestAndFees: 0,
  };

  const expectedBalance = latestSnapshot.closingBalance;
  const expectedAccumulatedCosts = latestSnapshot.accumulatedInterestAndFees;
  const discrepancy = debt.currentBalance - expectedBalance;

  // Determine In Duplum status
  const capPercentage = (expectedAccumulatedCosts / debt.originalPrincipal) * 100;
  let inDuplumStatus: 'compliant' | 'approaching' | 'near_cap' | 'breached';

  if (capPercentage >= 100) {
    inDuplumStatus = 'breached';
  } else if (capPercentage >= 85) {
    inDuplumStatus = 'near_cap';
  } else if (capPercentage >= 50) {
    inDuplumStatus = 'approaching';
  } else {
    inDuplumStatus = 'compliant';
  }

  return {
    expectedBalance,
    expectedAccumulatedCosts,
    discrepancy,
    inDuplumStatus,
  };
}
