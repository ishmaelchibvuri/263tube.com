import { Debt } from "./debt-database";

export type RepaymentStrategy = "SNOWBALL" | "AVALANCHE" | "SMART_SA";

export interface DebtWithPriority extends Debt {
  priority: number;
  priorityReason: "SECTION_129" | "STRATEGY" | "IN_DUPLUM";
}

export interface StrategyOutcome {
  strategy: RepaymentStrategy;
  monthsToFreedom: number;
  debtFreeDate: Date | null;
  totalInterestPaid: number;
  totalPaid: number;
  attackOrder: DebtWithPriority[];
}

/**
 * Generate attack order based on strategy
 */
export function generateAttackOrder(
  debts: Debt[],
  strategy: RepaymentStrategy
): DebtWithPriority[] {
  // Filter out paid off debts - use same logic as dashboard
  const activeDebts = debts.filter((d) => !d.paidOffAt && !d.isArchived && d.currentBalance > 0.01);

  // Assign priorities
  const debtsWithPriority: DebtWithPriority[] = activeDebts.map((debt) => {
    // Section 129 debts have highest priority (always first)
    if (debt.section129Received && debt.section129Deadline) {
      return {
        ...debt,
        priority: 1,
        priorityReason: "SECTION_129" as const,
      };
    }

    // In Duplum near cap debts have second priority
    if (
      debt.inDuplumStatus === "reached" ||
      debt.inDuplumStatus === "approaching"
    ) {
      return {
        ...debt,
        priority: 2,
        priorityReason: "IN_DUPLUM" as const,
      };
    }

    // Normal debts sorted by strategy
    return {
      ...debt,
      priority: 3,
      priorityReason: "STRATEGY" as const,
    };
  });

  // Sort by priority, then by strategy
  return debtsWithPriority.sort((a, b) => {
    // First sort by priority (Section 129, In Duplum, then strategy)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // Within same priority, sort by strategy
    if (strategy === "SNOWBALL") {
      // Smallest balance first
      return a.currentBalance - b.currentBalance;
    } else if (strategy === "AVALANCHE") {
      // Highest interest rate first
      return b.annualInterestRate - a.annualInterestRate;
    } else {
      // SMART_SA: Legal priorities + In Duplum optimization
      // Already sorted by priority above
      // Within same priority, use Avalanche (highest interest)
      return b.annualInterestRate - a.annualInterestRate;
    }
  });
}

/**
 * Simulate a repayment strategy
 */
export function simulateStrategy(
  debts: Debt[],
  strategy: RepaymentStrategy,
  monthlyDebtBudget: number
): StrategyOutcome {
  const attackOrder = generateAttackOrder(debts, strategy);

  // Clone debts for simulation
  const simulatedDebts = attackOrder.map((d) => ({
    ...d,
    currentBalance: d.currentBalance,
  }));

  let totalInterestPaid = 0;
  let months = 0;
  const maxMonths = 600; // 50 years max (safety limit)
  const startDate = new Date();
  let lastDebtPaidOffDate: Date | null = null;

  console.log('[SIMULATION] Starting debt simulation:', {
    debtCount: simulatedDebts.length,
    totalBalance: simulatedDebts.reduce((sum, d) => sum + d.currentBalance, 0),
    monthlyBudget: monthlyDebtBudget,
    strategy
  });

  // Simulate month by month (using small epsilon for floating point comparison)
  while (simulatedDebts.some((d) => d.currentBalance > 0.01) && months < maxMonths) {
    months++;
    const currentSimulationDate = new Date(startDate);
    currentSimulationDate.setMonth(startDate.getMonth() + months);

    let remainingBudget = monthlyDebtBudget;

    // Pay minimums on all debts first
    for (const debt of simulatedDebts) {
      if (debt.currentBalance <= 0) continue;

      console.log('[LOOP] Processing debt:', {
        debtName: debt.debtName,
        balanceBefore: debt.currentBalance,
        annualInterestRate: debt.annualInterestRate,
        monthlyServiceFee: debt.monthlyServiceFee,
        month: months
      });

      const minimumPayment = Math.min(
        debt.minimumMonthlyPayment || debt.minimumPayment,
        debt.currentBalance
      );
      const interest = (debt.currentBalance * debt.annualInterestRate) / 100 / 12;

      // Check In Duplum cap
      const canChargeInterest =
        !debt.inDuplumCapReached &&
        debt.accumulatedInterestAndFees + interest <= debt.originalPrincipal;

      const actualInterest = canChargeInterest ? interest : 0;
      totalInterestPaid += actualInterest;

      // Apply payment: fees → interest → principal
      const fees = (debt.monthlyServiceFee || 0) + (debt.monthlyCreditLifeInsurance || 0);
      let payment = minimumPayment;
      let afterFees = Math.max(0, payment - fees);
      let afterInterest = Math.max(0, afterFees - actualInterest);
      let principal = afterInterest;

      const wasPaid = debt.currentBalance > 0.01;
      const balanceBeforePayment = debt.currentBalance;
      debt.currentBalance = Math.max(0, debt.currentBalance - principal);

      console.log('[PAYMENT] Minimum payment applied:', {
        debtName: debt.debtName,
        minimumPayment,
        fees,
        interest: actualInterest,
        principal,
        balanceBefore: balanceBeforePayment,
        balanceAfter: debt.currentBalance,
        month: months
      });

      // Track when this debt was paid off (using small epsilon for floating point comparison)
      if (wasPaid && debt.currentBalance < 0.01) {
        lastDebtPaidOffDate = new Date(currentSimulationDate);
        console.log('[SIMULATION] Debt paid off!', {
          debtName: debt.debtName,
          balanceBeforePayment,
          balanceAfterPayment: debt.currentBalance,
          paymentMonth: months,
          paidOffDate: lastDebtPaidOffDate.toISOString()
        });
      }

      remainingBudget -= minimumPayment;
    }

    // Apply extra budget to target debt (first debt with balance > 0)
    if (remainingBudget > 0) {
      const targetDebt = simulatedDebts.find((d) => d.currentBalance > 0.01);
      if (targetDebt) {
        const wasPaid = targetDebt.currentBalance > 0.01;
        const balanceBeforeExtra = targetDebt.currentBalance;
        const extraPayment = Math.min(remainingBudget, targetDebt.currentBalance);
        targetDebt.currentBalance -= extraPayment;

        console.log('[EXTRA] Extra payment applied:', {
          debtName: targetDebt.debtName,
          remainingBudget,
          extraPayment,
          balanceBefore: balanceBeforeExtra,
          balanceAfter: targetDebt.currentBalance,
          month: months
        });

        // Track when this debt was paid off (using small epsilon for floating point comparison)
        if (wasPaid && targetDebt.currentBalance < 0.01) {
          lastDebtPaidOffDate = new Date(currentSimulationDate);
          console.log('[SIMULATION] Debt paid off with extra payment!', {
            debtName: targetDebt.debtName,
            balanceBeforeExtra,
            extraPayment,
            balanceAfterPayment: targetDebt.currentBalance,
            paymentMonth: months,
            paidOffDate: lastDebtPaidOffDate.toISOString()
          });
        }
      }
    }

    // Log end of month state
    console.log('[MONTH-END] Month', months, 'complete. Debt states:', simulatedDebts.map(d => ({
      debtName: d.debtName,
      currentBalance: d.currentBalance,
      isPaidOff: d.currentBalance < 0.01
    })));
  }

  const totalPaid = debts.reduce((sum, d) => sum + d.originalPrincipal, 0) + totalInterestPaid;

  // Calculate debt-free date as the day after the last debt is paid off
  let debtFreeDate: Date | null = null;
  if (lastDebtPaidOffDate) {
    debtFreeDate = new Date(lastDebtPaidOffDate);
    debtFreeDate.setDate(debtFreeDate.getDate() + 1);
  }

  console.log('[SIMULATION] Simulation complete:', {
    months,
    lastDebtPaidOffDate: lastDebtPaidOffDate?.toISOString() || 'null',
    debtFreeDate: debtFreeDate?.toISOString() || 'null',
    totalInterestPaid,
    remainingDebts: simulatedDebts.filter(d => d.currentBalance > 0.01).length
  });

  return {
    strategy,
    monthsToFreedom: months,
    debtFreeDate,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    attackOrder,
  };
}

/**
 * Simulate all three strategies and return comparison
 */
export function simulateAllStrategies(
  debts: Debt[],
  monthlyDebtBudget: number
): {
  snowball: StrategyOutcome;
  avalanche: StrategyOutcome;
  smartSA: StrategyOutcome;
  recommended: RepaymentStrategy;
} {
  const snowball = simulateStrategy(debts, "SNOWBALL", monthlyDebtBudget);
  const avalanche = simulateStrategy(debts, "AVALANCHE", monthlyDebtBudget);
  const smartSA = simulateStrategy(debts, "SMART_SA", monthlyDebtBudget);

  // Recommend Smart SA if there are legal priorities, otherwise Avalanche
  const hasLegalPriorities = debts.some(
    (d) =>
      d.section129Received ||
      d.inDuplumStatus === "reached" ||
      d.inDuplumStatus === "approaching"
  );

  const recommended = hasLegalPriorities ? "SMART_SA" : "AVALANCHE";

  return {
    snowball,
    avalanche,
    smartSA,
    recommended,
  };
}
