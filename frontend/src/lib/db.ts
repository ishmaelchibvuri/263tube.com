import Dexie, { type EntityTable } from 'dexie';

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface LocalBudget {
  id?: number;
  budgetId?: string;
  userId: string;
  month: string;
  // Income fields
  netSalary: number;
  secondaryIncome: number;
  partnerContribution: number;
  grants: number;
  // Fixed Obligations
  housing: number;
  transport: number;
  utilities: number;
  insurance: number;
  education: number;
  familySupport: number;
  // Variable Expenses
  groceries: number;
  personalCare: number;
  health: number;
  entertainment: number;
  other: number;
  // Sync metadata
  syncStatus: SyncStatus;
  lastModified: number;
  serverUpdatedAt?: string;
}

export interface LocalBudgetLineItem {
  id: string;
  budgetMonth: string;
  userId: string;
  type: 'income' | 'obligation';
  category: string;
  name: string;
  amount: number;
  syncStatus: SyncStatus;
  lastModified: number;
}

export interface PendingOperation {
  id?: number;
  operationType: 'create' | 'update' | 'delete';
  entityType: 'budget' | 'budgetLineItem';
  entityId: string;
  payload: any;
  createdAt: number;
  retryCount: number;
}

class QuickBudgetDB extends Dexie {
  budgets!: EntityTable<LocalBudget, 'id'>;
  budgetLineItems!: EntityTable<LocalBudgetLineItem, 'id'>;
  pendingOperations!: EntityTable<PendingOperation, 'id'>;

  constructor() {
    super('QuickBudgetDB');
    this.version(1).stores({
      budgets: '++id, budgetId, [userId+month], syncStatus',
      budgetLineItems: 'id, budgetMonth, userId, category, syncStatus',
      pendingOperations: '++id, entityType, entityId, createdAt'
    });
  }
}

export const db = new QuickBudgetDB();

// Helper to convert server Budget to LocalBudget
export function toLocalBudget(
  serverBudget: any,
  userId: string,
  syncStatus: SyncStatus = 'synced'
): Omit<LocalBudget, 'id'> {
  return {
    budgetId: serverBudget.budgetId,
    userId,
    month: serverBudget.month,
    netSalary: serverBudget.netSalary ?? 0,
    secondaryIncome: serverBudget.secondaryIncome ?? 0,
    partnerContribution: serverBudget.partnerContribution ?? 0,
    grants: serverBudget.grants ?? 0,
    housing: serverBudget.housing ?? 0,
    transport: serverBudget.transport ?? 0,
    utilities: serverBudget.utilities ?? 0,
    insurance: serverBudget.insurance ?? 0,
    education: serverBudget.education ?? 0,
    familySupport: serverBudget.familySupport ?? 0,
    groceries: serverBudget.groceries ?? 0,
    personalCare: serverBudget.personalCare ?? 0,
    health: serverBudget.health ?? 0,
    entertainment: serverBudget.entertainment ?? 0,
    other: serverBudget.other ?? 0,
    syncStatus,
    lastModified: Date.now(),
    serverUpdatedAt: serverBudget.updatedAt,
  };
}

// Helper to convert LocalBudget to server format
export function toServerBudget(localBudget: LocalBudget): any {
  return {
    month: localBudget.month,
    netSalary: localBudget.netSalary,
    secondaryIncome: localBudget.secondaryIncome,
    partnerContribution: localBudget.partnerContribution,
    grants: localBudget.grants,
    housing: localBudget.housing,
    transport: localBudget.transport,
    utilities: localBudget.utilities,
    insurance: localBudget.insurance,
    education: localBudget.education,
    familySupport: localBudget.familySupport,
    groceries: localBudget.groceries,
    personalCare: localBudget.personalCare,
    health: localBudget.health,
    entertainment: localBudget.entertainment,
    other: localBudget.other,
  };
}
