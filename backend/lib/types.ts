/**
 * Shared types for Debt Payoff SA Backend
 * Import and re-export types from frontend for consistency
 */

import { z } from 'zod';

// ============================================================================
// USER TYPES
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
// DEBT TYPES
// ============================================================================

// Debt interface - manual definition for better TypeScript support
export interface Debt {
  debtId: string;
  userId: string;
  creditor: string;
  debtName: string;
  accountNumber?: string;
  originalPrincipal: number;
  openingBalance: number;
  currentBalance: number;
  annualInterestRate: number;
  monthlyServiceFee: number;
  creditLifePremium: number;
  monthlyCreditLifeInsurance: number;
  initiationFeeBalance: number;
  initiationFee: number;
  minimumPayment: number;
  minimumMonthlyPayment?: number;
  paymentDueDay: number;
  section129Received: boolean;
  section129Date?: string | null;
  section129Deadline?: string | null;
  accumulatedInterestAndFees: number;
  inDuplumCapReached: boolean;
  inDuplumStatus: 'none' | 'approaching' | 'reached';
  isPaidOff: boolean;
  agreementDate: string;
  debtType?: 'mortgage' | 'vehicle' | 'unsecured' | 'shortTerm' | 'creditCard' | 'storeCard' | 'personalLoan' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paidOffAt?: string | null;
  isArchived: boolean;
}

// Zod schema for validation
export const debtSchema = z.object({
  debtId: z.string(),
  userId: z.string(),
  creditor: z.string(),
  debtName: z.string(),
  accountNumber: z.string().optional(),
  originalPrincipal: z.number(),
  openingBalance: z.number(),
  currentBalance: z.number(),
  annualInterestRate: z.number(),
  monthlyServiceFee: z.number(),
  creditLifePremium: z.number(),
  monthlyCreditLifeInsurance: z.number(),
  initiationFeeBalance: z.number(),
  initiationFee: z.number(),
  minimumPayment: z.number(),
  minimumMonthlyPayment: z.number().optional(),
  paymentDueDay: z.number().min(1).max(31),
  section129Received: z.boolean(),
  section129Date: z.string().nullable().optional(),
  section129Deadline: z.string().nullable().optional(),
  accumulatedInterestAndFees: z.number(),
  inDuplumCapReached: z.boolean(),
  inDuplumStatus: z.enum(['none', 'approaching', 'reached']),
  isPaidOff: z.boolean(),
  agreementDate: z.string(),
  debtType: z.enum(['mortgage', 'vehicle', 'unsecured', 'shortTerm', 'creditCard', 'storeCard', 'personalLoan', 'other']).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  paidOffAt: z.string().nullable().optional(),
  isArchived: z.boolean(),
});

// ============================================================================
// BUDGET TYPES
// ============================================================================

// Budget Line Item
export interface BudgetLineItem {
  id: string;
  type: 'income' | 'obligation';
  category: string;
  name: string;
  amount: number;
}

// Budget interface - manual definition for better TypeScript support
export interface Budget {
  budgetId: string;
  userId: string;
  month: string;
  netSalary: number;
  primarySalary: number;
  secondaryIncome: number;
  partnerContribution: number;
  grants: number;
  governmentGrants: number;
  housing: number;
  rent: number;
  transport: number;
  utilities: number;
  insurance: number;
  education: number;
  familySupport: number;
  groceries: number;
  personalCare: number;
  health: number;
  medical: number;
  cellphone: number;
  clothing: number;
  household: number;
  entertainment: number;
  other: number;
  customItems?: BudgetLineItem[];
  totalIncome?: number;
  totalFixedObligations?: number;
  totalVariableExpenses?: number;
  debtAttackBudget?: number;
  createdAt: string;
  updatedAt: string;
}

// Zod schema for budget line item
export const budgetLineItemSchema = z.object({
  id: z.string(),
  type: z.enum(['income', 'obligation']),
  category: z.string(),
  name: z.string(),
  amount: z.number(),
});

// Zod schema for validation
export const budgetSchema = z.object({
  budgetId: z.string(),
  userId: z.string(),
  month: z.string(),
  netSalary: z.number(),
  primarySalary: z.number(),
  secondaryIncome: z.number(),
  partnerContribution: z.number(),
  grants: z.number(),
  governmentGrants: z.number(),
  housing: z.number(),
  rent: z.number(),
  transport: z.number(),
  utilities: z.number(),
  insurance: z.number(),
  education: z.number(),
  familySupport: z.number(),
  groceries: z.number(),
  personalCare: z.number(),
  health: z.number(),
  medical: z.number(),
  cellphone: z.number(),
  clothing: z.number(),
  household: z.number(),
  entertainment: z.number(),
  other: z.number(),
  customItems: z.array(budgetLineItemSchema).optional(),
  totalIncome: z.number().optional(),
  totalFixedObligations: z.number().optional(),
  totalVariableExpenses: z.number().optional(),
  debtAttackBudget: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================================
// STRATEGY TYPES
// ============================================================================

export const repaymentStrategySchema = z.enum(['SNOWBALL', 'AVALANCHE', 'SMART_SA']);
export type RepaymentStrategy = z.infer<typeof repaymentStrategySchema>;

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export const dashboardStatsSchema = z.object({
  totalDebtBalance: z.number(),
  totalMonthlyPayment: z.number(),
  debtsKilled: z.number(),
  totalDebts: z.number(),
  debtFreeDate: z.string(),
  daysUntilDebtFree: z.number(),
  monthsUntilDebtFree: z.number(),
  interestSaved: z.number(),
  projectedTotalInterestMinimum: z.number(),
  projectedTotalInterestStrategy: z.number(),
  paymentStreak: z.number(),
  lastPaymentDate: z.string().nullable(),
  selectedStrategy: repaymentStrategySchema,
  monthlyDebtBudget: z.number(),
  section129Active: z.boolean(),
  section129DebtCount: z.number(),
  inDuplumWarnings: z.number(),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export const apiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    data,
    timestamp: z.string(),
  });

export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
  timestamp: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export enum SubscriptionTier {
  GUEST = 'guest',
  FREE = 'free',
  PREMIUM = 'premium',
  PRO = 'pro'
}

// Type alias to allow string literals
export type SubscriptionTierString = 'guest' | 'free' | 'premium' | 'pro';

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  ACTIVE = 'active'
}

export interface UserPurchase {
  purchaseId: string;
  userId: string;
  tier: SubscriptionTier;
  amount: number;
  currency: string;
  status: PurchaseStatus | 'active';
  paymentToken?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  durationDays?: number;
  purchaseDate?: string;
  activatedAt?: string;
  PK?: string;
  SK?: string;
}

export interface DailyUsage {
  userId: string;
  date: string;
  examsStarted: number;
  examsCompleted: number;
  questionsAnswered: number;
  questionsAttempted: number;
  customQuizzesCreated: number;
  lastQuestionAt?: string;
  maxDailyQuestions?: number;
  PK?: string;
  SK?: string;
  TTL?: number;
  entityType?: string;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  expiresAt?: string;
  isActive: boolean;
  features?: string[];
}

export interface AccessCheckResult {
  allowed: boolean;
  hasAccess: boolean;
  reason?: string;
  tier: SubscriptionTier;
  currentTier: SubscriptionTier;
  requiredTier?: SubscriptionTier;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  showOnLeaderboard?: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  showOnLeaderboard?: boolean;
}

export interface UpdatePreferencesRequest {
  emailNotifications?: boolean;
  examReminders?: boolean;
  studyReminders?: boolean;
  showOnLeaderboard?: boolean;
  theme?: string;
}

// ============================================================================
// EXAM TYPES
// ============================================================================

export enum QuizMode {
  STUDY = 'study',
  EXAM = 'exam',
  REVIEW = 'review',
  WEAK_AREAS = 'weak_areas',
  BOOKMARKED = 'bookmarked',
  ALL = 'all'
}

export interface CreateExamRequest {
  examType: string;
  mode: QuizMode;
  title?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  totalTime?: number;
  passingScore?: number;
  questions?: any[];
}

export interface SubmitExamRequest {
  examId: string;
  answers: Record<string, any>;
  timeSpent: number;
  timeTaken?: number;
  updateLeaderboard?: boolean;
  attemptId?: string;
  questionIds?: string[];
  examTitle?: string;
}

export interface ExamTrackingData {
  userId: string;
  examType: string;
  examDate?: string;
  intendedExamDate?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  examPassed?: boolean;
  rewardPending?: boolean;
  careerkitUnlocked?: boolean;
  passedExamDate?: string;
  rewardClaimedDate?: string;
  examDateHistory?: any[];
  createdAt: string;
  updatedAt: string;
  PK?: string;
  SK?: string;
}

export interface SetExamDateRequest {
  examType: string;
  examDate: string;
  intendedExamDate?: string;
}

export interface RescheduleExamRequest {
  examType: string;
  newExamDate: string;
  reason?: string;
}

// ============================================================================
// QUESTION TYPES
// ============================================================================

export interface BookmarkRequest {
  questionId: string;
  bookmarked: boolean;
  examId?: string;
  questionText?: string;
  categories?: string[];
  difficulty?: string;
}

export interface CreateCustomQuizRequest {
  examType: string;
  questionCount: number;
  numberOfQuestions?: number;
  topics?: string[];
  selectedCategories?: string[];
  quizMode?: string;
  mode?: QuizMode;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface CreatePaymentData {
  tier: SubscriptionTier;
  amount: number;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayFastNotification {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  custom_int1?: string;
  custom_int2?: string;
  custom_int3?: string;
  custom_int4?: string;
  custom_int5?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  merchant_id: string;
  signature: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  metric?: string;
  examId?: string;
}

export interface UserHistoryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  examId?: string;
}
