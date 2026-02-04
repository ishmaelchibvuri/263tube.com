import {
  Debt,
  Budget,
  RepaymentStrategy,
  AttackOrderItem,
  DebtPriority,
  StrategyOutcome,
  InDuplumAudit,
  InDuplumStatus,
  BudgetViability,
  SA_PUBLIC_HOLIDAYS_2025,
  CURRENT_NCA_CAPS,
  RateValidationResult,
} from '@/types';
import { addDays, addMonths, isWeekend, parseISO, format, differenceInDays } from 'date-fns';

// ============================================================================
// SECTION 129 CALCULATIONS (10 Business Days)
// ============================================================================

/**
 * Check if a date is a South African public holiday
 */
export function isSAPublicHoliday(date: Date): boolean {
  const dateStr = format(date, 'yyyy-MM-dd');
  return SA_PUBLIC_HOLIDAYS_2025.some(holiday => holiday.date === dateStr);
}

/**
 * Calculate Section 129 deadline: letterDate + 10 business days
 * Business days = weekdays excluding SA public holidays
 */
export function calculateSection129Deadline(letterDate: string | Date): string {
  let deadline = typeof letterDate === 'string' ? parseISO(letterDate) : letterDate;
  let businessDaysAdded = 0;

  while (businessDaysAdded < 10) {
    deadline = addDays(deadline, 1);

    // Skip weekends
    if (!isWeekend(deadline)) {
      // Skip SA public holidays
      if (!isSAPublicHoliday(deadline)) {
        businessDaysAdded++;
      }
    }
  }

  return format(deadline, 'yyyy-MM-dd');
}

// ============================================================================
// IN DUPLUM CALCULATIONS (NCA Section 103(5))
// ============================================================================

/**
 * Calculate accumulated fees since account opening
 */
export function calculateAccumulatedFees(debt: Debt): number {
  const agreementDate = parseISO(debt.agreementDate);
  const today = new Date();
  const monthsSinceOpening = Math.max(0,
    (today.getFullYear() - agreementDate.getFullYear()) * 12 +
    (today.getMonth() - agreementDate.getMonth())
  );

  // Monthly recurring fees
  const totalServiceFees = debt.monthlyServiceFee * monthsSinceOpening;

  // Once-off initiation fee (usually capitalized into principal)
  const initiationFee = debt.initiationFeeBalance || 0;

  return totalServiceFees + initiationFee;
}

/**
 * Calculate accumulated insurance premiums since account opening
 */
export function calculateAccumulatedInsurance(debt: Debt): number {
  const agreementDate = parseISO(debt.agreementDate);
  const today = new Date();
  const monthsSinceOpening = Math.max(0,
    (today.getFullYear() - agreementDate.getFullYear()) * 12 +
    (today.getMonth() - agreementDate.getMonth())
  );

  return debt.creditLifePremium * monthsSinceOpening;
}

/**
 * Estimate months until In Duplum cap is reached
 */
export function estimateMonthsToInDuplumCap(debt: Debt): number | null {
  const remainingCapRoom = debt.originalPrincipal - debt.accumulatedInterestAndFees;

  if (remainingCapRoom <= 0) {
    return null; // Already at or over cap
  }

  // Monthly interest and fees
  const monthlyInterest = (debt.currentBalance * debt.annualInterestRate) / 12 / 100;
  const monthlyInterestAndFees = monthlyInterest + debt.monthlyServiceFee + debt.creditLifePremium;

  if (monthlyInterestAndFees <= 0) {
    return null; // Will never reach cap
  }

  return Math.ceil(remainingCapRoom / monthlyInterestAndFees);
}

/**
 * Perform In Duplum audit on a debt
 */
export function performInDuplumAudit(debt: Debt): Omit<InDuplumAudit, 'auditId' | 'userId' | 'createdAt'> {
  // Step 1: Establish the cap
  const originalPrincipal = debt.originalPrincipal;
  const inDuplumCap = debt.originalPrincipal; // Per NCA 103(5)

  // Step 2: Calculate total costs charged
  const accumulatedInterest = debt.accumulatedInterestAndFees; // Simplified: total accumulated
  const accumulatedFees = calculateAccumulatedFees(debt);
  const accumulatedInsurance = calculateAccumulatedInsurance(debt);

  const totalCostsCharged = accumulatedInterest + accumulatedFees + accumulatedInsurance;

  // Step 3: Compare to cap
  const capRemaining = inDuplumCap - totalCostsCharged;
  const capExceeded = totalCostsCharged > inDuplumCap;
  const excessAmount = Math.max(0, totalCostsCharged - inDuplumCap);
  const capPercentageUsed = (totalCostsCharged / inDuplumCap) * 100;

  // Step 4: Determine status
  let status: InDuplumStatus;
  if (capExceeded) {
    status = 'BREACHED';
  } else if (capPercentageUsed >= 85) {
    status = 'NEAR_CAP';
  } else if (capPercentageUsed >= 50) {
    status = 'APPROACHING';
  } else {
    status = 'COMPLIANT';
  }

  // Step 5: Project time to cap (if not breached)
  const estimatedMonthsToCapFromCurrent = !capExceeded ? estimateMonthsToInDuplumCap(debt) : null;

  return {
    debtId: debt.debtId,
    auditDate: new Date().toISOString(),
    originalPrincipal,
    inDuplumCap,
    accumulatedInterest,
    accumulatedFees,
    accumulatedInsurance,
    totalCostsCharged,
    capRemaining,
    capExceeded,
    excessAmount,
    capPercentageUsed,
    estimatedMonthsToCapFromCurrent,
    status,
  };
}

// ============================================================================
// NCA RATE VALIDATION
// ============================================================================

/**
 * Validate interest rate against NCA caps
 */
export function validateInterestRate(
  rate: number,
  debtType: Debt['debtType']
): RateValidationResult {
  let maxAllowedRate: number;

  switch (debtType) {
    case 'mortgage':
      maxAllowedRate = CURRENT_NCA_CAPS.mortgage;
      break;
    case 'vehicle':
      maxAllowedRate = CURRENT_NCA_CAPS.vehicle;
      break;
    case 'unsecured':
    case 'creditCard':
    case 'storeCard':
    case 'personalLoan':
      maxAllowedRate = CURRENT_NCA_CAPS.unsecured;
      break;
    case 'shortTerm':
      maxAllowedRate = CURRENT_NCA_CAPS.shortTerm;
      break;
    default:
      maxAllowedRate = CURRENT_NCA_CAPS.unsecured; // Default to unsecured cap
  }

  const valid = rate <= maxAllowedRate;
  const exceedsBy = valid ? undefined : rate - maxAllowedRate;
  const warning = valid
    ? undefined
    : `This rate exceeds the NCA maximum of ${maxAllowedRate.toFixed(2)}%. You may have grounds to dispute.`;

  return {
    valid,
    warning,
    maxAllowedRate,
    exceedsBy,
  };
}

// ============================================================================
// PAYMENT APPLICATION (NCA Section 126 Order)
// ============================================================================

/**
 * Apply a payment to a debt following NCA Section 126 order:
 * 1. Outstanding fees and charges
 * 2. Accrued interest
 * 3. Principal
 *
 * Also respects In Duplum cap
 */
export function applyPayment(
  debt: Debt,
  paymentAmount: number
): {
  newBalance: number;
  amountToFees: number;
  amountToInterest: number;
  amountToPrincipal: number;
  newAccumulatedInterest: number;
} {
  let remainingPayment = paymentAmount;

  // 1. Deduct monthly service fee
  const amountToFees = Math.min(remainingPayment, debt.monthlyServiceFee + debt.creditLifePremium);
  remainingPayment -= amountToFees;

  // 2. Calculate and deduct monthly interest (respecting In Duplum cap)
  const monthlyInterest = (debt.currentBalance * debt.annualInterestRate) / 12 / 100;

  // Check In Duplum cap before adding interest
  let applicableInterest = monthlyInterest;
  if (debt.accumulatedInterestAndFees < debt.originalPrincipal) {
    applicableInterest = Math.min(
      monthlyInterest,
      debt.originalPrincipal - debt.accumulatedInterestAndFees
    );
  } else {
    applicableInterest = 0; // Cap reached, no more interest can accrue
  }

  const amountToInterest = Math.min(remainingPayment, applicableInterest);
  remainingPayment -= amountToInterest;

  // 3. Remainder reduces principal
  const amountToPrincipal = remainingPayment;

  const newBalance = Math.max(0, debt.currentBalance - amountToPrincipal);
  const newAccumulatedInterest = debt.accumulatedInterestAndFees + applicableInterest - amountToInterest;

  return {
    newBalance,
    amountToFees,
    amountToInterest,
    amountToPrincipal,
    newAccumulatedInterest,
  };
}

// ============================================================================
// BUDGET CALCULATIONS
// ============================================================================

/**
 * Calculate total income from all sources
 */
export function calculateTotalIncome(budget: Budget | Partial<Budget>): number {
  const incomeCategories = ['netSalary', 'secondaryIncome', 'partnerContribution', 'grants'];
  const customIncomeTotal = (budget.customItems || [])
    .filter(item => item.type === 'income' || incomeCategories.includes(item.category))
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    (budget.netSalary || 0) +
    (budget.secondaryIncome || 0) +
    (budget.partnerContribution || 0) +
    (budget.grants || 0) +
    customIncomeTotal
  );
}

/**
 * Calculate Needs total (50% target) - Essential fixed costs
 */
export function calculateNeeds(budget: Budget | Partial<Budget>): number {
  // 50/30/20 Rule: Needs (50%) - Essential expenses you can't live without
  const needsCategories = ['housing', 'utilities', 'transport', 'groceries', 'insurance', 'medicalAid', 'health', 'communication', 'childcare', 'education', 'security', 'loans'];

  const customNeedsTotal = (budget.customItems || [])
    .filter(item => needsCategories.includes(item.category))
    .reduce((sum, item) => sum + item.amount, 0);

  return customNeedsTotal;
}

/**
 * Calculate Wants total (30% target) - Lifestyle/discretionary spending
 */
export function calculateWants(budget: Budget | Partial<Budget>): number {
  // 50/30/20 Rule: Wants (30%) - Lifestyle choices and discretionary spending
  const wantsCategories = ['entertainment', 'personalCare', 'subscriptions', 'familySupport', 'other'];

  const customWantsTotal = (budget.customItems || [])
    .filter(item => wantsCategories.includes(item.category))
    .reduce((sum, item) => sum + item.amount, 0);

  return customWantsTotal;
}

/**
 * Calculate Savings total (20% target) - Building wealth and paying debt
 */
export function calculateSavings(budget: Budget | Partial<Budget>): number {
  // 50/30/20 Rule: Savings (20%) - Emergency fund, retirement, debt repayment
  const savingsCategories = ['savings', 'debtAccelerator'];

  const customSavingsTotal = (budget.customItems || [])
    .filter(item => savingsCategories.includes(item.category))
    .reduce((sum, item) => sum + item.amount, 0);

  return customSavingsTotal;
}

/**
 * Calculate Loans total only (separate from savings for tracking)
 * Loans are tracked separately because high loan payments need attention
 */
export function calculateLoans(budget: Budget | Partial<Budget>): number {
  const customLoansTotal = (budget.customItems || [])
    .filter(item => item.category === 'loans')
    .reduce((sum, item) => sum + item.amount, 0);

  return customLoansTotal;
}

/**
 * Calculate loan-to-income ratio as a percentage
 * @returns The percentage of income going to loan payments
 */
export function calculateLoanToIncomeRatio(budget: Budget | Partial<Budget>): number {
  const totalIncome = calculateTotalIncome(budget);
  const loansTotal = calculateLoans(budget);

  if (totalIncome === 0) return 0;
  return (loansTotal / totalIncome) * 100;
}

/**
 * Assess loan health and determine if intervention is needed
 * Thresholds based on financial health best practices:
 * - Under 10%: Healthy
 * - 10-15%: Moderate, could use attention
 * - 15-25%: High, needs action
 * - Over 25%: Critical, urgent intervention needed
 */
export type LoanHealthStatus = 'HEALTHY' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface LoanHealthAssessment {
  status: LoanHealthStatus;
  loanToIncomeRatio: number;
  loansTotal: number;
  message: string;
  needsIntervention: boolean;
}

export function assessLoanHealth(budget: Budget | Partial<Budget>): LoanHealthAssessment {
  const totalIncome = calculateTotalIncome(budget);
  const loansTotal = calculateLoans(budget);
  const ratio = calculateLoanToIncomeRatio(budget);

  if (ratio < 10) {
    return {
      status: 'HEALTHY',
      loanToIncomeRatio: ratio,
      loansTotal,
      message: 'Your loan payments are well managed.',
      needsIntervention: false,
    };
  }

  if (ratio < 15) {
    return {
      status: 'MODERATE',
      loanToIncomeRatio: ratio,
      loansTotal,
      message: 'Your loan payments are moderate. Consider a payoff strategy.',
      needsIntervention: false,
    };
  }

  if (ratio < 25) {
    return {
      status: 'HIGH',
      loanToIncomeRatio: ratio,
      loansTotal,
      message: 'Your loan payments are high. A structured payoff plan could help.',
      needsIntervention: true,
    };
  }

  return {
    status: 'CRITICAL',
    loanToIncomeRatio: ratio,
    loansTotal,
    message: 'Your loan payments need urgent attention. Professional debt help is recommended.',
    needsIntervention: true,
  };
}

/**
 * Calculate total fixed obligations (Needs + Savings for backwards compatibility)
 */
export function calculateFixedObligations(budget: Budget | Partial<Budget>): number {
  return calculateNeeds(budget) + calculateSavings(budget);
}

/**
 * Calculate total variable expenses (Wants for backwards compatibility)
 */
export function calculateVariableExpenses(budget: Budget | Partial<Budget>): number {
  return calculateWants(budget);
}

/**
 * Calculate Debt Attack Budget (amount available for debt repayment)
 */
export function calculateDebtAttackBudget(budget: Budget | Partial<Budget>): number {
  const totalIncome = calculateTotalIncome(budget);
  const fixedObligations = calculateFixedObligations(budget);
  const variableExpenses = calculateVariableExpenses(budget);

  return totalIncome - fixedObligations - variableExpenses;
}

/**
 * Assess budget viability against debt obligations
 */
export function assessBudgetViability(
  budget: Budget | Partial<Budget>,
  debts: Debt[]
): BudgetViability {
  const debtAttackBudget = calculateDebtAttackBudget(budget);
  const minimumRequired = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

  if (debtAttackBudget < 0) {
    return {
      status: 'DEFICIT',
      shortfall: Math.abs(debtAttackBudget),
      recommendation: 'DEBT_COUNSELLING_SUGGESTED',
      message: 'Your expenses exceed your income. Debt Review may help restructure your payments.',
    };
  }

  if (debtAttackBudget < minimumRequired) {
    return {
      status: 'BELOW_MINIMUM',
      shortfall: minimumRequired - debtAttackBudget,
      recommendation: 'EXPENSE_REVIEW_OR_COUNSELLING',
      message: "Your budget doesn't cover minimum payments. Let's review expenses or consider Debt Review.",
    };
  }

  if (debtAttackBudget < minimumRequired * 1.2) {
    return {
      status: 'TIGHT',
      surplus: debtAttackBudget - minimumRequired,
      recommendation: 'PROCEED_WITH_CAUTION',
      message: 'Your budget is tight. Any unexpected expense could derail progress.',
    };
  }

  return {
    status: 'HEALTHY',
    surplus: debtAttackBudget - minimumRequired,
    recommendation: 'PROCEED',
    message: 'You have room to attack debt aggressively.',
  };
}

// ============================================================================
// DEBT PRIORITY SCORING
// ============================================================================

/**
 * Calculate priority score for debt ordering
 * Higher score = higher priority
 */
export function calculatePriorityScore(debt: Debt): number {
  let score = 0;

  // Section 129 is highest priority
  if (debt.section129Received && debt.section129Deadline) {
    const deadline = parseISO(debt.section129Deadline);
    const today = new Date();
    const daysRemaining = differenceInDays(deadline, today);

    if (daysRemaining >= 0) {
      // Urgency increases as deadline approaches
      score += 10000 - daysRemaining * 100;
    }
  }

  // In Duplum proximity (debts close to cap should be deprioritized)
  const inDuplumRatio = debt.accumulatedInterestAndFees / debt.originalPrincipal;
  if (inDuplumRatio >= 0.9) {
    score -= 500; // Deprioritize, interest is about to cap
  }

  return score;
}

// ============================================================================
// STRATEGY CALCULATIONS
// ============================================================================

/**
 * Generate attack order based on selected strategy
 */
export function generateAttackOrder(
  debts: Debt[],
  strategy: RepaymentStrategy,
  monthlyBudget: number
): AttackOrderItem[] {
  // Filter out paid-off and archived debts
  const activeDebts = debts.filter(d => d.currentBalance > 0 && !d.isArchived);

  // Step 1: Always prioritize Section 129 debts (legal override)
  const section129Debts = activeDebts.filter(
    d => d.section129Received && d.section129Deadline && parseISO(d.section129Deadline) > new Date()
  );
  section129Debts.sort((a, b) => {
    const aDeadline = parseISO(a.section129Deadline!);
    const bDeadline = parseISO(b.section129Deadline!);
    return aDeadline.getTime() - bDeadline.getTime(); // Most urgent first
  });

  // Step 2: Identify In Duplum candidates (85-100% of cap)
  const inDuplumDebts = activeDebts.filter(d => {
    const ratio = d.accumulatedInterestAndFees / d.originalPrincipal;
    return ratio >= 0.85 && ratio < 1.0;
  });

  // Step 3: Sort remaining debts by strategy
  const remainingDebts = activeDebts.filter(
    d => !section129Debts.includes(d) && !inDuplumDebts.includes(d)
  );

  switch (strategy) {
    case 'SNOWBALL':
      // Smallest balance first
      remainingDebts.sort((a, b) => a.currentBalance - b.currentBalance);
      break;

    case 'AVALANCHE':
      // Highest interest rate first
      remainingDebts.sort((a, b) => b.annualInterestRate - a.annualInterestRate);
      break;

    case 'SMART_SA':
      // Hybrid: High interest first, but consider In Duplum proximity
      remainingDebts.sort((a, b) => {
        let aScore = a.annualInterestRate * 100;
        let bScore = b.annualInterestRate * 100;

        // Reduce priority if approaching In Duplum cap
        const aRatio = a.accumulatedInterestAndFees / a.originalPrincipal;
        const bRatio = b.accumulatedInterestAndFees / b.originalPrincipal;

        if (aRatio > 0.7) {
          aScore *= 1 - aRatio;
        }
        if (bRatio > 0.7) {
          bScore *= 1 - bRatio;
        }

        return bScore - aScore; // Descending order
      });
      break;
  }

  // Step 4: Combine with priorities
  const attackOrder: AttackOrderItem[] = [];
  let order = 1;

  // Add Section 129 debts first
  section129Debts.forEach(debt => {
    attackOrder.push({
      debt,
      priority: 'LEGAL',
      order: order++,
      recommendedAction: `Section 129 Active - ${differenceInDays(parseISO(debt.section129Deadline!), new Date())} days to respond`,
    });
  });

  // Add strategy-based debts
  remainingDebts.forEach(debt => {
    attackOrder.push({
      debt,
      priority: 'STRATEGY',
      order: order++,
    });
  });

  // Add In Duplum watch debts last
  inDuplumDebts.forEach(debt => {
    const monthsToWCap = estimateMonthsToInDuplumCap(debt);
    attackOrder.push({
      debt,
      priority: 'IN_DUPLUM_WATCH',
      order: order++,
      recommendedAction: monthsToWCap
        ? `In Duplum: ${(debt.accumulatedInterestAndFees / debt.originalPrincipal * 100).toFixed(0)}% reached. Interest will cap in ~${monthsToWCap} months. Pay minimums only.`
        : 'In Duplum cap reached. Pay minimums only.',
    });
  });

  return attackOrder;
}

/**
 * Simulate a repayment strategy and calculate outcomes
 */
export function simulateStrategy(
  debts: Debt[],
  strategy: RepaymentStrategy,
  monthlyBudget: number
): StrategyOutcome {
  // Clone debts for simulation
  const simulatedDebts = debts.map(d => ({ ...d })).filter(d => d.currentBalance > 0 && !d.isArchived);
  const attackOrder = generateAttackOrder(simulatedDebts, strategy, monthlyBudget);

  let totalInterestPaid = 0;
  let monthsToFreedom = 0;
  let firstDebtClearedMonth: number | null = null;

  // Simulate month by month
  while (simulatedDebts.some(d => d.currentBalance > 0)) {
    monthsToFreedom++;
    let availableFunds = monthlyBudget;

    // Pay all minimums first
    for (const debt of simulatedDebts) {
      if (debt.currentBalance > 0) {
        const payment = Math.min(debt.minimumPayment, debt.currentBalance);
        const result = applyPayment(debt, payment);

        debt.currentBalance = result.newBalance;
        debt.accumulatedInterestAndFees = result.newAccumulatedInterest;
        totalInterestPaid += result.amountToInterest;
        availableFunds -= payment;
      }
    }

    // Apply surplus to target debt (first in attack order with balance > 0)
    const targetDebt = attackOrder.find(item => item.debt.currentBalance > 0)?.debt;
    if (targetDebt && availableFunds > 0) {
      const extraPayment = Math.min(availableFunds, targetDebt.currentBalance);
      const result = applyPayment(targetDebt, extraPayment);

      targetDebt.currentBalance = result.newBalance;
      targetDebt.accumulatedInterestAndFees = result.newAccumulatedInterest;
      totalInterestPaid += result.amountToInterest;
    }

    // Track first debt cleared
    if (firstDebtClearedMonth === null) {
      const clearedDebt = simulatedDebts.find(d => d.currentBalance <= 0);
      if (clearedDebt) {
        firstDebtClearedMonth = monthsToFreedom;
      }
    }

    // Safety: prevent infinite loop
    if (monthsToFreedom > 1200) {
      // 100 years
      break;
    }
  }

  const debtFreeDate = format(addMonths(new Date(), monthsToFreedom), 'yyyy-MM-dd');

  return {
    strategy,
    totalInterestPaid,
    monthsToFreedom,
    debtFreeDate,
    firstDebtClearedMonth: firstDebtClearedMonth || monthsToFreedom,
  };
}

/**
 * Calculate interest saved vs minimum payment scenario
 */
export function calculateInterestSaved(
  debts: Debt[],
  strategy: RepaymentStrategy,
  monthlyBudget: number
): number {
  // Scenario A: Minimum payments only (pay only minimum on all debts forever)
  const minimumScenario = simulateStrategy(
    debts,
    strategy,
    debts.reduce((sum, d) => sum + d.minimumPayment, 0) // Only pay minimums
  );

  // Scenario B: User's actual strategy with budget
  const strategyScenario = simulateStrategy(debts, strategy, monthlyBudget);

  return minimumScenario.totalInterestPaid - strategyScenario.totalInterestPaid;
}

/**
 * Calculate debt-free date based on current plan
 */
export function calculateDebtFreeDate(
  debts: Debt[],
  monthlyBudget: number,
  strategy: RepaymentStrategy
): string {
  const outcome = simulateStrategy(debts, strategy, monthlyBudget);
  return outcome.debtFreeDate;
}
