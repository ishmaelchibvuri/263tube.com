/**
 * Budget calculation utilities for backend
 * Port of frontend budget calculation logic
 */

import { Budget } from "./types";

/**
 * Calculate total income from budget
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
 * Calculate total fixed obligations (including protected Family Support)
 */
export function calculateFixedObligations(budget: Budget | Partial<Budget>): number {
  const fixedCategories = ['housing', 'transport', 'utilities', 'insurance', 'education', 'familySupport'];
  const customFixedTotal = (budget.customItems || [])
    .filter(item => (item.type === 'obligation' || !item.type) && fixedCategories.includes(item.category))
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    (budget.housing || 0) +
    (budget.transport || 0) +
    (budget.utilities || 0) +
    (budget.insurance || 0) +
    (budget.education || 0) +
    (budget.familySupport || 0) +
    customFixedTotal
  );
}

/**
 * Calculate total variable expenses
 */
export function calculateVariableExpenses(budget: Budget | Partial<Budget>): number {
  const variableCategories = ['groceries', 'personalCare', 'health', 'entertainment', 'other'];
  const customVariableTotal = (budget.customItems || [])
    .filter(item => (item.type === 'obligation' || !item.type) && variableCategories.includes(item.category))
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    (budget.groceries || 0) +
    (budget.personalCare || 0) +
    (budget.health || 0) +
    (budget.entertainment || 0) +
    (budget.other || 0) +
    customVariableTotal
  );
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
