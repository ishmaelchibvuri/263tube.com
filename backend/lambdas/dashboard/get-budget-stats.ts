import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DebtDatabaseHelpers } from "../../lib/debt-database";
import {
  calculateTotalIncome,
  calculateFixedObligations,
  calculateVariableExpenses,
} from "../../lib/budget-calculations";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { withCorsWrapper } from "../../lib/cors-wrapper";

type BudgetHealthStatus = 'HEALTHY' | 'TIGHT' | 'DEFICIT';

interface MonthlyHistoryItem {
  month: string;
  income: number;
  expenses: number;
}

interface BudgetDashboardStats {
  totalIncome: number;
  totalFixedObligations: number;
  totalVariableExpenses: number;
  availableBalance: number;
  healthStatus: BudgetHealthStatus;
  healthPercentage: number;
  monthlyHistory: MonthlyHistoryItem[];
  currentMonth: string;
  budgetExists: boolean;
}

/**
 * Determine budget health status based on available balance percentage
 */
function getHealthStatus(availableBalance: number, totalIncome: number): BudgetHealthStatus {
  if (totalIncome === 0) return 'DEFICIT';

  const percentageLeft = (availableBalance / totalIncome) * 100;

  if (percentageLeft < 0) return 'DEFICIT';
  if (percentageLeft < 10) return 'TIGHT';
  return 'HEALTHY';
}

/**
 * GET /dashboard/budget-stats
 * Get budget-focused dashboard statistics
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

    // Get month from query params or default to current month
    const queryMonth = event.queryStringParameters?.month;
    const now = new Date();
    const currentMonth = queryMonth && /^\d{4}-\d{2}$/.test(queryMonth)
      ? queryMonth
      : now.toISOString().slice(0, 7);

    console.log("[BUDGET-STATS] Fetching budget stats for user:", userId, "month:", currentMonth);

    // Get the requested month's budget
    const budget = await DebtDatabaseHelpers.getUserBudget(userId, currentMonth);

    // If no budget exists, return empty state
    if (!budget) {
      console.log("[BUDGET-STATS] No budget found for user");
      const emptyStats: BudgetDashboardStats = {
        totalIncome: 0,
        totalFixedObligations: 0,
        totalVariableExpenses: 0,
        availableBalance: 0,
        healthStatus: 'DEFICIT',
        healthPercentage: 0,
        monthlyHistory: [],
        currentMonth,
        budgetExists: false,
      };
      return createSuccessResponse({ stats: emptyStats }, 200, event);
    }

    // Calculate budget totals
    const totalIncome = calculateTotalIncome(budget);
    const totalFixedObligations = calculateFixedObligations(budget);
    const totalVariableExpenses = calculateVariableExpenses(budget);
    const availableBalance = totalIncome - totalFixedObligations - totalVariableExpenses;

    // Calculate health metrics
    const healthStatus = getHealthStatus(availableBalance, totalIncome);
    const healthPercentage = totalIncome > 0
      ? Math.round((availableBalance / totalIncome) * 1000) / 10
      : 0;

    // Get monthly history (last 6 months)
    const monthlyHistory: MonthlyHistoryItem[] = [];
    for (let i = 5; i >= 0; i--) {
      const historyDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const historyMonth = historyDate.toISOString().slice(0, 7);

      try {
        const historyBudget = await DebtDatabaseHelpers.getUserBudget(userId, historyMonth);
        if (historyBudget) {
          const income = calculateTotalIncome(historyBudget);
          const fixed = calculateFixedObligations(historyBudget);
          const variable = calculateVariableExpenses(historyBudget);
          monthlyHistory.push({
            month: historyMonth,
            income: Math.round(income * 100) / 100,
            expenses: Math.round((fixed + variable) * 100) / 100,
          });
        }
      } catch (err) {
        // Skip months with errors
        console.log(`[BUDGET-STATS] Could not fetch budget for ${historyMonth}:`, err);
      }
    }

    const stats: BudgetDashboardStats = {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalFixedObligations: Math.round(totalFixedObligations * 100) / 100,
      totalVariableExpenses: Math.round(totalVariableExpenses * 100) / 100,
      availableBalance: Math.round(availableBalance * 100) / 100,
      healthStatus,
      healthPercentage,
      monthlyHistory,
      currentMonth,
      budgetExists: true,
    };

    console.log("[BUDGET-STATS] Budget stats calculated successfully:", {
      totalIncome: stats.totalIncome,
      totalExpenses: stats.totalFixedObligations + stats.totalVariableExpenses,
      availableBalance: stats.availableBalance,
      healthStatus: stats.healthStatus,
    });

    return createSuccessResponse({ stats }, 200, event);
  } catch (error) {
    console.error("[ERROR] Error getting budget stats:", error);

    if (error instanceof Error) {
      return createErrorResponse(500, error.message, undefined, event);
    }

    return createErrorResponse(
      500,
      "Internal server error while getting budget stats",
      undefined,
      event
    );
  }
};

export const handler = withCorsWrapper(baseHandler);
