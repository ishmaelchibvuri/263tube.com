/**
 * Enhanced Type Definitions for RE5 Metadata Framework
 *
 * This file contains all type definitions for the metadata-driven
 * question management system, including:
 * - Enhanced question schema with T1-T8 task categories
 * - Legislative references
 * - Psychometric data (P-value, D-value)
 * - JSON import format
 * - Import audit logs
 *
 * @see CODEBASE_ANALYSIS_REPORT.md for implementation details
 */

// ============================================================================
// TASK CATEGORIES & COGNITIVE LEVELS
// ============================================================================

/**
 * RE5 Exam Task Categories (T1-T8)
 */
export type TaskCategory =
  | "T1" // FAIS Act and Subordinate Legislation
  | "T2" // FSP License: Fit & Proper Requirements
  | "T3" // Codes of Conduct
  | "T4" // Record Keeping Requirements
  | "T5" // FIC Act Compliance
  | "T6" // POPIA (Protection of Personal Information Act)
  | "T7" // FAIS Ombud and Complaints Handling
  | "T8"; // CPD (Continuous Professional Development)

/**
 * Full task category labels with descriptions
 */
export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  T1: "T1: FAIS Act and Subordinate Legislation",
  T2: "T2: FSP License: Fit & Proper Requirements",
  T3: "T3: Codes of Conduct",
  T4: "T4: Record Keeping Requirements",
  T5: "T5: FIC Act Compliance",
  T6: "T6: POPIA (Protection of Personal Information Act)",
  T7: "T7: FAIS Ombud and Complaints Handling",
  T8: "T8: CPD (Continuous Professional Development)",
};

/**
 * Strategic weighting for T1-T8 in a 50-question exam
 * Based on RE5 exam specification
 */
export const TASK_CATEGORY_WEIGHTS: Record<TaskCategory, number> = {
  T1: 8, // 16%
  T2: 8, // 16%
  T3: 7, // 14%
  T4: 6, // 12%
  T5: 7, // 14%
  T6: 5, // 10%
  T7: 5, // 10%
  T8: 4, // 8%
};

/**
 * Cognitive levels based on Bloom's Taxonomy
 */
export type CognitiveLevel =
  | "Knowledge (Level 1)"
  | "Comprehension (Level 2)"
  | "Application (Level 3)"
  | "Analysis (Level 4)";

/**
 * Question difficulty classification based on P-value
 */
export type DifficultyClassification =
  | "Too Easy" // P > 0.80
  | "Easy" // 0.70 - 0.80
  | "Optimal" // 0.30 - 0.70
  | "Difficult" // 0.20 - 0.30
  | "Too Difficult"; // P < 0.20

/**
 * Question discrimination quality based on D-value
 */
export type DiscriminationQuality =
  | "Excellent" // D > 0.40
  | "Very Good" // 0.30 - 0.40
  | "Good" // 0.20 - 0.30
  | "Fair" // 0.10 - 0.20
  | "Poor"; // D < 0.10

// ============================================================================
// ENHANCED QUESTION SCHEMA
// ============================================================================

/**
 * Enhanced Question Interface with full metadata support
 *
 * This extends the original Question interface with:
 * - Task Category (T1-T8)
 * - Qualifying Criteria ID (QC_ID)
 * - Legislative Anchor references
 * - Cognitive Level classification
 * - Psychometric data (P-value, D-value)
 * - Multi-category support
 */
export interface EnhancedQuestion {
  // ===== Core Question Data =====
  questionId: string; // UUID
  questionNumber: number;
  questionText: string;
  questionType: "single" | "multiple" | "truefalse";
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  points: number;
  timeLimit: number;

  // ===== Legacy Fields (for backward compatibility) =====
  category?: string; // Deprecated: use categories[] instead
  difficulty?: string; // Deprecated: use difficultyIndex instead

  // ===== Enhanced Metadata Fields =====

  /** Task Category (T1-T8) */
  taskCategory: TaskCategory;

  /** Qualifying Criteria ID (e.g., T1.1.1, T3.2.3) */
  qcId: string;

  /** Legislative reference (e.g., "FAIS Act, Sec 1 (Definitions)") */
  legislativeAnchor: string;

  /** Cognitive level based on Bloom's Taxonomy */
  cognitiveLevel: CognitiveLevel;

  /** Multiple categories for cross-topic questions */
  categories: string[];

  /** Original ID from imported question bank */
  externalReferenceId?: number | string;

  // ===== Psychometric Data =====

  /**
   * Difficulty Index (P-value)
   * Formula: P = (Total Correct Answers) / (Total Attempts)
   * Range: 0.0 - 1.0
   * Higher = Easier question
   */
  difficultyIndex?: number;

  /**
   * Difficulty classification based on P-value
   */
  difficultyClassification?: DifficultyClassification;

  /**
   * Discrimination Index (D-value)
   * Formula: D = (% correct in top 27%) - (% correct in bottom 27%)
   * Range: -1.0 to 1.0
   * Higher = Better discrimination
   * Requires minimum 30 attempts to calculate
   */
  discriminationIndex?: number;

  /**
   * Discrimination quality classification based on D-value
   */
  discriminationQuality?: DiscriminationQuality;

  /** Total times this question has been attempted */
  timesAttempted?: number;

  /** Total times answered correctly */
  timesCorrect?: number;

  /** Average time spent on this question (seconds) */
  avgTimeSeconds?: number;

  /** Skip rate (percentage of times skipped) */
  skipRate?: number;

  // ===== Administrative Fields =====

  /** Whether question is active and available for selection */
  isActive: boolean;

  /** Flag for admin review (poor psychometric properties) */
  flaggedForReview?: boolean;

  /** Reason for flagging */
  flagReason?: string;

  /** When question was created */
  createdAt: string;

  /** When question was last updated */
  updatedAt: string;

  /** Admin user who imported/created this question */
  createdBy?: string;

  /** When psychometric data was last calculated */
  lastReviewedAt?: string;
}

/**
 * Distractor Analysis - tracks which wrong answers are selected
 * Stored as separate entity: QUESTION#{questionId} + DISTRACTOR_ANALYSIS
 */
export interface DistractorAnalysis {
  PK: string; // QUESTION#{questionId}
  SK: string; // DISTRACTOR_ANALYSIS
  questionId: string;

  /** How many times each option was selected */
  selectedOptionA: number;
  selectedOptionB: number;
  selectedOptionC: number;
  selectedOptionD: number;

  /** Times question was skipped */
  skipped: number;

  /** Average time spent on question */
  avgTimeSeconds: number;

  /** Last updated timestamp */
  updatedAt: string;

  entityType: "QUESTION_STATS";
}

// ============================================================================
// JSON IMPORT FORMAT
// ============================================================================

/**
 * Question Bank JSON Import Format
 * Based on sample_questions_bank.json structure
 */
export interface QuestionBankJSON {
  ID: number;
  Task_Category: string; // e.g., "T1: FAIS Act and Subordinate Legislation"
  QC_ID: string; // e.g., "T1.1.1"
  Legislative_Anchor: string; // e.g., "FAIS Act, Sec 1 (Definitions)"
  Cognitive_Level: string; // e.g., "Application (Level 3)"
  Question_Stem: string;
  Option_A: string;
  Option_B: string;
  Option_C: string;
  Option_D: string;
  Correct_Answer: "A" | "B" | "C" | "D";
  Explanation?: string; // Optional explanation
}

/**
 * Validation result for imported questions
 */
export interface QuestionValidationResult {
  isValid: boolean;
  questionId: number | string;
  errors: string[];
  warnings: string[];
}

/**
 * Batch validation summary
 */
export interface ValidationSummary {
  totalQuestions: number;
  validQuestions: number;
  invalidQuestions: number;
  duplicateIds: number[];
  errors: Array<{
    questionId: number | string;
    errors: string[];
  }>;
  warnings: Array<{
    questionId: number | string;
    warnings: string[];
  }>;
  metadataDistribution: {
    byTaskCategory: Record<string, number>;
    byCognitiveLevel: Record<string, number>;
    byQC: Record<string, number>;
  };
}

// ============================================================================
// IMPORT AUDIT LOG
// ============================================================================

/**
 * Import log entry for question bank imports
 * Entity pattern: IMPORT#{timestamp}_{uuid}
 */
export interface ImportLog {
  PK: string; // IMPORT#{timestamp}_{uuid}
  SK: string; // METADATA
  GSI1PK?: string; // ADMIN#{adminUserId}
  GSI1SK?: string; // IMPORT#{timestamp}

  importId: string; // UUID
  filename: string;
  importedBy: string; // Admin user ID
  importTimestamp: string; // ISO timestamp

  /** Total questions in uploaded file */
  questionsCount: number;

  /** Successfully imported questions */
  successfulImports: number;

  /** Failed imports */
  failedImports: number;

  /** Import status */
  status: "pending" | "in_progress" | "completed" | "failed" | "partial";

  /** Validation summary */
  validationSummary?: ValidationSummary;

  /** Error details for failed imports */
  errorLog?: Array<{
    questionId: number | string;
    error: string;
  }>;

  /** Metadata distribution of imported questions */
  taskCategoryDistribution?: Record<TaskCategory, number>;
  cognitiveDistribution?: Record<CognitiveLevel, number>;

  entityType: "IMPORT_LOG";
}

// ============================================================================
// LEGISLATIVE REFERENCES
// ============================================================================

/**
 * Legislative reference entity
 * Entity pattern: LEGISLATION#{referenceCode}
 */
export interface LegislativeReference {
  PK: string; // LEGISLATION#{referenceCode}
  SK: string; // METADATA
  GSI1PK?: string; // ACT#{actName}
  GSI1SK?: string; // SECTION#{sectionNumber}

  /** Unique reference code (e.g., "FAIS_Act_Sec_1") */
  referenceCode: string;

  /** Full display name (e.g., "FAIS Act, Sec 1 (Definitions)") */
  displayName: string;

  /** Act name (e.g., "FAIS Act", "FIC Act", "POPIA") */
  actName: string;

  /** Section number or identifier */
  sectionNumber: string;

  /** Full text of the legislation */
  fullText?: string;

  /** Summary/brief explanation */
  summary: string;

  /** Effective date of this legislation */
  effectiveDate?: string;

  /** Number of questions linked to this reference */
  linkedQuestionCount: number;

  /** URL to official legislation source */
  officialUrl?: string;

  createdAt: string;
  updatedAt: string;

  entityType: "LEGISLATION";
}

/**
 * Reference material/explanation entity
 * Entity pattern: REFERENCE#{referenceId}
 */
export interface ReferenceMaterial {
  PK: string; // REFERENCE#{referenceId}
  SK: string; // METADATA
  GSI1PK?: string; // LEGISLATIVE#{legislativeAnchor}
  GSI1SK?: string; // TYPE#{materialType}
  GSI2PK?: string; // TASK#{taskCategory}
  GSI2SK?: string; // LEVEL#{difficultyLevel}

  referenceId: string; // UUID
  materialType: "EXPLANATION" | "EXAMPLE" | "CASE_STUDY" | "VISUAL_AID";
  title: string;

  /** Main content */
  legislativeBasis?: string;
  practicalApplication?: string;
  keyLearningPoint?: string;
  commonMistakes?: string;

  /** For longer content, store S3 key instead of inline */
  contentS3Key?: string;

  /** For images/diagrams */
  imageUrl?: string;

  /** Metadata */
  legislativeAnchor?: string;
  relatedQcIds: string[];
  taskCategory?: TaskCategory;
  difficultyLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

  createdBy: string;
  createdAt: string;
  updatedAt: string;

  entityType: "REFERENCE_MATERIAL";
}

// ============================================================================
// PERFORMANCE TRACKING (ENHANCED)
// ============================================================================

/**
 * User performance by Task Category
 * Entity pattern: USER#{userId} + PERFORMANCE#TASK#{taskCategory}
 */
export interface TaskPerformance {
  PK: string; // USER#{userId}
  SK: string; // PERFORMANCE#TASK#{taskCategory}
  GSI1PK?: string; // PERFORMANCE#USER#{userId}
  GSI1SK?: string; // WEAKNESS#{paddedWeaknessScore}

  userId: string;
  taskCategory: TaskCategory;

  /** Total attempts across all questions in this task */
  totalAttempts: number;

  /** Correct attempts */
  correctAttempts: number;

  /** Accuracy rate (0-100) */
  accuracyRate: number;

  /** Average time spent per question in this task */
  avgTimeSeconds: number;

  /** When last attempted */
  lastAttemptDate: string;

  /** Breakdown by cognitive level */
  knowledgeLevelAccuracy?: number;
  comprehensionLevelAccuracy?: number;
  applicationLevelAccuracy?: number;
  analysisLevelAccuracy?: number;

  /** Weakness score for prioritization (higher = weaker) */
  weaknessScore: number;

  /** Recommended additional practice count */
  targetPracticeCount: number;

  updatedAt: string;
  entityType: "TASK_PERFORMANCE";
}

/**
 * User performance by QC (Qualifying Criteria)
 * Entity pattern: USER#{userId} + PERFORMANCE#QC#{qcId}
 */
export interface QCPerformance {
  PK: string; // USER#{userId}
  SK: string; // PERFORMANCE#QC#{qcId}

  userId: string;
  taskCategory: TaskCategory;
  qcId: string; // e.g., T1.1.1

  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number; // 0-100

  avgTimeSeconds: number;
  lastAttemptDate: string;

  /** Identified common error pattern */
  commonErrorType?: string;

  /** Weakness score (higher = needs more practice) */
  weaknessScore: number;

  updatedAt: string;
  entityType: "QC_PERFORMANCE";
}

// ============================================================================
// ENHANCED EXAM RESULT
// ============================================================================

/**
 * Enhanced exam result with task-level breakdown
 * Extends original ExamResult
 */
export interface EnhancedExamResult {
  /** Overall score */
  score: number;
  totalPoints: number;
  percentage: number;
  timeTaken: number;
  correctAnswers: number;
  totalQuestions: number;
  isPassed: boolean;

  /** Per-question breakdown */
  breakdown: Array<{
    questionNumber: number;
    questionText: string;
    questionId: string;
    taskCategory: TaskCategory;
    qcId: string;
    cognitiveLevel: CognitiveLevel;
    isCorrect: boolean;
    pointsEarned: number;
    timeTaken: number;
    correctAnswers: string[];
    userAnswers: string[];
    explanation: string;
    legislativeAnchor?: string;
  }>;

  /** Task-level performance in this exam */
  taskPerformance: Record<TaskCategory, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;

  /** Cognitive level performance */
  cognitivePerformance: Record<CognitiveLevel, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;

  /** Time analysis */
  timeAnalysis: {
    avgTimePerQuestion: number;
    fastQuestions: number; // < 1 minute
    optimalQuestions: number; // 1-3 minutes
    slowQuestions: number; // > 3 minutes
  };
}

// ============================================================================
// STUDY PLAN
// ============================================================================

/**
 * Personalized study plan
 * Entity pattern: USER#{userId} + STUDYPLAN#{planId}
 */
export interface StudyPlan {
  PK: string; // USER#{userId}
  SK: string; // STUDYPLAN#{planId}

  planId: string; // UUID
  userId: string;

  /** Plan duration in days */
  durationDays: number;

  /** Target exam date */
  targetExamDate: string;

  /** Daily breakdown */
  dailyPlan: Array<{
    day: number;
    date: string;
    focus: TaskCategory[];
    questionCount: number;
    activities: string[];
    completed: boolean;
  }>;

  /** Progress tracking */
  currentDay: number;
  daysCompleted: number;
  overallProgress: number; // 0-100

  /** Identified weaknesses to address */
  weakAreas: Array<{
    taskCategory: TaskCategory;
    qcIds: string[];
    priority: "critical" | "high" | "medium";
  }>;

  createdAt: string;
  updatedAt: string;
  entityType: "STUDY_PLAN";
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Helper to extract task category code from full label
 * e.g., "T1: FAIS Act..." → "T1"
 */
export function extractTaskCategory(label: string): TaskCategory | null {
  const match = label.match(/^(T[1-8])/);
  return match ? (match[1] as TaskCategory) : null;
}

/**
 * Helper to classify P-value
 */
export function classifyDifficulty(pValue: number): DifficultyClassification {
  if (pValue > 0.80) return "Too Easy";
  if (pValue >= 0.70) return "Easy";
  if (pValue >= 0.30) return "Optimal";
  if (pValue >= 0.20) return "Difficult";
  return "Too Difficult";
}

/**
 * Helper to classify D-value
 */
export function classifyDiscrimination(dValue: number): DiscriminationQuality {
  if (dValue > 0.40) return "Excellent";
  if (dValue >= 0.30) return "Very Good";
  if (dValue >= 0.20) return "Good";
  if (dValue >= 0.10) return "Fair";
  return "Poor";
}

/**
 * Calculate weakness score
 * Higher score = greater weakness = needs more practice
 */
export function calculateWeaknessScore(
  accuracyRate: number,
  daysSinceLastAttempt: number,
  totalAttempts: number
): number {
  const accuracyPenalty = (100 - accuracyRate); // 0-100
  const recencyBonus = daysSinceLastAttempt * 0.5; // Forgetting factor
  const attemptWeight = Math.min(totalAttempts / 10, 1.0); // Confidence in data

  return (accuracyPenalty + recencyBonus) * attemptWeight;
}
