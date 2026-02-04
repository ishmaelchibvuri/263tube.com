export interface Question {
  questionId: string;
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
  category: string;
  difficulty: string;

  // Enhanced metadata (optional for backward compatibility)
  taskCategory?: string; // T1-T8
  qcId?: string; // T1.1.1, etc.
  cognitiveLevel?: string; // Application (Level 3), etc.
  legislativeAnchor?: string;
  topic?: string; // Topic field from question data (e.g., "FAIS Act")
}

export interface UserAnswer {
  questionNumber: number;
  selectedAnswers: string[];
  timeTaken: number;
}

export interface QuestionResult {
  questionNumber: number;
  questionText: string;
  isCorrect: boolean;
  pointsEarned: number;
  timeTaken: number;
  correctAnswers: string[];
  userAnswers: string[];
  explanation: string;
}

export interface ExamResult {
  score: number;
  totalPoints: number;
  percentage: number;
  timeTaken: number;
  correctAnswers: number;
  totalQuestions: number;
  isPassed: boolean;
  breakdown: QuestionResult[];
}

/**
 * Enhanced exam result with T1-T8 breakdown and analytics
 */
export interface EnhancedExamResult extends ExamResult {
  /** Task-level performance breakdown (T1-T8) */
  taskPerformance: Record<string, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;

  /** Cognitive level performance breakdown */
  cognitivePerformance: Record<string, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;

  /** Time management analysis */
  timeAnalysis: {
    avgTimePerQuestion: number;
    fastQuestions: number; // < 60 seconds
    optimalQuestions: number; // 60-180 seconds
    slowQuestions: number; // > 180 seconds
  };

  /** Enhanced breakdown with metadata */
  breakdown: (QuestionResult & {
    questionId?: string;
    taskCategory?: string;
    qcId?: string;
    cognitiveLevel?: string;
    legislativeAnchor?: string;
  })[];
}

export class ScoringEngine {
  static calculateScore(
    questions: Question[],
    answers: UserAnswer[],
    timeTaken: number,
    passingScore: number = 70
  ): ExamResult {
    console.log(`=== SCORING ENGINE DEBUG ===`);
    console.log(`Questions to score: ${questions.length}`);
    console.log(`Answers received: ${answers.length}`);

    if (questions.length > 0 && questions[0]) {
      console.log(`First question number: ${questions[0].questionNumber}`);
    }
    if (answers.length > 0 && answers[0]) {
      console.log(`First answer question number: ${answers[0].questionNumber}`);
      console.log(`All answer question numbers:`, answers.map(a => a.questionNumber).slice(0, 10));
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    let correctAnswers = 0;
    const breakdown: QuestionResult[] = [];
    let matchedAnswers = 0;

    questions.forEach((question) => {
      totalPoints += question.points;
      const userAnswer = answers.find(
        (a) => a.questionNumber === question.questionNumber
      );

      if (!userAnswer) {
        // No answer provided
        console.log(`No answer found for question ${question.questionNumber}`);
        breakdown.push({
          questionNumber: question.questionNumber,
          questionText: question.questionText,
          isCorrect: false,
          pointsEarned: 0,
          timeTaken: 0,
          correctAnswers: this.getCorrectAnswerIds(question),
          userAnswers: [],
          explanation: question.explanation,
        });
        return;
      }

      matchedAnswers++;
      const isCorrect = this.checkAnswer(question, userAnswer);

      if (isCorrect) {
        earnedPoints += question.points;
        correctAnswers++;
      }

      breakdown.push({
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
        timeTaken: userAnswer.timeTaken,
        correctAnswers: this.getCorrectAnswerIds(question),
        userAnswers: userAnswer.selectedAnswers,
        explanation: question.explanation,
      });
    });

    console.log(`Matched answers: ${matchedAnswers} out of ${questions.length} questions`);

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = percentage >= passingScore;

    return {
      score: earnedPoints,
      totalPoints,
      percentage: Math.round(percentage * 100) / 100,
      timeTaken,
      correctAnswers,
      totalQuestions: questions.length,
      isPassed,
      breakdown,
    };
  }

  private static checkAnswer(question: Question, answer: UserAnswer): boolean {
    const correctAnswerIds = this.getCorrectAnswerIds(question);

    console.log(`=== ANSWER CHECK DEBUG for Q${question.questionNumber} ===`);
    console.log("Question type:", question.questionType);
    console.log("User answers:", answer.selectedAnswers);
    console.log("Correct answer IDs:", correctAnswerIds);
    console.log("Question options:", question.options);

    // Force single-choice evaluation for all questions
    const isCorrect =
      answer.selectedAnswers.length === 1 &&
      correctAnswerIds.length >= 1 &&
      answer.selectedAnswers[0] === correctAnswerIds[0];

    console.log("Forced single-choice result:", isCorrect);
    return isCorrect;
  }

  private static getCorrectAnswerIds(question: Question): string[] {
    console.log("=== GET CORRECT ANSWER IDS DEBUG ===");
    console.log("Question options:", question.options);
    console.log("Options type:", typeof question.options);
    console.log("Is options array:", Array.isArray(question.options));

    if (Array.isArray(question.options)) {
      console.log("Options length:", question.options.length);
      question.options.forEach((option, index) => {
        console.log(`Option ${index}:`, option);
        console.log(`Option ${index} isCorrect:`, option.isCorrect);
        console.log(`Option ${index} id:`, option.id);
      });
    }

    const correctIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id);

    console.log("Correct answer IDs found:", correctIds);
    console.log("=== END GET CORRECT ANSWER IDS DEBUG ===");

    return correctIds;
  }



  static calculateTimeBonus(): number {
    // No time bonus for this implementation, but could be added
    return 0;
  }

  static calculateDifficultyMultiplier(difficulty: string): number {
    switch (difficulty) {
      case "beginner":
        return 1.0;
      case "intermediate":
        return 1.2;
      case "advanced":
        return 1.5;
      default:
        return 1.0;
    }
  }

  static generateScoreReport(result: ExamResult): {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } {
    const summary = `You scored ${result.percentage}% (${
      result.correctAnswers
    }/${result.totalQuestions} correct) in ${Math.floor(
      result.timeTaken / 60
    )} minutes.`;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];



    result.breakdown.forEach(() => {
      // This would need question type information in the breakdown
      // For now, we'll use a simple analysis
    });

    if (result.percentage >= 90) {
      strengths.push("Excellent performance!");
    } else if (result.percentage >= 80) {
      strengths.push("Good performance with room for improvement.");
    } else if (result.percentage >= 70) {
      strengths.push("Passing score achieved.");
    } else {
      weaknesses.push(
        "Below passing score. Review the material and try again."
      );
    }

    if (result.timeTaken > result.totalQuestions * 60) {
      recommendations.push(
        "Consider practicing time management for better performance."
      );
    }

    return {
      summary,
      strengths,
      weaknesses,
      recommendations,
    };
  }

  /**
   * Calculate enhanced exam score with T1-T8 breakdown and analytics
   *
   * @param questions - Array of questions with metadata
   * @param answers - User's answers
   * @param timeTaken - Total time taken in seconds
   * @param passingScore - Passing percentage (default 66)
   * @returns Enhanced result with task-level breakdown
   */
  static calculateEnhancedScore(
    questions: Question[],
    answers: UserAnswer[],
    timeTaken: number,
    passingScore: number = 66
  ): EnhancedExamResult {
    // First calculate basic score
    const basicResult = this.calculateScore(questions, answers, timeTaken, passingScore);

    // Initialize tracking objects
    const taskStats: Record<string, { attempted: number; correct: number }> = {};
    const cognitiveStats: Record<string, { attempted: number; correct: number }> = {};
    let fastCount = 0;
    let optimalCount = 0;
    let slowCount = 0;

    // Enhanced breakdown with metadata
    const enhancedBreakdown = basicResult.breakdown.map((item, index) => {
      const question = questions[index];
      if (!question) return undefined;
      const userAnswer = answers.find(a => a.questionNumber === question.questionNumber);

      // Track by task category
      const task = question.taskCategory || "Unknown";
      if (!taskStats[task]) {
        taskStats[task] = { attempted: 0, correct: 0 };
      }
      taskStats[task].attempted++;
      if (item.isCorrect) {
        taskStats[task].correct++;
      }

      // Track by cognitive level
      const cognitive = question.cognitiveLevel || "Unknown";
      if (!cognitiveStats[cognitive]) {
        cognitiveStats[cognitive] = { attempted: 0, correct: 0 };
      }
      cognitiveStats[cognitive].attempted++;
      if (item.isCorrect) {
        cognitiveStats[cognitive].correct++;
      }

      // Track time per question
      const questionTime = userAnswer?.timeTaken || 0;
      if (questionTime < 60) {
        fastCount++;
      } else if (questionTime <= 180) {
        optimalCount++;
      } else {
        slowCount++;
      }

      // Get full text for user's selected answers
      const userAnswerTexts = item.userAnswers.map((answerId: string) => {
        const option = question.options.find((opt: any) => opt.id === answerId);
        return option ? `${answerId}. ${option.text}` : answerId;
      });

      // Get full text for correct answers
      const correctAnswerTexts = item.correctAnswers.map((answerId: string) => {
        const option = question.options.find((opt: any) => opt.id === answerId);
        return option ? `${answerId}. ${option.text}` : answerId;
      });

      // Get categories (convert single category to array for consistency)
      const categories = question.category ? [question.category] : ["General"];

      // Get topics (use topic field if available, otherwise use category)
      const topics = question.topic ? [question.topic] : (question.category ? [question.category] : ["General"]);

      // Return enhanced breakdown item
      return {
        ...item,
        questionId: question.questionId,
        taskCategory: question.taskCategory,
        qcId: question.qcId,
        cognitiveLevel: question.cognitiveLevel,
        legislativeAnchor: question.legislativeAnchor,
        userAnswerTexts,
        correctAnswerTexts,
        categories,
        topics,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== undefined);

    // Calculate task performance percentages
    const taskPerformance: Record<string, { attempted: number; correct: number; accuracy: number }> = {};
    Object.entries(taskStats).forEach(([task, stats]) => {
      taskPerformance[task] = {
        attempted: stats.attempted,
        correct: stats.correct,
        accuracy: stats.attempted > 0
          ? Math.round((stats.correct / stats.attempted) * 100 * 100) / 100
          : 0,
      };
    });

    // Calculate cognitive performance percentages
    const cognitivePerformance: Record<string, { attempted: number; correct: number; accuracy: number }> = {};
    Object.entries(cognitiveStats).forEach(([level, stats]) => {
      cognitivePerformance[level] = {
        attempted: stats.attempted,
        correct: stats.correct,
        accuracy: stats.attempted > 0
          ? Math.round((stats.correct / stats.attempted) * 100 * 100) / 100
          : 0,
      };
    });

    // Calculate time analysis
    const avgTimePerQuestion = timeTaken / questions.length;
    const timeAnalysis = {
      avgTimePerQuestion: Math.round(avgTimePerQuestion * 100) / 100,
      fastQuestions: fastCount,
      optimalQuestions: optimalCount,
      slowQuestions: slowCount,
    };

    return {
      ...basicResult,
      taskPerformance,
      cognitivePerformance,
      timeAnalysis,
      breakdown: enhancedBreakdown,
    };
  }
}
