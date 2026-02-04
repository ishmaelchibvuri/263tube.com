import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DebtDatabaseHelpers, Budget } from "../../lib/debt-database";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { withCorsWrapper } from "../../lib/cors-wrapper";
import { v4 as uuidv4 } from "uuid";

/**
 * PUT /budget
 * Save or update the user's budget
 */
const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;

    if (!userId) {
      console.error("❌ No userId found in authorizer context");
      return createErrorResponse(401, "Unauthorized", undefined, event);
    }

    const body = JSON.parse(event.body || "{}");
    console.log("💾 Saving budget for user:", userId);

    // Get or set the month (default to current month if not provided)
    const month = body.month || new Date().toISOString().slice(0, 7);

    // Validate that at least some budget fields or custom items are provided
    const budgetFields = [
      "netSalary",
      "secondaryIncome",
      "partnerContribution",
      "grants",
      "housing",
      "transport",
      "utilities",
      "insurance",
      "education",
      "familySupport",
      "groceries",
      "personalCare",
      "health",
      "entertainment",
      "other",
    ];

    const hasAnyField = budgetFields.some((field) => body[field] !== undefined);
    const hasCustomItems = body.customItems && body.customItems.length > 0;

    if (!hasAnyField && !hasCustomItems) {
      return createErrorResponse(
        400,
        "Budget must include at least one income or expense field, or custom items",
        undefined,
        event
      );
    }

    // Build budget object
    const budgetData: Omit<Budget, "createdAt" | "updatedAt"> = {
      budgetId: body.budgetId || uuidv4(),
      userId,
      month,
      netSalary: Number(body.netSalary || 0),
      primarySalary: Number(body.primarySalary || 0),
      secondaryIncome: Number(body.secondaryIncome || 0),
      partnerContribution: Number(body.partnerContribution || 0),
      grants: Number(body.grants || 0),
      governmentGrants: Number(body.governmentGrants || 0),
      housing: Number(body.housing || 0),
      rent: Number(body.rent || 0),
      transport: Number(body.transport || 0),
      utilities: Number(body.utilities || 0),
      insurance: Number(body.insurance || 0),
      education: Number(body.education || 0),
      familySupport: Number(body.familySupport || 0), // Black Tax - protected
      groceries: Number(body.groceries || 0),
      personalCare: Number(body.personalCare || 0),
      health: Number(body.health || 0),
      medical: Number(body.medical || 0),
      cellphone: Number(body.cellphone || 0),
      clothing: Number(body.clothing || 0),
      household: Number(body.household || 0),
      entertainment: Number(body.entertainment || 0),
      other: Number(body.other || 0),
      customItems: body.customItems || [],
    };

    const budget = await DebtDatabaseHelpers.saveBudget(budgetData);

    console.log("✅ Budget saved successfully");

    return createSuccessResponse({
      message: "Budget saved successfully",
      budget,
    }, 200, event);
  } catch (error) {
    console.error("❌ Error saving budget:", error);

    if (error instanceof Error) {
      return createErrorResponse(500, error.message, undefined, event);
    }

    return createErrorResponse(
      500,
      "Internal server error while saving budget",
      undefined,
      event
    );
  }
};

export const handler = withCorsWrapper(baseHandler);
