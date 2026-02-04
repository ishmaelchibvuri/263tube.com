/**
 * Centralized Analytics & Event Tracking
 *
 * This file contains all PostHog event tracking for marketing intelligence,
 * user behavior analysis, and conversion optimization.
 */

import posthog from 'posthog-js';

// ============================================================================
// USER PROPERTIES & IDENTIFICATION
// ============================================================================

export const identifyUser = (user: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  totalPurchases?: number;
  totalSpent?: number;
}) => {
  posthog.identify(user.userId, {
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    created_at: user.createdAt,
    subscription_tier: user.subscriptionTier || 'free',
    subscription_status: user.subscriptionStatus || 'none',
    total_purchases: user.totalPurchases || 0,
    total_spent: user.totalSpent || 0,
  });
};

export const updateUserProperties = (properties: Record<string, any>) => {
  posthog.setPersonProperties(properties);
};

// ============================================================================
// AUTHENTICATION EVENTS
// ============================================================================

export const trackSignUp = (method: string, userRole?: string) => {
  posthog.capture('user_signed_up', {
    signup_method: method, // 'email', 'google', etc.
    user_role: userRole,
    signup_timestamp: new Date().toISOString(),
  });
};

export const trackLogin = (method: string, userRole?: string, isAdmin?: boolean) => {
  posthog.capture('user_logged_in', {
    login_method: method,
    user_role: userRole,
    is_admin: isAdmin,
    login_timestamp: new Date().toISOString(),
  });
};

export const trackLoginFailed = (errorName: string, errorMessage: string) => {
  posthog.capture('login_failed', {
    error_name: errorName,
    error_message: errorMessage,
  });
};

export const trackLogout = () => {
  posthog.capture('user_logged_out');
  posthog.reset();
};

// ============================================================================
// SIGNUP FUNNEL EVENTS
// ============================================================================

export const trackLandingPageCtaClicked = (ctaType: 'sign_up' | 'create_plan' | 'get_started' | 'go_to_dashboard', location: string) => {
  posthog.capture('landing_page_cta_clicked', {
    cta_type: ctaType,
    location: location, // 'hero', 'nav', 'final_cta'
    timestamp: new Date().toISOString(),
  });
};

export const trackSignupFormSubmitted = (email: string) => {
  posthog.capture('signup_form_submitted', {
    email_domain: email.split('@')[1], // Only capture domain, not full email
    timestamp: new Date().toISOString(),
  });
};

export const trackSignupFailed = (reason: string, errorCode?: string) => {
  posthog.capture('signup_failed', {
    reason: reason,
    error_code: errorCode,
    timestamp: new Date().toISOString(),
  });
};

export const trackSignupSuccess = (userId?: string) => {
  posthog.capture('signup_success', {
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
};

export const trackVerificationCodeSubmitted = () => {
  posthog.capture('verification_code_submitted', {
    timestamp: new Date().toISOString(),
  });
};

export const trackVerificationSuccess = () => {
  posthog.capture('verification_success', {
    timestamp: new Date().toISOString(),
  });
};

export const trackFirstBudgetCreated = (month: string, totalIncome: number, totalExpenses: number) => {
  posthog.capture('first_budget_created', {
    budget_month: month,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// SUBSCRIPTION & PAYMENT EVENTS
// ============================================================================

export const trackViewPricing = (source?: string) => {
  posthog.capture('pricing_page_viewed', {
    source: source || 'direct', // 'navigation', 'banner', 'upgrade_prompt', etc.
    timestamp: new Date().toISOString(),
  });
};

export const trackUpgradeIntention = (tier: string, source: string) => {
  posthog.capture('upgrade_intention', {
    intended_tier: tier,
    source: source, // 'pricing_page', 'feature_gate', 'banner', etc.
    timestamp: new Date().toISOString(),
  });
};

export const trackPaymentInitiated = (tier: string, amount: number, currency: string) => {
  posthog.capture('payment_initiated', {
    tier: tier,
    amount: amount,
    currency: currency,
    timestamp: new Date().toISOString(),
  });
};

export const trackPaymentSuccess = (
  purchaseId: string,
  tier: string,
  amount: number,
  currency: string,
  durationDays: number
) => {
  posthog.capture('payment_success', {
    purchase_id: purchaseId,
    tier: tier,
    amount: amount,
    currency: currency,
    duration_days: durationDays,
    timestamp: new Date().toISOString(),
  });

  // Update user properties
  updateUserProperties({
    subscription_tier: tier,
    subscription_status: 'active',
    last_purchase_date: new Date().toISOString(),
  });
};

export const trackPaymentFailed = (tier: string, errorMessage?: string) => {
  posthog.capture('payment_failed', {
    tier: tier,
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
  });
};

export const trackPaymentCancelled = (tier: string) => {
  posthog.capture('payment_cancelled', {
    tier: tier,
    timestamp: new Date().toISOString(),
  });
};

export const trackSubscriptionViewed = (currentTier: string, status: string) => {
  posthog.capture('subscription_page_viewed', {
    current_tier: currentTier,
    subscription_status: status,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// EXAM & QUIZ EVENTS
// ============================================================================

export const trackExamListViewed = (filters?: {
  category?: string;
  difficulty?: string;
}) => {
  posthog.capture('exam_list_viewed', {
    category_filter: filters?.category,
    difficulty_filter: filters?.difficulty,
    timestamp: new Date().toISOString(),
  });
};

export const trackExamViewed = (examId: string, examTitle: string, difficulty: string) => {
  posthog.capture('exam_viewed', {
    exam_id: examId,
    exam_title: examTitle,
    difficulty: difficulty,
    timestamp: new Date().toISOString(),
  });
};

export const trackExamStarted = (
  examId: string,
  examTitle: string,
  examType: string, // 'full_exam', 'custom_quiz', 'practice'
  difficulty?: string
) => {
  posthog.capture('exam_started', {
    exam_id: examId,
    exam_title: examTitle,
    exam_type: examType,
    difficulty: difficulty,
    timestamp: new Date().toISOString(),
  });
};

export const trackExamCompleted = (
  examId: string,
  examTitle: string,
  score: number,
  percentage: number,
  isPassed: boolean,
  timeTaken: number,
  totalQuestions: number,
  correctAnswers: number
) => {
  posthog.capture('exam_completed', {
    exam_id: examId,
    exam_title: examTitle,
    score: score,
    percentage: percentage,
    is_passed: isPassed,
    time_taken_seconds: timeTaken,
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
    timestamp: new Date().toISOString(),
  });
};

export const trackExamAbandoned = (
  examId: string,
  examTitle: string,
  questionsAnswered: number,
  totalQuestions: number,
  timeSpent: number
) => {
  posthog.capture('exam_abandoned', {
    exam_id: examId,
    exam_title: examTitle,
    questions_answered: questionsAnswered,
    total_questions: totalQuestions,
    time_spent_seconds: timeSpent,
    completion_percentage: (questionsAnswered / totalQuestions) * 100,
    timestamp: new Date().toISOString(),
  });
};

export const trackCustomQuizCreated = (
  quizMode: string,
  numberOfQuestions: number,
  categories: string[],
  mode?: string
) => {
  posthog.capture('custom_quiz_created', {
    quiz_mode: quizMode, // 'all', 'weak_areas', 'bookmarked'
    number_of_questions: numberOfQuestions,
    categories: categories,
    mode: mode, // 'untimed', 'quick_sprint'
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// FEATURE USAGE EVENTS
// ============================================================================

export const trackDashboardViewed = (stats?: {
  totalAttempts?: number;
  averageScore?: number;
  currentStreak?: number;
}) => {
  posthog.capture('dashboard_viewed', {
    total_attempts: stats?.totalAttempts,
    average_score: stats?.averageScore,
    current_streak: stats?.currentStreak,
    timestamp: new Date().toISOString(),
  });
};

export const trackLeaderboardViewed = (timeframe: string, tier?: string) => {
  posthog.capture('leaderboard_viewed', {
    timeframe: timeframe, // 'daily', 'weekly', 'monthly', 'alltime'
    tier_filter: tier,
    timestamp: new Date().toISOString(),
  });
};

export const trackHistoryViewed = (filters?: {
  examId?: string;
  limit?: number;
}) => {
  posthog.capture('history_viewed', {
    exam_filter: filters?.examId,
    limit: filters?.limit,
    timestamp: new Date().toISOString(),
  });
};

export const trackBookmarkAdded = (
  questionId: string,
  examId: string,
  category: string,
  difficulty: string
) => {
  posthog.capture('bookmark_added', {
    question_id: questionId,
    exam_id: examId,
    category: category,
    difficulty: difficulty,
    timestamp: new Date().toISOString(),
  });
};

export const trackBookmarkRemoved = (questionId: string) => {
  posthog.capture('bookmark_removed', {
    question_id: questionId,
    timestamp: new Date().toISOString(),
  });
};

export const trackBookmarksViewed = (totalBookmarks: number, categoryFilter?: string) => {
  posthog.capture('bookmarks_viewed', {
    total_bookmarks: totalBookmarks,
    category_filter: categoryFilter,
    timestamp: new Date().toISOString(),
  });
};

export const trackProfileViewed = () => {
  posthog.capture('profile_viewed', {
    timestamp: new Date().toISOString(),
  });
};

export const trackProfileUpdated = (fieldsUpdated: string[]) => {
  posthog.capture('profile_updated', {
    fields_updated: fieldsUpdated,
    timestamp: new Date().toISOString(),
  });
};

export const trackSettingsViewed = () => {
  posthog.capture('settings_viewed', {
    timestamp: new Date().toISOString(),
  });
};

export const trackCareerKitAccessed = (hasAccess: boolean) => {
  posthog.capture('career_kit_accessed', {
    has_access: hasAccess,
    timestamp: new Date().toISOString(),
  });
};

export const trackCommunityViewed = () => {
  posthog.capture('community_viewed', {
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// REFERRAL EVENTS
// ============================================================================

export const trackReferralPageViewed = (hasReferralCode: boolean) => {
  posthog.capture('referral_page_viewed', {
    has_referral_code: hasReferralCode,
    timestamp: new Date().toISOString(),
  });
};

export const trackReferralCodeGenerated = (referralCode: string) => {
  posthog.capture('referral_code_generated', {
    referral_code: referralCode,
    timestamp: new Date().toISOString(),
  });
};

export const trackReferralCodeShared = (method: string) => {
  posthog.capture('referral_code_shared', {
    share_method: method, // 'copy', 'email', 'social', etc.
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// ENGAGEMENT & RETENTION EVENTS
// ============================================================================

export const trackSessionStart = () => {
  posthog.capture('session_started', {
    timestamp: new Date().toISOString(),
  });
};

export const trackFeatureGateEncountered = (
  feature: string,
  requiredTier: string,
  currentTier: string,
  action: 'blocked' | 'allowed'
) => {
  posthog.capture('feature_gate_encountered', {
    feature: feature,
    required_tier: requiredTier,
    current_tier: currentTier,
    action: action,
    timestamp: new Date().toISOString(),
  });
};

export const trackUpgradePromptShown = (
  location: string,
  requiredTier: string,
  feature: string
) => {
  posthog.capture('upgrade_prompt_shown', {
    location: location,
    required_tier: requiredTier,
    feature: feature,
    timestamp: new Date().toISOString(),
  });
};

export const trackUpgradePromptClicked = (
  location: string,
  requiredTier: string,
  feature: string
) => {
  posthog.capture('upgrade_prompt_clicked', {
    location: location,
    required_tier: requiredTier,
    feature: feature,
    timestamp: new Date().toISOString(),
  });
};

export const trackSearchPerformed = (query: string, resultsCount: number) => {
  posthog.capture('search_performed', {
    query: query,
    results_count: resultsCount,
    timestamp: new Date().toISOString(),
  });
};

export const trackFilterApplied = (filterType: string, filterValue: string) => {
  posthog.capture('filter_applied', {
    filter_type: filterType,
    filter_value: filterValue,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// ERROR & SUPPORT EVENTS
// ============================================================================

export const trackError = (
  errorType: string,
  errorMessage: string,
  location: string,
  metadata?: Record<string, any>
) => {
  posthog.capture('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    location: location,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

export const trackApiError = (
  endpoint: string,
  statusCode: number,
  errorMessage: string
) => {
  posthog.capture('api_error', {
    endpoint: endpoint,
    status_code: statusCode,
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Capture an exception in PostHog with additional context
 * Use this for caught errors that you want to track
 */
export const captureException = (
  error: Error,
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
) => {
  posthog.captureException(error, {
    tags: {
      component: context?.component || 'unknown',
      action: context?.action,
    },
    ...context?.metadata,
  });

  // Also track as regular event for easier querying
  trackError(
    error.name,
    error.message,
    context?.component || 'unknown',
    {
      stack: error.stack,
      ...context?.metadata,
    }
  );
};

// ============================================================================
// ADMIN EVENTS
// ============================================================================

export const trackAdminDashboardViewed = () => {
  posthog.capture('admin_dashboard_viewed', {
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminUsersViewed = (totalUsers: number, filters?: Record<string, any>) => {
  posthog.capture('admin_users_viewed', {
    total_users: totalUsers,
    filters: filters,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminUserAction = (action: string, userId: string, metadata?: Record<string, any>) => {
  posthog.capture('admin_user_action', {
    action: action, // 'view', 'edit', 'delete', 'ban', 'unban', etc.
    user_id: userId,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminQuestionsViewed = (totalQuestions: number, filters?: Record<string, any>) => {
  posthog.capture('admin_questions_viewed', {
    total_questions: totalQuestions,
    filters: filters,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminQuestionAction = (action: string, questionId: string, metadata?: Record<string, any>) => {
  posthog.capture('admin_question_action', {
    action: action, // 'create', 'edit', 'delete', 'approve', 'reject', etc.
    question_id: questionId,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminSubscriptionsViewed = (totalSubscriptions: number, filters?: Record<string, any>) => {
  posthog.capture('admin_subscriptions_viewed', {
    total_subscriptions: totalSubscriptions,
    filters: filters,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminSubscriptionAction = (action: string, subscriptionId: string, metadata?: Record<string, any>) => {
  posthog.capture('admin_subscription_action', {
    action: action, // 'view', 'cancel', 'refund', etc.
    subscription_id: subscriptionId,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminEmailTemplatesViewed = (totalTemplates: number) => {
  posthog.capture('admin_email_templates_viewed', {
    total_templates: totalTemplates,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminEmailTemplateAction = (action: string, templateId: string, metadata?: Record<string, any>) => {
  posthog.capture('admin_email_template_action', {
    action: action, // 'create', 'edit', 'delete', 'preview', 'activate', 'deactivate'
    template_id: templateId,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminAnalyticsViewed = (timeframe?: string, metrics?: string[]) => {
  posthog.capture('admin_analytics_viewed', {
    timeframe: timeframe,
    metrics: metrics,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminSettingsViewed = (section?: string) => {
  posthog.capture('admin_settings_viewed', {
    section: section, // 'general', 'security', 'email', 'payment', etc.
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminSettingsUpdated = (section: string, fieldsUpdated: string[]) => {
  posthog.capture('admin_settings_updated', {
    section: section,
    fields_updated: fieldsUpdated,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminFeaturesViewed = () => {
  posthog.capture('admin_features_viewed', {
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminFeatureToggled = (featureName: string, enabled: boolean, tier?: string) => {
  posthog.capture('admin_feature_toggled', {
    feature_name: featureName,
    enabled: enabled,
    tier: tier,
    timestamp: new Date().toISOString(),
  });
};

export const trackAdminActionPerformed = (
  action: string,
  targetType: string,
  targetId?: string
) => {
  posthog.capture('admin_action_performed', {
    action: action,
    target_type: targetType,
    target_id: targetId,
    timestamp: new Date().toISOString(),
  });
};
