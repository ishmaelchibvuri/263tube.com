import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Debt as DebtType, Budget as BudgetType } from "./types";

// Re-export for backward compatibility
export type Debt = DebtType;
export type Budget = BudgetType;

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

export interface BudgetInternal extends BudgetType {
  userId: string;
  // Income
  netSalary: number;
  secondaryIncome: number;
  partnerContribution: number;
  grants: number; // SASSA, child support, etc.
  // Fixed Obligations
  housing: number; // Rent, bond, levies
  transport: number;
  utilities: number;
  insurance: number;
  education: number;
  familySupport: number; // Black Tax - protected
  // Variable Expenses
  groceries: number;
  personalCare: number;
  health: number;
  entertainment: number;
  other: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Database helpers for debt management
 *
 * DynamoDB Access Patterns:
 * 1. Debt by ID: PK = USER#{userId}, SK = DEBT#{debtId}
 * 2. All debts for user: PK = USER#{userId}, SK begins_with DEBT#
 * 3. Section 129 debts: GSI1PK = SECTION129#{userId}, GSI1SK = {deadline}
 * 4. In Duplum debts: GSI2PK = INDUPLUM#{userId}, GSI2SK = {status}
 */
export class DebtDatabaseHelpers {
  /**
   * Get all debts for a user
   */
  static async getUserDebts(userId: string): Promise<Debt[]> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "DEBT#",
        },
      });

      const response = await docClient.send(command);
      return (response.Items || []).map(item => this.itemToDebt(item));
    } catch (error) {
      console.error("Error getting user debts:", error);
      throw new Error("Failed to retrieve debts");
    }
  }

  /**
   * Get all active debts across all users (for cron jobs)
   * Note: Uses Scan operation - expensive, should only be used for scheduled jobs
   */
  static async getAllActiveDebts(): Promise<Debt[]> {
    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(SK, :sk) AND (attribute_not_exists(isPaidOff) OR isPaidOff = :false) AND currentBalance > :zero",
        ExpressionAttributeValues: {
          ":sk": "DEBT#",
          ":false": false,
          ":zero": 0,
        },
      });

      const response = await docClient.send(command);
      return (response.Items || []).map(item => this.itemToDebt(item));
    } catch (error) {
      console.error("Error getting all active debts:", error);
      throw new Error("Failed to retrieve all active debts");
    }
  }

  /**
   * Get a single debt by ID
   */
  static async getDebt(userId: string, debtId: string): Promise<Debt | null> {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `DEBT#${debtId}`,
        },
      });

      const response = await docClient.send(command);
      return response.Item ? this.itemToDebt(response.Item) : null;
    } catch (error) {
      console.error("Error getting debt:", error);
      throw new Error("Failed to retrieve debt");
    }
  }

  /**
   * Create a new debt
   */
  static async createDebt(debt: Omit<Debt, "createdAt" | "updatedAt">): Promise<Debt> {
    try {
      const now = new Date().toISOString();
      const fullDebt: Debt = {
        ...debt,
        createdAt: now,
        updatedAt: now,
      };

      const item = this.debtToItem(fullDebt);

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)",
      });

      await docClient.send(command);
      console.log("✅ Debt created:", debt.debtId);

      return fullDebt;
    } catch (error) {
      console.error("Error creating debt:", error);
      if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
        throw new Error("Debt already exists");
      }
      throw new Error("Failed to create debt");
    }
  }

  /**
   * Update an existing debt
   */
  static async updateDebt(
    userId: string,
    debtId: string,
    updates: Partial<Omit<Debt, "userId" | "debtId" | "createdAt">>
  ): Promise<Debt> {
    try {
      // Build update expression dynamically
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      updateExpressions.push("#updatedAt = :updatedAt");
      expressionAttributeNames["#updatedAt"] = "updatedAt";
      expressionAttributeValues[":updatedAt"] = new Date().toISOString();

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateExpressions.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = value;
        }
      });

      // Update GSI attributes if Section 129 status changes
      if (updates.section129Received !== undefined || updates.section129Deadline !== undefined) {
        if (updates.section129Received && updates.section129Deadline) {
          updateExpressions.push("#GSI1PK = :gsi1pk", "#GSI1SK = :gsi1sk");
          expressionAttributeNames["#GSI1PK"] = "GSI1PK";
          expressionAttributeNames["#GSI1SK"] = "GSI1SK";
          expressionAttributeValues[":gsi1pk"] = `SECTION129#${userId}`;
          expressionAttributeValues[":gsi1sk"] = updates.section129Deadline;
        }
      }

      // Update In Duplum GSI if status changes
      if (updates.inDuplumStatus !== undefined) {
        updateExpressions.push("#GSI2PK = :gsi2pk", "#GSI2SK = :gsi2sk");
        expressionAttributeNames["#GSI2PK"] = "GSI2PK";
        expressionAttributeNames["#GSI2SK"] = "GSI2SK";
        expressionAttributeValues[":gsi2pk"] = `INDUPLUM#${userId}`;
        expressionAttributeValues[":gsi2sk"] = updates.inDuplumStatus;
      }

      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `DEBT#${debtId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      });

      const response = await docClient.send(command);
      console.log("✅ Debt updated:", debtId);

      return this.itemToDebt(response.Attributes!);
    } catch (error) {
      console.error("Error updating debt:", error);
      throw new Error("Failed to update debt");
    }
  }

  /**
   * Delete a debt (soft delete by marking as archived)
   */
  static async deleteDebt(userId: string, debtId: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `DEBT#${debtId}`,
        },
      });

      await docClient.send(command);
      console.log("✅ Debt deleted:", debtId);
    } catch (error) {
      console.error("Error deleting debt:", error);
      throw new Error("Failed to delete debt");
    }
  }

  /**
   * Mark a debt as paid off
   */
  static async markDebtPaidOff(userId: string, debtId: string): Promise<Debt> {
    try {
      const now = new Date().toISOString();

      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `DEBT#${debtId}`,
        },
        UpdateExpression: "SET #paidOffAt = :paidOffAt, #currentBalance = :zero, #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#paidOffAt": "paidOffAt",
          "#currentBalance": "currentBalance",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":paidOffAt": now,
          ":zero": 0,
          ":updatedAt": now,
        },
        ReturnValues: "ALL_NEW",
      });

      const response = await docClient.send(command);
      console.log("✅ Debt marked as paid off:", debtId);

      return this.itemToDebt(response.Attributes!);
    } catch (error) {
      console.error("Error marking debt paid off:", error);
      throw new Error("Failed to mark debt as paid off");
    }
  }

  /**
   * Mark a debt as unpaid (reopen it)
   */
  static async markDebtUnpaid(userId: string, debtId: string, currentBalance: number): Promise<Debt> {
    try {
      const now = new Date().toISOString();

      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `DEBT#${debtId}`,
        },
        UpdateExpression: "SET #paidOffAt = :null, #currentBalance = :balance, #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#paidOffAt": "paidOffAt",
          "#currentBalance": "currentBalance",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":null": null,
          ":balance": currentBalance,
          ":updatedAt": now,
        },
        ReturnValues: "ALL_NEW",
      });

      const response = await docClient.send(command);
      console.log("✅ Debt marked as unpaid:", debtId);

      return this.itemToDebt(response.Attributes!);
    } catch (error) {
      console.error("Error marking debt as unpaid:", error);
      throw new Error("Failed to mark debt as unpaid");
    }
  }

  /**
   * Get user's budget for a specific month
   */
  static async getUserBudget(userId: string, month?: string): Promise<Budget | null> {
    try {
      // If month not provided, use current month
      const budgetMonth = month || new Date().toISOString().slice(0, 7);

      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `BUDGET#${budgetMonth}`,
        },
      });

      const response = await docClient.send(command);
      return response.Item ? this.itemToBudget(response.Item) : null;
    } catch (error) {
      console.error("Error getting budget:", error);
      throw new Error("Failed to retrieve budget");
    }
  }

  /**
   * Save user's budget for a specific month
   */
  static async saveBudget(budget: Omit<Budget, "createdAt" | "updatedAt">): Promise<Budget> {
    try {
      const now = new Date().toISOString();
      const month = budget.month || new Date().toISOString().slice(0, 7);

      // Check if budget exists for this month
      const existing = await this.getUserBudget(budget.userId, month);

      const fullBudget: Budget = {
        ...budget,
        month,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${fullBudget.userId}`,
          SK: `BUDGET#${month}`,
          GSI1PK: `USER#${fullBudget.userId}`,
          GSI1SK: `BUDGET#${month}`,
          ...fullBudget,
        },
      });

      await docClient.send(command);
      console.log("✅ Budget saved for user:", budget.userId, "month:", month);

      return fullBudget;
    } catch (error) {
      console.error("Error saving budget:", error);
      throw new Error("Failed to save budget");
    }
  }

  /**
   * Delete user's budget for a specific month
   */
  static async deleteBudget(userId: string, month: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `BUDGET#${month}`,
        },
      });

      await docClient.send(command);
      console.log("✅ Budget deleted for user:", userId, "month:", month);
    } catch (error) {
      console.error("Error deleting budget:", error);
      throw new Error("Failed to delete budget");
    }
  }

  /**
   * Helper: Convert DynamoDB item to Debt object
   */
  private static itemToDebt(item: any): Debt {
    return {
      debtId: item.debtId,
      userId: item.userId,
      creditor: item.creditor,
      debtName: item.debtName,
      accountNumber: item.accountNumber,
      originalPrincipal: item.originalPrincipal,
      openingBalance: item.openingBalance || item.originalPrincipal,
      currentBalance: item.currentBalance,
      annualInterestRate: item.annualInterestRate,
      minimumPayment: item.minimumPayment,
      paymentDueDay: item.paymentDueDay,
      agreementDate: item.agreementDate,
      monthlyServiceFee: item.monthlyServiceFee || 0,
      creditLifePremium: item.creditLifePremium || 0,
      monthlyCreditLifeInsurance: item.monthlyCreditLifeInsurance || 0,
      initiationFeeBalance: item.initiationFeeBalance || 0,
      initiationFee: item.initiationFee || 0,
      debtType: item.debtType,
      section129Received: item.section129Received || false,
      section129Date: item.section129Date || null,
      section129Deadline: item.section129Deadline || null,
      accumulatedInterestAndFees: item.accumulatedInterestAndFees || 0,
      inDuplumCapReached: item.inDuplumCapReached || false,
      inDuplumStatus: item.inDuplumStatus || 'none',
      isPaidOff: item.isPaidOff || false,
      paidOffAt: item.paidOffAt || null,
      isArchived: item.isArchived || false,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Helper: Convert Debt object to DynamoDB item
   */
  private static debtToItem(debt: Debt): any {
    const item: any = {
      PK: `USER#${debt.userId}`,
      SK: `DEBT#${debt.debtId}`,
      ...debt,
    };

    // Add GSI attributes for Section 129 tracking
    if (debt.section129Received && debt.section129Deadline) {
      item.GSI1PK = `SECTION129#${debt.userId}`;
      item.GSI1SK = debt.section129Deadline;
    }

    // Add GSI attributes for In Duplum tracking (based on ratio)
    const inDuplumRatio = debt.accumulatedInterestAndFees / debt.originalPrincipal;
    const inDuplumStatus = inDuplumRatio >= 1.0 ? 'BREACHED' :
                          inDuplumRatio >= 0.85 ? 'NEAR_CAP' :
                          inDuplumRatio >= 0.7 ? 'APPROACHING' : 'COMPLIANT';
    item.GSI2PK = `INDUPLUM#${debt.userId}`;
    item.GSI2SK = inDuplumStatus;

    return item;
  }

  /**
   * Helper: Convert DynamoDB item to Budget object
   */
  private static itemToBudget(item: any): Budget {
    return {
      budgetId: `BUDGET#${item.userId}#${item.month}`,
      userId: item.userId,
      month: item.month || new Date().toISOString().slice(0, 7),
      netSalary: item.netSalary || 0,
      primarySalary: item.primarySalary || 0,
      secondaryIncome: item.secondaryIncome || 0,
      partnerContribution: item.partnerContribution || 0,
      grants: item.grants || 0,
      governmentGrants: item.governmentGrants || 0,
      housing: item.housing || 0,
      rent: item.rent || 0,
      transport: item.transport || 0,
      utilities: item.utilities || 0,
      insurance: item.insurance || 0,
      education: item.education || 0,
      familySupport: item.familySupport || 0,
      groceries: item.groceries || 0,
      personalCare: item.personalCare || 0,
      health: item.health || 0,
      medical: item.medical || 0,
      cellphone: item.cellphone || 0,
      clothing: item.clothing || 0,
      household: item.household || 0,
      entertainment: item.entertainment || 0,
      other: item.other || 0,
      customItems: item.customItems || [],
      totalIncome: item.totalIncome,
      totalFixedObligations: item.totalFixedObligations,
      totalVariableExpenses: item.totalVariableExpenses,
      debtAttackBudget: item.debtAttackBudget,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
