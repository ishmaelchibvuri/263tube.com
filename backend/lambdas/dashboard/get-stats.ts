import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DebtDatabaseHelpers } from "../../lib/debt-database";
import { simulateStrategy } from "../../lib/strategy-calculator";
import { calculateDebtAttackBudget } from "../../lib/budget-calculations";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { withCorsWrapper } from "../../lib/cors-wrapper";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "";

/**
 * GET /dashboard/stats
 * Get aggregated dashboard statistics
 */
const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;

    if (!userId) {
      console.error("[ERROR] No userId found in authorizer context");
      return createErrorResponse(401, "Unauthorized", undefined, event);
    }

    console.log("[DASHBOARD] Fetching dashboard stats for user:", userId);

    // Get debts, budget, and strategy in parallel
    const [debts, budget, strategyResult] = await Promise.all([
      DebtDatabaseHelpers.getUserDebts(userId),
      DebtDatabaseHelpers.getUserBudget(userId),
      ddbDocClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: "STRATEGY",
          },
        })
      ),
    ]);

    // Get user's selected strategy, default to SMART_SA if not set
    const selectedStrategy = strategyResult.Item?.strategy || "SMART_SA";
    console.log("[STRATEGY] User's selected strategy:", selectedStrategy);

    // Calculate basic stats
    const activeDebts = debts.filter((d) => !d.paidOffAt && !d.isArchived);
    const paidOffDebts = debts.filter((d) => d.paidOffAt);

    const totalDebt = activeDebts.reduce((sum, d) => sum + d.currentBalance, 0);
    const totalOriginalPrincipal = activeDebts.reduce(
      (sum, d) => sum + d.originalPrincipal,
      0
    );
    const totalMinimumPayment = activeDebts.reduce(
      (sum, d) => sum + d.minimumPayment,
      0
    );

    // Section 129 alerts
    const section129Debts = activeDebts.filter((d) => d.section129Received);
    const section129DueDebts = section129Debts.filter((d) => {
      if (!d.section129Deadline) return false;
      const deadline = new Date(d.section129Deadline);
      const now = new Date();
      const daysRemaining = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysRemaining <= 3 && daysRemaining >= 0;
    });

    // In Duplum warnings (calculate ratio)
    const inDuplumWarningDebts = activeDebts.filter((d) => {
      const ratio = d.accumulatedInterestAndFees / d.originalPrincipal;
      return ratio >= 0.7 && ratio < 1.0;
    });
    const inDuplumBreachedDebts = activeDebts.filter((d) => {
      const ratio = d.accumulatedInterestAndFees / d.originalPrincipal;
      return ratio >= 1.0;
    });

    // Calculate debt-free projection and budget
    let debtFreeDate: string | null = null;
    let daysUntilDebtFree: number | null = null;
    let monthsUntilDebtFree: number | null = null;
    let interestSaved: number = 0;
    let projectedTotalInterestMinimum: number = 0;
    let projectedTotalInterestStrategy: number = 0;
    let monthlyDebtBudget: number = 0;

    if (activeDebts.length > 0) {
      // Calculate budget if available
      console.log('[BUDGET] Budget data:', budget ? 'Found' : 'Not found');
      if (budget) {
        console.log('[BUDGET] Budget details:', JSON.stringify(budget, null, 2));

        // Use the same budget calculation as the strategy simulation endpoint
        monthlyDebtBudget = calculateDebtAttackBudget(budget);

        console.log('[BUDGET] Budget calculation result:', {
          monthlyDebtBudget
        });
      } else {
        console.warn('[BUDGET] No budget found for user');
      }

      // Use budget if sufficient, otherwise use minimum payments for realistic projection
      const effectiveBudget = monthlyDebtBudget >= totalMinimumPayment
        ? monthlyDebtBudget
        : totalMinimumPayment;

      // Log active debts before simulation
      console.log('[DEBUG] Active debts before simulation:', activeDebts.map(d => ({
        debtName: d.debtName,
        currentBalance: d.currentBalance,
        minimumPayment: d.minimumPayment,
        minimumMonthlyPayment: d.minimumMonthlyPayment
      })));

      // Simulate user's selected strategy with effective budget
      console.log('[DEBUG] About to run strategy simulation with budget:', effectiveBudget);
      const strategySimulation = simulateStrategy(
        activeDebts,
        selectedStrategy,
        effectiveBudget
      );
      console.log('[DEBUG] Strategy simulation returned:', {
        months: strategySimulation.monthsToFreedom,
        debtFreeDate: strategySimulation.debtFreeDate,
        interest: strategySimulation.totalInterestPaid
      });

      // Simulate minimum payments only for comparison
      console.log('[DEBUG] About to run minimum simulation with budget:', totalMinimumPayment);
      const minimumSimulation = simulateStrategy(
        activeDebts,
        selectedStrategy,
        totalMinimumPayment
      );
      console.log('[DEBUG] Minimum simulation returned:', {
        months: minimumSimulation.monthsToFreedom,
        debtFreeDate: minimumSimulation.debtFreeDate,
        interest: minimumSimulation.totalInterestPaid
      });

      // Use the actual debt-free date from simulation (day after last debt is paid)
      console.log('[SIMULATION] Strategy simulation result:', {
        monthsToFreedom: strategySimulation.monthsToFreedom,
        debtFreeDate: strategySimulation.debtFreeDate,
        totalInterestPaid: strategySimulation.totalInterestPaid,
        activeDebtsCount: activeDebts.length,
        effectiveBudget
      });

      if (strategySimulation.debtFreeDate) {
        debtFreeDate = strategySimulation.debtFreeDate.toISOString();

        // Calculate days and months until debt free from today
        const now = new Date();
        const diffTime = strategySimulation.debtFreeDate.getTime() - now.getTime();
        daysUntilDebtFree = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        monthsUntilDebtFree = strategySimulation.monthsToFreedom;
        console.log('[DEBT-FREE] Debt-free date calculated:', debtFreeDate);
      } else {
        console.warn('[DEBT-FREE] No debt-free date calculated - lastDebtPaidOffDate was null');
        // Fallback if no debt-free date calculated
        monthsUntilDebtFree = strategySimulation.monthsToFreedom;
        daysUntilDebtFree = Math.round(strategySimulation.monthsToFreedom * 30.44);
      }

      projectedTotalInterestStrategy = strategySimulation.totalInterestPaid;
      projectedTotalInterestMinimum = minimumSimulation.totalInterestPaid;
      interestSaved = minimumSimulation.totalInterestPaid - strategySimulation.totalInterestPaid;
    }

    // Payment streak (placeholder - would need payment history)
    const paymentStreak = 0;

    // Match frontend schema exactly
    const stats = {
      // Debt Overview
      totalDebtBalance: Math.round(totalDebt * 100) / 100,
      totalMonthlyPayment: Math.round(totalMinimumPayment * 100) / 100,
      debtsKilled: paidOffDebts.length,
      totalDebts: debts.length,

      // Progress Metrics
      debtFreeDate,
      daysUntilDebtFree,
      monthsUntilDebtFree,

      // Freedom Bar Data
      interestSaved: Math.round(interestSaved * 100) / 100,
      projectedTotalInterestMinimum: Math.round(projectedTotalInterestMinimum * 100) / 100,
      projectedTotalInterestStrategy: Math.round(projectedTotalInterestStrategy * 100) / 100,

      // Streak & Activity
      paymentStreak,
      lastPaymentDate: null as string | null,

      // Current Strategy
      selectedStrategy: selectedStrategy,
      monthlyDebtBudget: Math.round(monthlyDebtBudget * 100) / 100,

      // Alerts
      section129Active: section129Debts.length > 0,
      section129DebtCount: section129Debts.length,
      inDuplumWarnings: inDuplumWarningDebts.length + inDuplumBreachedDebts.length,
    };

    console.log("[DASHBOARD] Dashboard stats calculated successfully");

    return createSuccessResponse({ stats }, 200, event);
  } catch (error) {
    console.error("[ERROR] Error getting dashboard stats:", error);

    if (error instanceof Error) {
      return createErrorResponse(500, error.message, undefined, event);
    }

    return createErrorResponse(
      500,
      "Internal server error while getting dashboard stats",
      undefined,
      event
    );
  }
};

export const handler = withCorsWrapper(baseHandler);
