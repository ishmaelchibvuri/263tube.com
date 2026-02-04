import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  AuthMiddleware,
  AuthenticatedEvent,
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { DatabaseHelpers } from "../../lib/database";
import { withCorsWrapper } from "../../lib/cors-wrapper";

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      },
      body: "",
    };
  }

  try {
    // Authenticate user
    const user = await AuthMiddleware.authenticate(event);
    const authenticatedEvent = event as AuthenticatedEvent;
    authenticatedEvent.user = user;

    // Get query parameters
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : 100;
    const category = event.queryStringParameters?.category;

    console.log(
      `Getting weak questions for user ${user.userId}, limit: ${limit}, category: ${category || "all"}`
    );

    // Get user's question progress
    const questionProgress = await DatabaseHelpers.getUserQuestionProgress(
      user.userId
    );

    console.log(`Found ${questionProgress.length} question progress records`);

    // Filter for weak questions (incorrect attempts > 0 or accuracy < 100)
    const weakQuestionIds: { id: string; accuracy: number; incorrectAttempts: number }[] = [];

    for (const progress of questionProgress) {
      const questionId = progress.SK.replace("QPROGRESS#", "");
      const accuracy = progress.accuracy || 100;
      const incorrectAttempts = progress.incorrectAttempts || 0;

      // Question is "weak" if user has gotten it wrong at least once or has less than perfect accuracy
      if (incorrectAttempts > 0 || accuracy < 100) {
        weakQuestionIds.push({
          id: questionId,
          accuracy,
          incorrectAttempts,
        });
      }
    }

    console.log(`Found ${weakQuestionIds.length} weak questions`);

    // Sort by accuracy (lowest first) to prioritize weakest questions
    weakQuestionIds.sort((a, b) => a.accuracy - b.accuracy);

    // Limit the number of questions
    const limitedWeakQuestions = weakQuestionIds.slice(0, limit);

    if (limitedWeakQuestions.length === 0) {
      return createSuccessResponse([], event);
    }

    // Get full question details
    const questionIds = limitedWeakQuestions.map((q) => q.id);
    const questions = await DatabaseHelpers.getQuestionsByIds(questionIds);

    console.log(`Retrieved ${questions.length} question details`);

    // Filter by category if specified
    let filteredQuestions = questions;
    if (category) {
      filteredQuestions = questions.filter(
        (q) => q.categoryCode === category || q.category === category
      );
      console.log(
        `Filtered to ${filteredQuestions.length} questions in category ${category}`
      );
    }

    // Map questions to response format with progress info
    const weakQuestionsMap = new Map(
      limitedWeakQuestions.map((q) => [q.id, q])
    );

    const response = filteredQuestions.map((question) => {
      const progressInfo = weakQuestionsMap.get(question.questionId);
      return {
        questionId: question.questionId,
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        category: question.category,
        categoryCode: question.categoryCode,
        difficulty: question.difficulty,
        // Add progress info
        accuracy: progressInfo?.accuracy || 0,
        incorrectAttempts: progressInfo?.incorrectAttempts || 0,
      };
    });

    // Sort by accuracy again (in case order changed after filtering)
    response.sort((a, b) => a.accuracy - b.accuracy);

    return createSuccessResponse(response, event);
  } catch (error) {
    console.error("Get weak questions error:", error);

    if (error instanceof Error) {
      if (error.message.includes("No authorization token")) {
        return createErrorResponse(401, "Authentication required", undefined, event);
      }
      if (error.message.includes("Invalid or expired token")) {
        return createErrorResponse(401, "Invalid or expired token", undefined, event);
      }
    }

    return createErrorResponse(
      500,
      "Internal server error while fetching weak questions",
      undefined,
      event
    );
  }
};

export const handler = withCorsWrapper(baseHandler);
