// This file is deprecated and kept for compatibility only
// All exam-related functionality has been removed from the debt payoff app

export async function listExams() {
  throw new Error("This function is not available in the debt payoff app");
}

export async function getExamWithQuestions(examId: string) {
  throw new Error("This function is not available in the debt payoff app");
}

export async function saveExamAttempt(attemptData: any) {
  throw new Error("This function is not available in the debt payoff app");
}

export async function getUserAttempts(userId: string, limit: number = 10) {
  throw new Error("This function is not available in the debt payoff app");
}

export async function getLeaderboard(
  timeframe: "daily" | "weekly" | "monthly" | "alltime",
  limit: number = 50
) {
  throw new Error("This function is not available in the debt payoff app");
}

export async function getUserStats(userId: string) {
  throw new Error("This function is not available in the debt payoff app");
}
