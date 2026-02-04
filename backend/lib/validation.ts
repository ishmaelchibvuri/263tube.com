import Joi from "joi";

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    role: Joi.string().valid("user", "student", "admin").default("user"),
    showOnLeaderboard: Joi.boolean().default(true),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(1).max(50),
    lastName: Joi.string().min(1).max(50),
    showOnLeaderboard: Joi.boolean(),
    profilePicture: Joi.string().max(5242880), // Allow up to 5MB base64 string
  }),
};

// Exam validation schemas
export const examSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000),
    category: Joi.string().min(1).max(50).required(),
    difficulty: Joi.string()
      .valid("beginner", "intermediate", "advanced")
      .required(),
    totalTime: Joi.number().integer().min(60).max(7200).required(), // 1 minute to 2 hours
    passingScore: Joi.number().integer().min(0).max(100).required(),
    questions: Joi.array()
      .items(
        Joi.object({
          questionText: Joi.string().min(1).max(2000).required(),
          questionType: Joi.string()
            .valid("single", "multiple", "truefalse")
            .required(),
          options: Joi.array()
            .items(
              Joi.object({
                id: Joi.string().required(),
                text: Joi.string().min(1).max(500).required(),
                isCorrect: Joi.boolean().required(),
              })
            )
            .min(2)
            .max(6)
            .required(),
          explanation: Joi.string().max(1000),
          points: Joi.number().integer().min(1).max(100).default(1),
          timeLimit: Joi.number().integer().min(10).max(300).default(60), // 10 seconds to 5 minutes
          category: Joi.string().min(1).max(50),
          difficulty: Joi.string().valid(
            "beginner",
            "intermediate",
            "advanced"
          ),
        })
      )
      .min(1)
      .max(100)
      .required(),
  }),

  start: Joi.object({
    examId: Joi.string().required(),
  }),

  submit: Joi.object({
    examId: Joi.string().required(),
    answers: Joi.array()
      .items(
        Joi.object({
          questionNumber: Joi.number().integer().min(1).required(),
          selectedAnswers: Joi.array().items(Joi.string()).required(),
          timeTaken: Joi.number().integer().min(0).required(),
        })
      )
      .required(),
    timeTaken: Joi.number().integer().min(0).required(),
    updateLeaderboard: Joi.boolean().optional(), // Optional flag to control leaderboard updates
    attemptId: Joi.string().optional(), // Optional attemptId to filter questions to specific quiz session
    questionIds: Joi.array().items(Joi.string()).optional(), // Optional array of questionIds for full exams
    examTitle: Joi.string().max(200).optional(), // Optional custom exam title (for custom quizzes)
  }),

  list: Joi.object({
    category: Joi.string().optional(),
    difficulty: Joi.string()
      .valid("beginner", "intermediate", "advanced")
      .optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),
};

// Leaderboard validation schemas
export const leaderboardSchemas = {
  getDaily: Joi.object({
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    examId: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    tier: Joi.string().valid('free', 'premium').optional(),
  }),

  getWeekly: Joi.object({
    week: Joi.string()
      .pattern(/^\d{4}-W\d{2}$/)
      .optional(),
    examId: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    tier: Joi.string().valid('free', 'premium').optional(),
  }),

  getMonthly: Joi.object({
    month: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .optional(),
    examId: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).default(100),
    tier: Joi.string().valid('free', 'premium').optional(),
  }),

  getAllTime: Joi.object({
    examId: Joi.string().allow("").optional(),
    limit: Joi.number().integer().min(1).max(100).default(100),
    tier: Joi.string().valid('free', 'premium').optional(),
  }),

  getUserRank: Joi.object({
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    week: Joi.string()
      .pattern(/^\d{4}-W\d{2}$/)
      .optional(),
    month: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .optional(),
    examId: Joi.string().optional(),
  }),
};

// User stats validation schemas
export const userStatsSchemas = {
  getHistory: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    examId: Joi.string().optional(),
    startDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),

  updatePreferences: Joi.object({
    showOnLeaderboard: Joi.boolean(),
    emailNotifications: Joi.boolean(),
    theme: Joi.string().valid("light", "dark", "auto"),
  }),
};

// Admin validation schemas
export const adminSchemas = {
  getAnalytics: Joi.object({
    examId: Joi.string().optional(),
    startDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),

  manageUsers: Joi.object({
    action: Joi.string()
      .valid("list", "deactivate", "reactivate", "resetPassword")
      .required(),
    userId: Joi.string().when("action", {
      is: Joi.string().valid("deactivate", "reactivate", "resetPassword"),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  manageExams: Joi.object({
    action: Joi.string()
      .valid("list", "activate", "deactivate", "delete")
      .required(),
    examId: Joi.string().when("action", {
      is: Joi.string().valid("activate", "deactivate", "delete"),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

export function validateRequest<T>(schema: Joi.ObjectSchema, data: any): T {
  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    throw new Error(`Validation error: ${JSON.stringify(errorDetails)}`);
  }

  return value as T;
}

export function validateQueryParams<T = any>(
  schema: Joi.ObjectSchema,
  queryParams: Record<string, string | undefined> | null | undefined
): T {
  // Handle null/undefined query params
  if (!queryParams) {
    return validateRequest<T>(schema, {});
  }

  // Convert string values to appropriate types
  const convertedParams: any = {};

  for (const [key, value] of Object.entries(queryParams)) {
    // Skip undefined or empty string values
    if (value === undefined || value === "") {
      continue;
    }

    // Try to convert to number if it looks like a number
    if (!isNaN(Number(value)) && value !== "") {
      convertedParams[key] = Number(value);
    } else if (value === "true") {
      convertedParams[key] = true;
    } else if (value === "false") {
      convertedParams[key] = false;
    } else {
      convertedParams[key] = value;
    }
  }

  return validateRequest<T>(schema, convertedParams);
}
