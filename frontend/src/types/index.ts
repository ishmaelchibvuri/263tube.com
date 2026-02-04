import { z } from 'zod';

// ============================================================================
// USER TYPES (Keep existing auth structure)
// ============================================================================

export const userSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  emailVerified: z.boolean().optional(),
  role: z.enum(['user', 'admin']),
  status: z.enum(['verified_free', 'active']).optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
  lastLoginAt: z.string().optional(),
  profilePicture: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

// ============================================================================
// DEBT TYPES (Page 2: My Debts)
// ============================================================================

export const debtSchema = z.object({
  debtId: z.string(),
  userId: z.string(),

  // Basic Info
  creditor: z.string(),
  debtName: z.string(),
  accountNumber: z.string().optional(),

  // Principal Amounts
  originalPrincipal: z.number(), // Amount originally borrowed
  openingBalance: z.number(), // Balance when agreement started
  currentBalance: z.number(), // Current outstanding amount

  // Interest & Rates
  annualInterestRate: z.number(), // Annual percentage rate

  // Fees & Insurance
  monthlyServiceFee: z.number().default(0),
  creditLifePremium: z.number().default(0), // Monthly premium
  initiationFeeBalance: z.number().default(0),

  // Payment Terms
  minimumPayment: z.number(),
  paymentDueDay: z.number().min(1).max(31),

  // Section 129 Tracking (Legal notices)
  section129Received: z.boolean().default(false),
  section129Date: z.string().nullable().optional(),
  section129Deadline: z.string().nullable().optional(), // Auto-calculated: +10 business days

  // In Duplum Tracking (NCA Section 103(5))
  accumulatedInterestAndFees: z.number().default(0), // Running total since inception
  inDuplumCapReached: z.boolean().default(false),

  // Agreement Details
  agreementDate: z.string(), // When credit agreement was signed
  debtType: z.enum(['mortgage', 'vehicle', 'unsecured', 'shortTerm', 'creditCard', 'storeCard', 'personalLoan', 'other']).optional(),

  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
  paidOffAt: z.string().nullable().optional(),
  isArchived: z.boolean().default(false),
});

export type Debt = z.infer<typeof debtSchema>;

export const debtStatusSchema = z.enum([
  'on_track',
  'in_duplum_zone', // Approaching 85-100% of In Duplum cap
  'section_129_active', // Legal notice received
  'paid_off',
  'archived',
]);

export type DebtStatus = z.infer<typeof debtStatusSchema>;

// ============================================================================
// BUDGET TYPES (Page 4: Family & Life Budget)
// ============================================================================

export const budgetLineItemSchema = z.object({
  id: z.string(),
  type: z.enum(['income', 'obligation']),
  category: z.enum(['netSalary', 'secondaryIncome', 'partnerContribution', 'grants', 'housing', 'transport', 'utilities', 'insurance', 'education', 'familySupport', 'subscriptions', 'childcare', 'medicalAid', 'security', 'savings', 'loans', 'communication', 'groceries', 'personalCare', 'health', 'entertainment', 'other']),
  name: z.string(),
  amount: z.number(),
});

export type BudgetLineItem = z.infer<typeof budgetLineItemSchema>;

export const budgetSchema = z.object({
  budgetId: z.string(),
  userId: z.string(),
  month: z.string(), // Format: "YYYY-MM" (e.g., "2025-01" for January 2025)

  // Income
  netSalary: z.number().default(0),
  secondaryIncome: z.number().default(0),
  partnerContribution: z.number().default(0),
  grants: z.number().default(0), // SASSA, child support, etc.

  // Fixed Obligations (Cannot be reduced)
  housing: z.number().default(0), // Rent, bond, levies
  transport: z.number().default(0), // Petrol, taxi, car payment
  utilities: z.number().default(0), // Electricity, water, WiFi/data
  insurance: z.number().default(0), // Car, household, funeral cover
  education: z.number().default(0), // School fees, uniforms, transport
  familySupport: z.number().default(0), // BLACK TAX - Protected category, never suggested for reduction

  // Variable Expenses
  groceries: z.number().default(0),
  personalCare: z.number().default(0),
  health: z.number().default(0), // Medical, pharmacy
  entertainment: z.number().default(0),
  other: z.number().default(0),

  // Custom line items
  customItems: z.array(budgetLineItemSchema).optional().default([]),

  // Calculated Fields (computed, not stored)
  totalIncome: z.number().optional(),
  totalFixedObligations: z.number().optional(),
  totalVariableExpenses: z.number().optional(),
  debtAttackBudget: z.number().optional(), // Amount available for debt repayment

  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Budget = z.infer<typeof budgetSchema>;

export const budgetViabilitySchema = z.object({
  status: z.enum(['DEFICIT', 'BELOW_MINIMUM', 'TIGHT', 'HEALTHY']),
  shortfall: z.number().optional(),
  surplus: z.number().optional(),
  recommendation: z.string(),
  message: z.string(),
});

export type BudgetViability = z.infer<typeof budgetViabilitySchema>;

// ============================================================================
// STRATEGY TYPES (Page 3: Strategy Hub)
// ============================================================================

export const repaymentStrategySchema = z.enum([
  'SNOWBALL', // Smallest balance first
  'AVALANCHE', // Highest interest first
  'SMART_SA', // SA-specific: prioritizes Section 129, optimizes In Duplum
]);

export type RepaymentStrategy = z.infer<typeof repaymentStrategySchema>;

export const debtPrioritySchema = z.enum([
  'LEGAL', // Section 129 active
  'STRATEGY', // Per user's chosen strategy
  'IN_DUPLUM_WATCH', // Approaching In Duplum cap
]);

export type DebtPriority = z.infer<typeof debtPrioritySchema>;

export const attackOrderItemSchema = z.object({
  debt: debtSchema,
  priority: debtPrioritySchema,
  order: z.number(), // Position in attack order (1, 2, 3, etc.)
  recommendedAction: z.string().optional(), // e.g., "Pay minimums only - interest capping soon"
});

export type AttackOrderItem = z.infer<typeof attackOrderItemSchema>;

export const strategyOutcomeSchema = z.object({
  strategy: repaymentStrategySchema,
  totalInterestPaid: z.number(),
  monthsToFreedom: z.number(),
  debtFreeDate: z.string(),
  firstDebtClearedMonth: z.number(),
  interestSavedVsMinimum: z.number().optional(),
});

export type StrategyOutcome = z.infer<typeof strategyOutcomeSchema>;

export const userStrategySchema = z.object({
  userId: z.string(),
  selectedStrategy: repaymentStrategySchema,
  monthlyDebtBudget: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserStrategy = z.infer<typeof userStrategySchema>;

// ============================================================================
// IN DUPLUM AUDIT TYPES (Page 5: In Duplum Audit Tool)
// ============================================================================

export const inDuplumStatusSchema = z.enum([
  'COMPLIANT', // < 50% of cap
  'APPROACHING', // 50-85% of cap
  'NEAR_CAP', // 85-99% of cap
  'BREACHED', // > 100% of cap (illegal)
]);

export type InDuplumStatus = z.infer<typeof inDuplumStatusSchema>;

export const inDuplumAuditSchema = z.object({
  auditId: z.string(),
  debtId: z.string(),
  userId: z.string(),
  auditDate: z.string(),

  // Core Values
  originalPrincipal: z.number(),
  inDuplumCap: z.number(), // Equal to originalPrincipal per NCA 103(5)

  // Cost Breakdown
  accumulatedInterest: z.number(),
  accumulatedFees: z.number(),
  accumulatedInsurance: z.number(),
  totalCostsCharged: z.number(),

  // Calculation Results
  capRemaining: z.number(),
  capExceeded: z.boolean(),
  excessAmount: z.number(),
  capPercentageUsed: z.number(),

  // Projections
  estimatedMonthsToCapFromCurrent: z.number().nullable(),

  // Status
  status: inDuplumStatusSchema,

  // Metadata
  createdAt: z.string(),
});

export type InDuplumAudit = z.infer<typeof inDuplumAuditSchema>;

export const letterTypeSchema = z.enum([
  'CAP_REACHED', // Request to stop charging interest
  'CAP_BREACHED', // Demand refund of overcharges
  'REQUEST_BREAKDOWN', // Request itemized cost breakdown
]);

export type LetterType = z.infer<typeof letterTypeSchema>;

export const letterGenerationRequestSchema = z.object({
  auditId: z.string(),
  letterType: letterTypeSchema,
  userDetails: z.object({
    fullName: z.string(),
    idNumber: z.string(),
    address: z.string(),
  }),
});

export type LetterGenerationRequest = z.infer<typeof letterGenerationRequestSchema>;

export const generatedLetterSchema = z.object({
  content: z.string(), // Letter text
  pdfUrl: z.string().optional(),
  wordUrl: z.string().optional(),
});

export type GeneratedLetter = z.infer<typeof generatedLetterSchema>;

// ============================================================================
// PAYMENT TRACKING TYPES
// ============================================================================

export const paymentRecordSchema = z.object({
  paymentId: z.string(),
  userId: z.string(),
  debtId: z.string(),
  amount: z.number(),
  paymentDate: z.string(),

  // Payment Breakdown (per NCA Section 126 order)
  amountToFees: z.number(),
  amountToInterest: z.number(),
  amountToPrincipal: z.number(),

  // Balances After Payment
  balanceAfterPayment: z.number(),
  accumulatedInterestAfter: z.number(),

  // Metadata
  notes: z.string().optional(),
  createdAt: z.string(),
});

export type PaymentRecord = z.infer<typeof paymentRecordSchema>;

// ============================================================================
// DASHBOARD TYPES (Page 1: Financial Dignity Dashboard)
// ============================================================================

export const dashboardStatsSchema = z.object({
  // Debt Overview
  totalDebtBalance: z.number(),
  totalMonthlyPayment: z.number(),
  debtsKilled: z.number(), // Paid off debts
  totalDebts: z.number(),

  // Progress Metrics
  debtFreeDate: z.string().nullable(),
  daysUntilDebtFree: z.number().nullable(),
  monthsUntilDebtFree: z.number().nullable(),

  // Freedom Bar Data
  interestSaved: z.number(), // Saved vs minimum payment scenario
  projectedTotalInterestMinimum: z.number(),
  projectedTotalInterestStrategy: z.number(),

  // Streak & Activity
  paymentStreak: z.number(), // Days of on-time payments
  lastPaymentDate: z.string().nullable(),

  // Current Strategy
  selectedStrategy: repaymentStrategySchema,
  monthlyDebtBudget: z.number(),

  // Alerts
  section129Active: z.boolean(),
  section129DebtCount: z.number(),
  inDuplumWarnings: z.number(),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

export const progressStatusSchema = z.enum([
  'on_track', // Green - meeting payment targets
  'at_risk', // Amber - missed payment or behind schedule
  'behind', // Red - significantly behind
]);

export type ProgressStatus = z.infer<typeof progressStatusSchema>;

// ============================================================================
// BUDGET DASHBOARD TYPES (Simple Budget-Focused Dashboard)
// ============================================================================

export const budgetHealthStatusSchema = z.enum(['HEALTHY', 'TIGHT', 'DEFICIT']);
export type BudgetHealthStatus = z.infer<typeof budgetHealthStatusSchema>;

export const budgetDashboardStatsSchema = z.object({
  totalIncome: z.number(),
  totalFixedObligations: z.number(),
  totalVariableExpenses: z.number(),
  availableBalance: z.number(),
  healthStatus: budgetHealthStatusSchema,
  healthPercentage: z.number(), // % of income remaining after expenses
  monthlyHistory: z.array(z.object({
    month: z.string(),
    income: z.number(),
    expenses: z.number(),
  })),
  currentMonth: z.string(),
  budgetExists: z.boolean(),
});

export type BudgetDashboardStats = z.infer<typeof budgetDashboardStatsSchema>;

// ============================================================================
// SUBSCRIPTION TYPES (Keep for payment/access control)
// ============================================================================

export const subscriptionTierSchema = z.enum(['free', 'pro']);
export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

export const subscriptionInfoSchema = z.object({
  tier: subscriptionTierSchema,
  status: z.enum(['active', 'expired', 'none']),
  expiresAt: z.string().optional(),
  daysRemaining: z.number().optional(),
  features: z.array(z.string()),
});

export type SubscriptionInfo = z.infer<typeof subscriptionInfoSchema>;

export const userAccessSchema = z.object({
  subscription: subscriptionInfoSchema,
  debtsLimit: z.number().nullable(), // Max debts for free tier
  expiringSoon: z.boolean(),
});

export type UserAccess = z.infer<typeof userAccessSchema>;

// ============================================================================
// SA PUBLIC HOLIDAYS (for Section 129 business day calculations)
// ============================================================================

export const saPublicHolidaySchema = z.object({
  date: z.string(), // ISO date format
  name: z.string(),
  type: z.enum(['fixed', 'moveable']),
});

export type SAPublicHoliday = z.infer<typeof saPublicHolidaySchema>;

// SA Public Holidays 2025 (will need annual updates)
export const SA_PUBLIC_HOLIDAYS_2025: SAPublicHoliday[] = [
  { date: '2025-01-01', name: "New Year's Day", type: 'fixed' },
  { date: '2025-03-21', name: 'Human Rights Day', type: 'fixed' },
  { date: '2025-04-18', name: 'Good Friday', type: 'moveable' },
  { date: '2025-04-21', name: 'Family Day', type: 'moveable' },
  { date: '2025-04-27', name: 'Freedom Day', type: 'fixed' },
  { date: '2025-05-01', name: "Workers' Day", type: 'fixed' },
  { date: '2025-06-16', name: 'Youth Day', type: 'fixed' },
  { date: '2025-08-09', name: "National Women's Day", type: 'fixed' },
  { date: '2025-09-24', name: 'Heritage Day', type: 'fixed' },
  { date: '2025-12-16', name: 'Day of Reconciliation', type: 'fixed' },
  { date: '2025-12-25', name: 'Christmas Day', type: 'fixed' },
  { date: '2025-12-26', name: 'Day of Goodwill', type: 'fixed' },
];

// ============================================================================
// NCA COMPLIANCE TYPES
// ============================================================================

export const ncaRateCapsSchema = z.object({
  mortgage: z.number(), // repoRate + 12
  vehicle: z.number(), // repoRate + 15
  unsecured: z.number(), // repoRate + 19.25 (max 27.25% as of 2024)
  shortTerm: z.number(), // 5% per month (60% p.a.)
  currentRepoRate: z.number(),
  lastUpdated: z.string(),
});

export type NCARateCaps = z.infer<typeof ncaRateCapsSchema>;

// Current NCA rate caps (as of 2024, repo rate ~8%)
export const CURRENT_NCA_CAPS: NCARateCaps = {
  mortgage: 20.0,
  vehicle: 23.0,
  unsecured: 27.25,
  shortTerm: 60.0,
  currentRepoRate: 8.0,
  lastUpdated: '2024-01-01',
};

export const rateValidationResultSchema = z.object({
  valid: z.boolean(),
  warning: z.string().optional(),
  maxAllowedRate: z.number(),
  exceedsBy: z.number().optional(),
});

export type RateValidationResult = z.infer<typeof rateValidationResultSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export const apiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    data,
    timestamp: z.string(),
  });

export type ApiResponse<T> = z.infer<ReturnType<typeof apiResponseSchema<z.ZodType<T>>>>;

export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
  timestamp: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// ============================================================================
// CREDITOR LIST (Pre-populated for debt entry)
// ============================================================================

export interface Creditor {
  id: string;
  name: string;
  logo?: string;
  type: 'bank' | 'retailer' | 'microlender' | 'other';
  commonFees?: {
    monthlyServiceFee?: number;
    creditLifePremium?: number;
    typicalInterestRate?: number;
  };
}

// ============================================================================
// RISK PROFILE TYPES (Upsell Intelligence)
// ============================================================================

export const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const upsellStatusSchema = z.enum(['NONE', 'NUDGE', 'TARGET', 'CRITICAL']);
export type UpsellStatus = z.infer<typeof upsellStatusSchema>;

export const userRiskProfileSchema = z.object({
  userId: z.string(),
  upsellStatus: upsellStatusSchema,
  riskScore: z.number().min(0).max(100),
  riskLevel: riskLevelSchema,
  dtiRatio: z.number(), // Debt-to-Income ratio as percentage
  debtVelocity: z.number(), // Monthly debt change rate as percentage
  distressEvents: z.array(z.string()).optional(), // Keywords found: "Dishonour", "Arrears", etc.
  lastAssessedAt: z.string(),
  updatedAt: z.string(),
});

export type UserRiskProfile = z.infer<typeof userRiskProfileSchema>;

export const monthlySummarySchema = z.object({
  month: z.string(), // Format: "YYYY-MM"
  totalIncome: z.number(),
  totalDebt: z.number(),
  dtiRatio: z.number(),
  debtVelocity: z.number(),
  interestPaid: z.number().optional(),
  principalPaid: z.number().optional(),
});

export type MonthlySummary = z.infer<typeof monthlySummarySchema>;

// ============================================================================
// ALERT TYPES (User Notifications)
// ============================================================================

export const alertSeveritySchema = z.enum(['INFO', 'WARNING', 'CRITICAL']);
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;

export const userAlertSchema = z.object({
  alertId: z.string(),
  userId: z.string(),
  severity: alertSeveritySchema,
  title: z.string(),
  message: z.string(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  isRead: z.boolean().default(false),
  createdAt: z.string(),
  expiresAt: z.string().optional(),
});

export type UserAlert = z.infer<typeof userAlertSchema>;

// ============================================================================
// POPIA CONSENT TYPES
// ============================================================================

export const consentPurposeSchema = z.enum([
  'DATA_SHARING_DEBT_COUNSELLOR', // Share data with Debt Payoff SA
  'MARKETING_COMMUNICATIONS', // Receive marketing emails
  'ANALYTICS_TRACKING', // Allow usage analytics
  'PARTNER_REFERRAL', // Allow referral to financial partners
]);

export type ConsentPurpose = z.infer<typeof consentPurposeSchema>;

export const popiaConsentSchema = z.object({
  consentId: z.string(),
  userId: z.string(),
  purpose: consentPurposeSchema,
  granted: z.boolean(),
  grantedAt: z.string().nullable(),
  revokedAt: z.string().nullable().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  dataShared: z.array(z.string()).optional(), // List of data fields consented to share
});

export type PopiaConsent = z.infer<typeof popiaConsentSchema>;

// ============================================================================
// PARTNER LEAD TYPES (Debt Payoff SA Integration)
// ============================================================================

export const partnerLeadSchema = z.object({
  leadId: z.string(),
  userId: z.string(),
  partnerCode: z.string().default('DEBT_PAYOFF_SA'),
  status: z.enum(['PENDING', 'SUBMITTED', 'CONTACTED', 'CONVERTED', 'DECLINED']),
  consentId: z.string(), // Reference to POPIA consent
  sharedData: z.object({
    fullName: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    totalDebtBalance: z.number(),
    dtiRatio: z.number(),
    debtCount: z.number(),
  }),
  submittedAt: z.string(),
  updatedAt: z.string(),
});

export type PartnerLead = z.infer<typeof partnerLeadSchema>;

// ============================================================================
// CREDITOR LIST (Pre-populated for debt entry)
// ============================================================================

export const SA_MAJOR_CREDITORS: Creditor[] = [
  // Banks
  { id: 'absa', name: 'Absa', type: 'bank' },
  { id: 'capitec', name: 'Capitec Bank', type: 'bank' },
  { id: 'fnb', name: 'FNB (First National Bank)', type: 'bank' },
  { id: 'nedbank', name: 'Nedbank', type: 'bank' },
  { id: 'standard_bank', name: 'Standard Bank', type: 'bank' },
  { id: 'african_bank', name: 'African Bank', type: 'bank' },
  { id: 'discovery_bank', name: 'Discovery Bank', type: 'bank' },
  { id: 'tyme_bank', name: 'TymeBank', type: 'bank' },

  // Retailers
  { id: 'woolworths', name: 'Woolworths Store Card', type: 'retailer', commonFees: { monthlyServiceFee: 69 } },
  { id: 'mr_price', name: 'Mr Price Store Card', type: 'retailer', commonFees: { monthlyServiceFee: 50 } },
  { id: 'edgars', name: 'Edgars Store Card', type: 'retailer', commonFees: { monthlyServiceFee: 59 } },
  { id: 'jet', name: 'Jet Store Card', type: 'retailer', commonFees: { monthlyServiceFee: 50 } },
  { id: 'truworths', name: 'Truworths Store Card', type: 'retailer', commonFees: { monthlyServiceFee: 65 } },

  // Microlenders
  { id: 'bayport', name: 'Bayport', type: 'microlender' },
  { id: 'mzansi', name: 'Mzansi Loans', type: 'microlender' },

  // Other
  { id: 'other', name: 'Other (Custom)', type: 'other' },
];
