/**
 * API Client for Debt Payoff SA
 * Handles all HTTP requests to backend Lambda functions
 */

import { fetchAuthSession } from 'aws-amplify/auth';
import {
  Debt,
  Budget,
  DashboardStats,
  BudgetDashboardStats,
  AttackOrderItem,
  StrategyOutcome,
  RepaymentStrategy,
  InDuplumAudit,
  GeneratedLetter,
  LetterGenerationRequest,
  PaymentRecord,
  UserAccess,
  UserRiskProfile,
  MonthlySummary,
  UserAlert,
  PopiaConsent,
  ConsentPurpose,
  PartnerLead,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.quickbudget.co.za';

/**
 * Get auth token from Cognito session
 */
async function getAuthToken(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) {
      throw new Error('No auth token available');
    }
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw new Error('Authentication required');
  }
}

/**
 * Generic API request wrapper
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const json = await response.json();
  // Backend wraps responses in { success, data, timestamp }
  // Extract the data property if it exists
  return json.data !== undefined ? json.data : json;
}

// ============================================================================
// DEBT OPERATIONS (Page 2: My Debts)
// ============================================================================

export const debtApi = {
  /**
   * Get all debts for current user
   */
  async getDebts(): Promise<Debt[]> {
    const response = await apiRequest<{ debts: Debt[] }>('/debts');
    return response.debts;
  },

  /**
   * Get a single debt by ID
   */
  async getDebt(debtId: string): Promise<Debt> {
    const response = await apiRequest<{ debt: Debt }>(`/debts/${debtId}`);
    return response.debt;
  },

  /**
   * Create a new debt
   */
  async createDebt(debt: Omit<Debt, 'debtId' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Debt> {
    const response = await apiRequest<{ debt: Debt }>('/debts', {
      method: 'POST',
      body: JSON.stringify(debt),
    });
    return response.debt;
  },

  /**
   * Update an existing debt
   */
  async updateDebt(debtId: string, updates: Partial<Debt>): Promise<Debt> {
    const response = await apiRequest<{ debt: Debt }>(`/debts/${debtId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.debt;
  },

  /**
   * Delete/archive a debt
   */
  async deleteDebt(debtId: string): Promise<void> {
    await apiRequest(`/debts/${debtId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Mark a debt as paid off
   */
  async markDebtPaidOff(debtId: string): Promise<Debt> {
    const response = await apiRequest<{ debt: Debt }>(`/debts/${debtId}/pay-off`, {
      method: 'POST',
    });
    return response.debt;
  },

  /**
   * Mark a debt as unpaid (reopen it)
   */
  async markDebtUnpaid(debtId: string, currentBalance: number): Promise<Debt> {
    const response = await apiRequest<{ debt: Debt }>(`/debts/${debtId}/mark-unpaid`, {
      method: 'POST',
      body: JSON.stringify({ currentBalance }),
    });
    return response.debt;
  },
};

// ============================================================================
// BUDGET OPERATIONS (Page 4: Budget)
// ============================================================================

export const budgetApi = {
  /**
   * Get user's budget for a specific month
   */
  async getBudget(month?: string): Promise<Budget> {
    const url = month ? `/budget?month=${month}` : '/budget';
    const response = await apiRequest<{ budget: Budget }>(url);
    return response.budget;
  },

  /**
   * Create or update budget
   */
  async saveBudget(budget: Omit<Budget, 'budgetId' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const response = await apiRequest<{ budget: Budget }>('/budget', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
    return response.budget;
  },

  /**
   * Delete budget for a specific month
   */
  async deleteBudget(month: string): Promise<void> {
    await apiRequest<{ message: string }>(`/budget?month=${month}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get budget history (list of months with budgets)
   */
  async getBudgetHistory(): Promise<{ months: string[] }> {
    const response = await apiRequest<{ months: string[] }>('/budget/history');
    return response;
  },
};

// ============================================================================
// STRATEGY OPERATIONS (Page 3: Strategy Hub)
// ============================================================================

export const strategyApi = {
  /**
   * Get current attack order based on selected strategy
   */
  async getAttackOrder(strategy: RepaymentStrategy): Promise<AttackOrderItem[]> {
    const response = await apiRequest<{ attackOrder: AttackOrderItem[] }>(
      `/strategy/attack-order?strategy=${strategy}`
    );
    return response.attackOrder;
  },

  /**
   * Simulate outcomes for all three strategies
   */
  async simulateStrategies(): Promise<{
    snowball: StrategyOutcome;
    avalanche: StrategyOutcome;
    smartSA: StrategyOutcome;
  }> {
    const response = await apiRequest<{
      snowball: StrategyOutcome;
      avalanche: StrategyOutcome;
      smartSA: StrategyOutcome;
    }>('/strategy/simulate');
    return response;
  },

  /**
   * Set user's preferred strategy
   */
  async setStrategy(strategy: RepaymentStrategy): Promise<void> {
    await apiRequest('/strategy/set', {
      method: 'POST',
      body: JSON.stringify({ strategy }),
    });
  },

  /**
   * Get user's current strategy
   */
  async getStrategy(): Promise<RepaymentStrategy> {
    const response = await apiRequest<{ strategy: RepaymentStrategy }>('/strategy');
    return response.strategy;
  },
};

// ============================================================================
// DASHBOARD OPERATIONS (Page 1: Dashboard)
// ============================================================================

export const dashboardApi = {
  /**
   * Get dashboard statistics (legacy debt-focused)
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiRequest<{ stats: DashboardStats }>('/dashboard/stats');
    return response.stats;
  },

  /**
   * Get budget-focused dashboard stats
   * @param month Optional month in YYYY-MM format. Defaults to current month.
   */
  async getBudgetStats(month?: string): Promise<BudgetDashboardStats> {
    const query = month ? `?month=${month}` : '';
    const response = await apiRequest<{ stats: BudgetDashboardStats }>(`/dashboard/budget-stats${query}`);
    return response.stats;
  },
};

// ============================================================================
// IN DUPLUM AUDIT OPERATIONS (Page 5: Audit Tool)
// ============================================================================

export const auditApi = {
  /**
   * Perform In Duplum audit on a debt
   */
  async auditDebt(debtId: string): Promise<InDuplumAudit> {
    const response = await apiRequest<{ audit: InDuplumAudit }>(`/audit/${debtId}`);
    return response.audit;
  },

  /**
   * Audit all debts
   */
  async auditAllDebts(): Promise<InDuplumAudit[]> {
    const response = await apiRequest<{ audits: InDuplumAudit[] }>('/audit/all');
    return response.audits;
  },

  /**
   * Generate dispute letter
   */
  async generateLetter(request: LetterGenerationRequest): Promise<GeneratedLetter> {
    const response = await apiRequest<{ letter: GeneratedLetter }>('/audit/generate-letter', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.letter;
  },
};

// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

export const paymentApi = {
  /**
   * Log a payment
   */
  async logPayment(
    debtId: string,
    amount: number,
    paymentDate: string,
    options?: {
      notes?: string;
      paymentType?: 'minimum' | 'extra' | 'manual' | 'auto';
      paymentSource?: 'strategy_allocation' | 'manual_entry' | 'auto_minimum';
    }
  ): Promise<PaymentRecord> {
    const response = await apiRequest<{ payment: PaymentRecord }>('/payments', {
      method: 'POST',
      body: JSON.stringify({
        debtId,
        amount,
        paymentDate,
        notes: options?.notes,
        paymentType: options?.paymentType,
        paymentSource: options?.paymentSource,
      }),
    });
    return response.payment;
  },

  /**
   * Update a payment
   */
  async updatePayment(
    paymentId: string,
    debtId: string,
    paymentDate: string,
    updates: {
      amount?: number;
      notes?: string;
      paymentType?: 'minimum' | 'extra' | 'manual' | 'auto';
      paymentSource?: 'strategy_allocation' | 'manual_entry' | 'auto_minimum';
    }
  ): Promise<PaymentRecord> {
    const response = await apiRequest<{ payment: PaymentRecord }>(
      `/payments/${paymentId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ debtId, paymentDate, ...updates }),
      }
    );
    return response.payment;
  },

  /**
   * Delete a payment
   */
  async deletePayment(
    paymentId: string,
    debtId: string,
    paymentDate: string
  ): Promise<{ newBalance: number }> {
    const response = await apiRequest<{ newBalance: number }>(
      `/payments/item/${paymentId}?debtId=${debtId}&paymentDate=${paymentDate}`,
      {
        method: 'DELETE',
      }
    );
    return response;
  },

  /**
   * Get payment history for a debt
   */
  async getPaymentHistory(debtId: string): Promise<PaymentRecord[]> {
    const response = await apiRequest<{ payments: PaymentRecord[] }>(
      `/payments/${debtId}`
    );
    return response.payments;
  },

  /**
   * Get all payments for user
   */
  async getAllPayments(): Promise<PaymentRecord[]> {
    const response = await apiRequest<{ payments: PaymentRecord[] }>('/payments');
    return response.payments;
  },
};

// ============================================================================
// USER ACCESS (Subscription/Tier Management)
// ============================================================================

export interface SubscriptionAccess {
  tier: 'free' | 'pro';
  status: 'active' | 'expired' | 'cancelled';
  expiresAt?: string;
  features: string[];
}

export const accessApi = {
  /**
   * Get user's subscription access level
   */
  async getUserAccess(): Promise<SubscriptionAccess> {
    const response = await apiRequest<{ subscription: SubscriptionAccess }>('/user/access');
    return response.subscription;
  },

  /**
   * Create payment for Pro subscription
   */
  async createPayment(returnUrl?: string, cancelUrl?: string): Promise<{ paymentUrl: string }> {
    const response = await apiRequest<{ paymentUrl: string }>('/payment/create', {
      method: 'POST',
      body: JSON.stringify({ tier: 'pro', returnUrl, cancelUrl }),
    });
    return response;
  },
};

// ============================================================================
// RISK PROFILE OPERATIONS (Upsell Intelligence)
// ============================================================================

export const riskProfileApi = {
  /**
   * Get user's current risk profile
   * TODO: Backend endpoint /risk/profile not yet implemented
   */
  async getRiskProfile(): Promise<UserRiskProfile> {
    // Stub: endpoint not yet implemented in backend
    throw new Error('Risk profile endpoint not available');
  },

  /**
   * Get monthly summaries for trend analysis (last N months)
   * TODO: Backend endpoint /risk/summaries not yet implemented
   */
  async getMonthlySummaries(months: number = 6): Promise<MonthlySummary[]> {
    // Stub: endpoint not yet implemented in backend
    throw new Error('Monthly summaries endpoint not available');
  },

  /**
   * Recalculate risk profile (triggers backend analysis)
   * TODO: Backend endpoint /risk/recalculate not yet implemented
   */
  async recalculateRisk(): Promise<UserRiskProfile> {
    // Stub: endpoint not yet implemented in backend
    throw new Error('Risk recalculate endpoint not available');
  },
};

// ============================================================================
// ALERT OPERATIONS (User Notifications)
// ============================================================================

export const alertApi = {
  /**
   * Get all active alerts for user
   */
  async getAlerts(includeRead: boolean = false): Promise<UserAlert[]> {
    const response = await apiRequest<{ alerts: UserAlert[] }>(
      `/alerts?includeRead=${includeRead}`
    );
    return response.alerts;
  },

  /**
   * Mark an alert as read
   */
  async markAsRead(alertId: string): Promise<void> {
    await apiRequest(`/alerts/${alertId}/read`, {
      method: 'POST',
    });
  },

  /**
   * Dismiss an alert
   */
  async dismissAlert(alertId: string): Promise<void> {
    await apiRequest(`/alerts/${alertId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// POPIA CONSENT OPERATIONS
// ============================================================================

export const consentApi = {
  /**
   * Get all consent records for user
   */
  async getConsents(): Promise<PopiaConsent[]> {
    const response = await apiRequest<{ consents: PopiaConsent[] }>('/consent');
    return response.consents;
  },

  /**
   * Get consent status for a specific purpose
   */
  async getConsentByPurpose(purpose: ConsentPurpose): Promise<PopiaConsent | null> {
    try {
      const response = await apiRequest<{ consent: PopiaConsent }>(
        `/consent/${purpose}`
      );
      return response.consent;
    } catch {
      return null;
    }
  },

  /**
   * Grant consent for a specific purpose (POPIA compliant)
   */
  async grantConsent(
    purpose: ConsentPurpose,
    dataShared?: string[]
  ): Promise<PopiaConsent> {
    const response = await apiRequest<{ consent: PopiaConsent }>(`/consent/${purpose}`, {
      method: 'POST',
      body: JSON.stringify({ dataShared }),
    });
    return response.consent;
  },

  /**
   * Revoke consent for a specific purpose
   */
  async revokeConsent(purpose: ConsentPurpose): Promise<void> {
    await apiRequest(`/consent/${purpose}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// PARTNER API OPERATIONS (Debt Payoff SA Integration)
// ============================================================================

export const partnerApi = {
  /**
   * Submit lead to partner (Debt Payoff SA)
   * Requires prior POPIA consent
   */
  async submitLead(data: {
    fullName: string;
    email: string;
    phone?: string;
    consentId: string;
  }): Promise<PartnerLead> {
    const response = await apiRequest<{ lead: PartnerLead }>('/partner/submit-lead', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.lead;
  },

  /**
   * Get status of submitted lead
   */
  async getLeadStatus(leadId: string): Promise<PartnerLead> {
    const response = await apiRequest<{ lead: PartnerLead }>(`/partner/lead/${leadId}`);
    return response.lead;
  },

  /**
   * Get all leads for user
   */
  async getLeads(): Promise<PartnerLead[]> {
    const response = await apiRequest<{ leads: PartnerLead[] }>('/partner/leads');
    return response.leads;
  },
};

// Export all APIs as a single object
export const api = {
  debts: debtApi,
  budget: budgetApi,
  strategy: strategyApi,
  dashboard: dashboardApi,
  audit: auditApi,
  payments: paymentApi,
  access: accessApi,
  riskProfile: riskProfileApi,
  alerts: alertApi,
  consent: consentApi,
  partner: partnerApi,
};
