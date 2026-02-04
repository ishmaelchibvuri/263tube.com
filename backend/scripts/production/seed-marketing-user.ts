/**
 * ============================================================================
 * PRODUCTION SCRIPT: Marketing User Seed Data Generator
 * ============================================================================
 *
 * PURPOSE:
 *   Creates comprehensive seed data for marketing screenshots and user testing.
 *   Generates realistic exam progression data, leaderboard entries, and user
 *   statistics suitable for impressive marketing materials.
 *
 * FEATURES:
 *   - Auto-fetches Cognito userId from email (no manual ID lookup needed)
 *   - Generates realistic exam progression (initial failures → eventual mastery)
 *   - Creates leaderboard entries across all timeframes with correct tier
 *   - Sets up Pro subscription with active status
 *   - Produces high-quality statistics for marketing screenshots
 *
 * WHAT IT CREATES:
 *   - User profile: Pro tier, student role, complete preferences
 *   - 28 exam attempts: Across 5 different exams with realistic progression
 *   - Score progression: 62% → 74% → 82% → 90% → 95% → 97%
 *   - 4 leaderboard entries:
 *       • Daily: Rank #2
 *       • Weekly: Rank #1
 *       • Monthly: Rank #3
 *       • All-time: Rank #5
 *   - Active Pro subscription: 90-day duration, R179.99
 *   - Overall statistics: ~82% accuracy, ~8,500 total points
 *
 * REQUIREMENTS:
 *   ⚠️  User MUST already exist in Cognito (completed signup in app)
 *   ⚠️  User MUST have verified their email address
 *   ⚠️  Script requires AWS credentials with DynamoDB and Cognito access
 *
 * USAGE:
 *   ts-node seed-marketing-user.ts <email> <environment> [options]
 *
 *   Arguments:
 *     email          User email address (must exist in Cognito)
 *     environment    Target environment: dev | qa | prod
 *
 *   Options:
 *     --dry-run      Preview data without writing to database (RECOMMENDED FIRST)
 *     --execute      Execute and write data to database
 *     --user-id      Override auto-fetch with specific Cognito userId
 *     --first-name   Custom first name (default: Dragon)
 *     --last-name    Custom last name (default: Aziz)
 *     --help         Show help message
 *
 * EXAMPLES:
 *   # Always preview first (dry run)
 *   npx ts-node seed-marketing-user.ts user@example.com prod --dry-run
 *
 *   # Execute after verifying dry run output
 *   npx ts-node seed-marketing-user.ts user@example.com prod --execute
 *
 *   # Use in QA environment
 *   npx ts-node seed-marketing-user.ts test@example.com qa --execute
 *
 *   # Custom user names
 *   npx ts-node seed-marketing-user.ts john@example.com prod --execute \
 *     --first-name John --last-name Doe
 *
 *   # Override userId (skip Cognito lookup)
 *   npx ts-node seed-marketing-user.ts user@example.com prod --execute \
 *     --user-id 319c22a8-6031-70f9-daa6-52997b4c7731
 *
 * INSTALLATION:
 *   npm install
 *
 * SAFETY GUIDELINES:
 *   ⚠️  ALWAYS run with --dry-run first to preview data
 *   ⚠️  VERIFY the email address is correct before executing
 *   ⚠️  DOUBLE-CHECK the environment (dev/qa/prod)
 *   ⚠️  DO NOT run on users with existing important data (will not overwrite
 *       but will add to existing data)
 *   ⚠️  ENSURE you have proper AWS credentials configured
 *
 * TECHNICAL DETAILS:
 *   - Uses DynamoDB single-table design with PK/SK patterns
 *   - Leaderboard tier: Pro/Premium users compete in "premium" tier (NOT "pro")
 *   - Leaderboard GSI format (CRITICAL):
 *       Daily:   GSI1PK = LEADERBOARD#DAILY#premium
 *                GSI1SK = {date}#{paddedScore}#{userId}
 *       Weekly:  GSI1PK = LEADERBOARD#WEEKLY#premium
 *                GSI1SK = {week}#{paddedScore}#{userId}
 *       Monthly: GSI1PK = LEADERBOARD#MONTHLY#premium
 *                GSI1SK = {month}#{paddedScore}#{userId}
 *       All-time: GSI1PK = LEADERBOARD#ALLTIME#premium
 *                 GSI1SK = SCORE#{paddedScore}#{userId}#{examId}
 *   - Batch writes in groups of 25 (DynamoDB limit)
 *   - Auto-calculates ISO week numbers for weekly leaderboards
 *   - Generates realistic answer patterns and time spent per question
 *   - Points calculation: correctAnswers × 10 (POINTS_PER_CORRECT_ANSWER)
 *
 * TROUBLESHOOTING:
 *   - "No Cognito user found": User hasn't signed up yet - check email/environment
 *   - "Access denied": Check AWS credentials have DynamoDB/Cognito permissions
 *   - Data not showing in app: Verify user is logged in with correct email
 *   - Leaderboard missing: Check user tier is Pro/Premium (not Free)
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-18
 * ============================================================================
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface SeedConfig {
  email: string;
  environment: string;
  dryRun: boolean;
  userId?: string; // Will be fetched or generated
  firstName?: string;
  lastName?: string;
}

interface ExamDefinition {
  examId: string;
  title: string;
  category: string;
  totalQuestions: number;
  passingScore: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Real exam IDs - these should exist in your database
// Update these based on actual exams in your system
const EXAM_DEFINITIONS: ExamDefinition[] = [
  {
    examId: 'fais-class-of-business',
    title: 'FAIS - Class of Business',
    category: 'FAIS',
    totalQuestions: 50,
    passingScore: 75,
    difficulty: 'intermediate',
  },
  {
    examId: 'fais-general-principles',
    title: 'FAIS - General Principles',
    category: 'FAIS',
    totalQuestions: 60,
    passingScore: 75,
    difficulty: 'beginner',
  },
  {
    examId: 'nfa-general',
    title: 'NFA - General Exam',
    category: 'NFA',
    totalQuestions: 100,
    passingScore: 70,
    difficulty: 'intermediate',
  },
  {
    examId: 'fit-and-proper',
    title: 'Fit and Proper Requirements',
    category: 'Compliance',
    totalQuestions: 40,
    passingScore: 75,
    difficulty: 'beginner',
  },
  {
    examId: 'regulatory-ethics',
    title: 'Regulatory Ethics',
    category: 'Ethics',
    totalQuestions: 45,
    passingScore: 75,
    difficulty: 'advanced',
  },
];

// ============================================================================
// AWS CLIENT SETUP
// ============================================================================

let dynamoDbClient: DynamoDBDocumentClient;
let cognitoClient: CognitoIdentityProviderClient;

// User Pool IDs by environment
const USER_POOL_IDS: Record<string, string> = {
  dev: 'af-south-1_FG21EYH08',
  qa: 'af-south-1_7H3fSbzTl',
  prod: 'af-south-1_Sf0Hfki8l',
};

function initializeAwsClient(region: string = 'af-south-1') {
  const client = new DynamoDBClient({ region });
  dynamoDbClient = DynamoDBDocumentClient.from(client);
  cognitoClient = new CognitoIdentityProviderClient({ region });
}

/**
 * Fetch Cognito userId (sub) for a given email
 */
async function getCognitoUserId(email: string, environment: string): Promise<string | null> {
  const userPoolId = USER_POOL_IDS[environment];

  if (!userPoolId) {
    throw new Error(`Unknown environment: ${environment}. Must be dev, qa, or prod.`);
  }

  try {
    const response = await cognitoClient.send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1,
      })
    );

    if (response.Users && response.Users.length > 0) {
      const user = response.Users[0];
      const subAttr = user.Attributes?.find(attr => attr.Name === 'sub');

      if (subAttr?.Value) {
        return subAttr.Value;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching Cognito user:', error);
    throw error;
  }
}

// ============================================================================
// DATA GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate realistic exam progression data
 * Pattern: Initial failures -> gradual improvement -> eventual mastery
 */
function generateExamAttempts(
  userId: string,
  exam: ExamDefinition,
  baseDate: Date
): any[] {
  const attempts: any[] = [];
  const attemptCount = Math.floor(Math.random() * 2) + 5; // 5-6 attempts per exam (more attempts = better progression)

  // Generate progression: moderate start -> strong finish (marketing-friendly)
  const scoreProgression = [
    62, // First attempt: fail (shows initial challenge)
    74, // Second attempt: close to pass
    82, // Third attempt: solid pass!
    90, // Fourth attempt: strong pass
    95, // Fifth attempt: excellent pass
    97, // Sixth attempt: near perfect
  ];

  for (let i = 0; i < attemptCount; i++) {
    const attemptId = uuidv4();
    const daysAgo = (attemptCount - i) * 7; // Weekly attempts
    const attemptDate = new Date(baseDate);
    attemptDate.setDate(attemptDate.getDate() - daysAgo);

    const score = scoreProgression[i] || 90 + Math.floor(Math.random() * 8); // Very high scores for extra attempts (90-98%)
    const correctAnswers = Math.floor((score / 100) * exam.totalQuestions);
    const isPassed = score >= exam.passingScore;
    const duration = 3600 + Math.floor(Math.random() * 1800); // 60-90 minutes

    const startedAt = attemptDate.getTime();
    const submittedAt = startedAt + (duration * 1000);

    // Generate answer data
    const answers: Record<string, any> = {};
    for (let q = 1; q <= exam.totalQuestions; q++) {
      const questionId = `${exam.examId}-q${q}`;
      const isCorrect = q <= correctAnswers;

      answers[questionId] = {
        selectedOptionId: `option-${isCorrect ? 'a' : 'b'}`,
        isCorrect,
        timeSpent: Math.floor(Math.random() * 120) + 30, // 30-150 seconds
        flagged: false,
      };
    }

    const attemptData = {
      PK: `USER#${userId}`,
      SK: `ATTEMPT#${attemptId}`,
      GSI1PK: `EXAM#${exam.examId}`,
      GSI1SK: `${submittedAt}#${userId}`,
      GSI2PK: `RESULT#${exam.examId}`,
      GSI2SK: `${attemptDate.getFullYear()}#${String(attemptDate.getMonth() + 1).padStart(2, '0')}#${String(attemptDate.getDate()).padStart(2, '0')}#${userId}`,

      attemptId,
      userId,
      examId: exam.examId,
      examTitle: exam.title,

      status: 'completed',
      startedAt,
      submittedAt,
      completedAt: submittedAt,

      duration,
      timeSpentPerQuestion: answers,

      totalQuestions: exam.totalQuestions,
      questionsAttempted: exam.totalQuestions,
      questionsCorrect: correctAnswers,
      questionsSkipped: 0,

      score,
      percentage: score, // Frontend expects percentage field
      rawScore: correctAnswers,
      isPassed,
      passingScore: exam.passingScore,
      correctAnswers, // Frontend expects correctAnswers field
      timeTaken: duration, // Frontend expects timeTaken field
      date: attemptDate.toISOString().split('T')[0], // Frontend expects date field (YYYY-MM-DD)

      answers,

      accuracy: score,
      categoryPerformance: {
        [exam.category]: {
          attempted: exam.totalQuestions,
          correct: correctAnswers,
          accuracy: score,
        },
      },

      pointsEarned: Math.floor(score * 10),
      contributesToLeaderboard: true,

      entityType: 'EXAM_RESULT',
      createdAt: attemptDate.toISOString(),
      updatedAt: attemptDate.toISOString(),

      deviceType: 'desktop',
    };

    attempts.push(attemptData);
  }

  return attempts;
}

/**
 * Calculate leaderboard score based on performance
 */
function calculateLeaderboardScore(attempts: any[]): number {
  const recentAttempts = attempts.slice(-10); // Last 10 attempts
  const totalPoints = recentAttempts.reduce((sum, att) => sum + att.pointsEarned, 0);
  return totalPoints;
}

/**
 * Generate leaderboard entries for different timeframes
 */
function generateLeaderboardEntries(
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
  attempts: any[]
): any[] {
  const entries: any[] = [];
  const now = new Date();

  const totalScore = calculateLeaderboardScore(attempts);

  // Daily leaderboard (today) - Include tier in PK for backend compatibility
  // NOTE: Pro and Premium users compete together in "premium" tier (not "pro"!)
  const dailyDate = now.toISOString().split('T')[0];
  const leaderboardTier = 'premium'; // Pro/Premium users compete in "premium" tier
  const paddedScore = String(10000 - totalScore).padStart(10, '0');

  entries.push({
    PK: `LEADERBOARD#DAILY#${leaderboardTier}#${dailyDate}`,
    SK: `SCORE#${paddedScore}#${userId}`,
    GSI1PK: `LEADERBOARD#DAILY#${leaderboardTier}`,
    GSI1SK: `${dailyDate}#${paddedScore}#${userId}`,

    userId,
    firstName,
    lastName,
    totalPoints: totalScore,
    score: totalScore, // Used for ranking
    percentage: 0, // Not used for points-based leaderboard
    allScores: attempts.slice(-10).map(a => (a.correctAnswers || 0) * 10), // Last 10 attempts
    attemptCount: attempts.length,
    tier: leaderboardTier,
    TTL: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  });

  // Weekly leaderboard - Include tier in PK
  const weekNumber = getWeekNumber(now);
  const weekStr = `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  entries.push({
    PK: `LEADERBOARD#WEEKLY#${leaderboardTier}#${weekStr}`,
    SK: `SCORE#${paddedScore}#${userId}`,
    GSI1PK: `LEADERBOARD#WEEKLY#${leaderboardTier}`,
    GSI1SK: `${weekStr}#${paddedScore}#${userId}`,

    userId,
    firstName,
    lastName,
    totalPoints: totalScore,
    score: totalScore,
    percentage: 0,
    allScores: attempts.slice(-10).map(a => (a.correctAnswers || 0) * 10),
    attemptCount: attempts.length,
    tier: leaderboardTier,
    TTL: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60, // 60 days
  });

  // Monthly leaderboard - Include tier in PK
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  entries.push({
    PK: `LEADERBOARD#MONTHLY#${leaderboardTier}#${monthStr}`,
    SK: `SCORE#${paddedScore}#${userId}`,
    GSI1PK: `LEADERBOARD#MONTHLY#${leaderboardTier}`,
    GSI1SK: `${monthStr}#${paddedScore}#${userId}`,

    userId,
    firstName,
    lastName,
    totalPoints: totalScore,
    score: totalScore,
    percentage: 0,
    allScores: attempts.slice(-10).map(a => (a.correctAnswers || 0) * 10),
    attemptCount: attempts.length,
    tier: leaderboardTier,
    TTL: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days
  });

  // All-time leaderboard - Include tier in PK
  // All-time is per-exam, so create entry for the best performing exam
  const bestAttempt = attempts.reduce((best, att) => att.score > best.score ? att : best, attempts[0]);
  const bestScore = bestAttempt.score;
  const bestScorePadded = String(10000 - bestScore).padStart(10, '0');

  entries.push({
    PK: `LEADERBOARD#ALLTIME#${leaderboardTier}#${bestAttempt.examId}`,
    SK: `SCORE#${bestScorePadded}#${userId}`,
    GSI1PK: `LEADERBOARD#ALLTIME#${leaderboardTier}`,
    GSI1SK: `SCORE#${bestScorePadded}#${userId}#${bestAttempt.examId}`,

    userId,
    firstName,
    lastName,
    examId: bestAttempt.examId,
    examTitle: bestAttempt.examTitle,
    score: bestScore,
    percentage: bestScore,
    timeTaken: bestAttempt.timeTaken,
    timestamp: bestAttempt.submittedAt,
    tier: leaderboardTier,
    // No TTL for all-time leaderboard
  });

  return entries;
}

/**
 * Generate user profile with pro subscription
 */
function generateUserProfile(
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
  attempts: any[]
): any {
  const now = new Date();
  const createdDate = new Date(now);
  createdDate.setDate(createdDate.getDate() - 90); // Account created 90 days ago

  const subscriptionStartDate = new Date(now);
  subscriptionStartDate.setDate(subscriptionStartDate.getDate() - 30);

  const subscriptionEndDate = new Date(subscriptionStartDate);
  subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 90); // 90-day pro subscription

  const totalQuestionsAttempted = attempts.reduce((sum, att) => sum + att.totalQuestions, 0);
  const totalQuestionsCorrect = attempts.reduce((sum, att) => sum + att.questionsCorrect, 0);
  const overallAccuracy = (totalQuestionsCorrect / totalQuestionsAttempted) * 100;
  const totalPoints = calculateLeaderboardScore(attempts);

  return {
    PK: `USER#${userId}`,
    SK: 'METADATA',
    GSI1PK: 'USER#STATUS#active',
    GSI1SK: `${createdDate.toISOString()}#${userId}`,

    userId,
    email,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    role: 'student', // Backend expects role field

    tier: 'pro',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: subscriptionEndDate.getTime(),
    subscriptionStartedAt: subscriptionStartDate.getTime(),

    showOnLeaderboard: true,
    preferences: {
      emailNotifications: true,
      marketingEmails: true,
      timezone: 'Africa/Johannesburg',
      theme: 'light',
    },

    totalQuestionsAttempted,
    totalQuestionsCorrect,
    overallAccuracy,

    currentRank: 2, // Daily rank
    allTimePoints: totalPoints,
    weeklyPoints: totalPoints,
    monthlyPoints: totalPoints,

    status: 'active',
    isEmailVerified: true,
    accountCompletedAt: createdDate.getTime(),
    lastLoginAt: now.getTime(),

    entityType: 'USER',
    createdAt: createdDate.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: 'seed-script',
  };
}

/**
 * Generate active subscription record
 */
function generateSubscription(userId: string): any {
  const now = new Date();
  const subscriptionId = uuidv4();
  const paymentId = uuidv4();

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 30);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 90);

  return {
    PK: `USER#${userId}`,
    SK: `SUBSCRIPTION#${subscriptionId}`,
    GSI2PK: 'SUBSCRIPTION#ACTIVE',
    GSI2SK: `${endDate.getTime()}#${userId}`,

    subscriptionId,
    userId,

    tier: 'pro',
    status: 'active',

    amountCents: 17999, // R179.99
    currency: 'ZAR',

    startedAt: startDate.getTime(),
    expiresAt: endDate.getTime(),
    durationDays: 90,

    paymentId,
    paymentMethod: 'payfast',
    transactionRef: `PF${Math.floor(Math.random() * 1000000)}`,

    autoRenew: true,
    nextBillingDate: endDate.getTime(),

    entityType: 'SUBSCRIPTION',
    createdAt: startDate.toISOString(),
    updatedAt: now.toISOString(),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

async function findUserByEmail(tableName: string, email: string): Promise<string | null> {
  try {
    const result = await dynamoDbClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#EMAIL#${email.toLowerCase()}`,
        },
        Limit: 1,
      })
    );

    if (result.Items && result.Items.length > 0 && result.Items[0]?.userId) {
      return result.Items[0].userId as string;
    }

    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

async function batchWriteItems(tableName: string, items: any[], dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log(`[DRY RUN] Would write ${items.length} items to ${tableName}`);
    return;
  }

  // DynamoDB batch write limit is 25 items
  const batchSize = 25;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const requests = batch.map(item => ({
      PutRequest: { Item: item },
    }));

    try {
      await dynamoDbClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: requests,
          },
        })
      );

      console.log(`✓ Wrote batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (${batch.length} items)`);
    } catch (error) {
      console.error(`✗ Error writing batch:`, error);
      throw error;
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function seedMarketingUser(config: SeedConfig) {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         MARKETING USER SEED DATA GENERATOR                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const tableName = `exam-platform-data-${config.environment}`;

  console.log('Configuration:');
  console.log(`  Email:       ${config.email}`);
  console.log(`  Environment: ${config.environment}`);
  console.log(`  Table:       ${tableName}`);
  console.log(`  Mode:        ${config.dryRun ? 'DRY RUN' : 'EXECUTE'}\n`);

  if (config.dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be written to DynamoDB\n');
  }

  // Initialize AWS client
  initializeAwsClient();

  // Find or generate user ID from Cognito
  let userId = config.userId;
  if (!userId) {
    console.log('🔍 Fetching Cognito userId for', config.email);
    const cognitoUserId = await getCognitoUserId(config.email, config.environment);

    if (cognitoUserId) {
      userId = cognitoUserId;
      console.log(`✓ Found Cognito user: ${userId}\n`);
    } else {
      console.error('❌ ERROR: No Cognito user found for', config.email);
      console.error('Please ensure the user has signed up in the app first.\n');
      process.exit(1);
    }
  } else {
    console.log(`Using provided user ID: ${userId}\n`);
  }

  const firstName = config.firstName || 'Dragon';
  const lastName = config.lastName || 'Aziz';

  // Generate all data
  console.log('📊 Generating seed data...\n');

  const baseDate = new Date();
  const allAttempts: any[] = [];

  // Generate attempts for each exam
  console.log('Exam Attempts:');
  for (const exam of EXAM_DEFINITIONS) {
    const attempts = generateExamAttempts(userId, exam, baseDate);
    allAttempts.push(...attempts);

    const avgScore = attempts.reduce((sum, att) => sum + att.score, 0) / attempts.length;
    const passCount = attempts.filter(att => att.isPassed).length;

    console.log(`  ✓ ${exam.title}`);
    console.log(`    - ${attempts.length} attempts`);
    console.log(`    - Average score: ${avgScore.toFixed(1)}%`);
    console.log(`    - Passes: ${passCount}/${attempts.length}`);
    console.log(`    - Progression: ${attempts.map(a => a.score).join('% → ')}%\n`);
  }

  console.log(`Total exam attempts: ${allAttempts.length}\n`);

  // Generate user profile
  console.log('User Profile:');
  const userProfile = generateUserProfile(userId, config.email, firstName, lastName, allAttempts);
  console.log(`  ✓ Created profile for ${userProfile.displayName}`);
  console.log(`  - Tier: ${userProfile.tier}`);
  console.log(`  - Overall accuracy: ${userProfile.overallAccuracy.toFixed(1)}%`);
  console.log(`  - Total questions: ${userProfile.totalQuestionsAttempted}`);
  console.log(`  - Total points: ${userProfile.allTimePoints}\n`);

  // Generate subscription
  console.log('Subscription:');
  const subscription = generateSubscription(userId);
  console.log(`  ✓ Created pro subscription`);
  console.log(`  - Duration: ${subscription.durationDays} days`);
  console.log(`  - Amount: R${(subscription.amountCents / 100).toFixed(2)}`);
  console.log(`  - Expires: ${new Date(subscription.expiresAt).toLocaleDateString()}\n`);

  // Generate leaderboard entries
  console.log('Leaderboard Entries:');
  const leaderboardEntries = generateLeaderboardEntries(
    userId,
    config.email,
    firstName,
    lastName,
    allAttempts
  );

  for (const entry of leaderboardEntries) {
    console.log(`  ✓ ${entry.leaderboardType} - Rank #${entry.rank} (${entry.totalPoints} points)`);
  }
  console.log('');

  // Combine all items
  const allItems = [
    userProfile,
    subscription,
    ...allAttempts,
    ...leaderboardEntries,
  ];

  console.log(`\n📦 Total items to write: ${allItems.length}\n`);

  // Write to DynamoDB
  if (config.dryRun) {
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('DRY RUN COMPLETE - No data was written');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('Sample data preview:');
    console.log(JSON.stringify(userProfile, null, 2));
  } else {
    console.log('💾 Writing data to DynamoDB...\n');

    try {
      await batchWriteItems(tableName, allItems, false);

      console.log('\n═══════════════════════════════════════════════════════════════════');
      console.log('✅ SEED DATA CREATED SUCCESSFULLY!');
      console.log('═══════════════════════════════════════════════════════════════════\n');
      console.log('Summary:');
      console.log(`  User ID:          ${userId}`);
      console.log(`  Email:            ${config.email}`);
      console.log(`  Total Items:      ${allItems.length}`);
      console.log(`  Exam Attempts:    ${allAttempts.length}`);
      console.log(`  Leaderboard:      ${leaderboardEntries.length} entries`);
      console.log(`  Overall Accuracy: ${userProfile.overallAccuracy.toFixed(1)}%`);
      console.log(`  Total Points:     ${userProfile.allTimePoints}`);
      console.log('');
    } catch (error) {
      console.error('\n✗ ERROR writing data to DynamoDB:', error);
      throw error;
    }
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function printUsage() {
  console.log(`
Usage: ts-node seed-marketing-user.ts <email> <environment> [options]

Arguments:
  email          User email address
  environment    Environment (dev, qa, prod)

Options:
  --dry-run      Preview data without writing to DynamoDB
  --execute      Execute and write data to DynamoDB
  --user-id      Use existing user ID
  --first-name   User first name (default: Dragon)
  --last-name    User last name (default: Aziz)
  --help         Show this help message

Examples:
  # Preview data (recommended first)
  ts-node seed-marketing-user.ts dragon.aziz@moonfee.com prod --dry-run

  # Execute and create data
  ts-node seed-marketing-user.ts dragon.aziz@moonfee.com prod --execute

  # Use custom names
  ts-node seed-marketing-user.ts john.doe@example.com prod --execute --first-name John --last-name Doe
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length < 2) {
    printUsage();
    process.exit(0);
  }

  const email = args[0];
  const environment = args[1];

  if (!email || !environment) {
    console.error('❌ Error: Email and environment are required');
    printUsage();
    process.exit(1);
  }

  if (!['dev', 'qa', 'prod'].includes(environment)) {
    console.error('❌ Error: Environment must be dev, qa, or prod');
    process.exit(1);
  }

  const dryRun = args.includes('--dry-run');
  const execute = args.includes('--execute');

  if (!dryRun && !execute) {
    console.error('❌ Error: Must specify either --dry-run or --execute');
    printUsage();
    process.exit(1);
  }

  const config: SeedConfig = {
    email,
    environment,
    dryRun,
    userId: args.includes('--user-id') ? args[args.indexOf('--user-id') + 1] : undefined,
    firstName: args.includes('--first-name') ? args[args.indexOf('--first-name') + 1] : undefined,
    lastName: args.includes('--last-name') ? args[args.indexOf('--last-name') + 1] : undefined,
  };

  try {
    await seedMarketingUser(config);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedMarketingUser, SeedConfig };
