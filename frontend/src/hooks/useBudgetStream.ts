'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalBudgetLineItem, PendingOperation, toLocalBudget } from '@/lib/db';
import { api } from '@/lib/api-client-debts';
import { Budget, BudgetLineItem } from '@/types';
import { toast } from 'sonner';

const SYNC_INTERVAL = 30000; // 30 seconds
const MAX_RETRY_COUNT = 5;

interface UseBudgetStreamOptions {
  userId: string;
  month: string;
}

interface UseBudgetStreamReturn {
  // Data
  budget: Partial<Budget> | null;
  budgetLineItems: BudgetLineItem[];
  // State
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  syncError: string | null;
  isLoading: boolean;
  // Actions
  addBudgetLineItem: (item: Omit<BudgetLineItem, 'id'>) => Promise<void>;
  updateBudgetLineItem: (item: BudgetLineItem) => Promise<void>;
  deleteBudgetLineItem: (itemId: string) => Promise<void>;
  updateBudget: (updates: Partial<Budget>) => Promise<void>;
  syncNow: () => Promise<void>;
  clearLocalData: () => Promise<void>;
}

export function useBudgetStream({ userId, month }: UseBudgetStreamOptions): UseBudgetStreamReturn {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialSyncDone = useRef(false);

  // Live query for local budget data
  const localBudget = useLiveQuery(
    () => db.budgets.where({ userId, month }).first(),
    [userId, month]
  );

  // Live query for local budget line items
  const localLineItems = useLiveQuery(
    () => db.budgetLineItems.where({ userId, budgetMonth: month }).toArray(),
    [userId, month]
  );

  // Live query for pending operations count
  const pendingOps = useLiveQuery(
    () => db.pendingOperations.count(),
    []
  );

  // Convert local data to Budget format for consumers
  const budget: Partial<Budget> | null = localBudget ? {
    budgetId: localBudget.budgetId,
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
    customItems: localLineItems?.map(item => ({
      id: item.id,
      type: item.type,
      category: item.category as BudgetLineItem['category'],
      name: item.name,
      amount: item.amount,
    })) || [],
  } : null;

  const budgetLineItems: BudgetLineItem[] = localLineItems?.map(item => ({
    id: item.id,
    type: item.type,
    category: item.category as BudgetLineItem['category'],
    name: item.name,
    amount: item.amount,
  })) || [];

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sync when coming back online
      syncFromServer();
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync from server - fetches latest data and updates local DB
  const syncFromServer = useCallback(async () => {
    if (!isOnline || !userId) return;

    try {
      setIsSyncing(true);
      setSyncError(null);

      const serverBudget = await api.budget.getBudget(month);

      if (serverBudget) {
        // Check if we have local pending changes
        const localData = await db.budgets.where({ userId, month }).first();
        const hasPendingChanges = localData?.syncStatus === 'pending';

        if (!hasPendingChanges) {
          // Update local database with server data
          const localBudgetData = toLocalBudget(serverBudget, userId, 'synced');

          if (localData) {
            await db.budgets.update(localData.id!, localBudgetData);
          } else {
            await db.budgets.add(localBudgetData);
          }

          // Sync line items
          const serverItems = serverBudget.customItems || [];

          // Get existing local items
          const existingLocalItems = await db.budgetLineItems
            .where({ userId, budgetMonth: month })
            .toArray();

          // Only update items that aren't pending
          const pendingItemIds = new Set(
            existingLocalItems
              .filter(item => item.syncStatus === 'pending')
              .map(item => item.id)
          );

          // Delete non-pending items that don't exist on server
          const serverItemIds = new Set(serverItems.map((item: BudgetLineItem) => item.id));
          for (const localItem of existingLocalItems) {
            if (!serverItemIds.has(localItem.id) && !pendingItemIds.has(localItem.id)) {
              await db.budgetLineItems.delete(localItem.id);
            }
          }

          // Add/update server items (skip pending ones)
          for (const serverItem of serverItems) {
            if (!pendingItemIds.has(serverItem.id)) {
              const localItem: LocalBudgetLineItem = {
                id: serverItem.id,
                budgetMonth: month,
                userId,
                type: serverItem.type,
                category: serverItem.category,
                name: serverItem.name,
                amount: serverItem.amount,
                syncStatus: 'synced',
                lastModified: Date.now(),
              };
              await db.budgetLineItems.put(localItem);
            }
          }
        }
      } else {
        // No server budget - check if we have local data to preserve
        const localData = await db.budgets.where({ userId, month }).first();
        if (!localData) {
          // Initialize empty local budget
          await db.budgets.add({
            userId,
            month,
            netSalary: 0,
            secondaryIncome: 0,
            partnerContribution: 0,
            grants: 0,
            housing: 0,
            transport: 0,
            utilities: 0,
            insurance: 0,
            education: 0,
            familySupport: 0,
            groceries: 0,
            personalCare: 0,
            health: 0,
            entertainment: 0,
            other: 0,
            syncStatus: 'synced',
            lastModified: Date.now(),
          });
        }
      }
    } catch (error: any) {
      console.error('Sync from server failed:', error);
      setSyncError(error.message || 'Failed to sync with server');

      // Initialize empty local budget on error if none exists
      const localData = await db.budgets.where({ userId, month }).first();
      if (!localData) {
        await db.budgets.add({
          userId,
          month,
          netSalary: 0,
          secondaryIncome: 0,
          partnerContribution: 0,
          grants: 0,
          housing: 0,
          transport: 0,
          utilities: 0,
          insurance: 0,
          education: 0,
          familySupport: 0,
          groceries: 0,
          personalCare: 0,
          health: 0,
          entertainment: 0,
          other: 0,
          syncStatus: 'synced',
          lastModified: Date.now(),
        });
      }
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, [isOnline, userId, month]);

  // Process pending operations queue
  const processQueue = useCallback(async () => {
    if (!isOnline) return;

    const operations = await db.pendingOperations
      .orderBy('createdAt')
      .toArray();

    for (const op of operations) {
      if (op.retryCount >= MAX_RETRY_COUNT) {
        // Mark as error after max retries
        if (op.entityType === 'budgetLineItem') {
          await db.budgetLineItems.update(op.entityId, { syncStatus: 'error' });
        }
        await db.pendingOperations.delete(op.id!);
        continue;
      }

      try {
        await executeOperation(op);
        await db.pendingOperations.delete(op.id!);

        // Mark entity as synced
        if (op.entityType === 'budgetLineItem' && op.operationType !== 'delete') {
          await db.budgetLineItems.update(op.entityId, { syncStatus: 'synced' });
        }
      } catch (error) {
        console.error('Operation failed, will retry:', error);
        await db.pendingOperations.update(op.id!, {
          retryCount: op.retryCount + 1,
        });
      }
    }
  }, [isOnline]);

  // Execute a single pending operation
  const executeOperation = async (op: PendingOperation) => {
    if (op.entityType === 'budget') {
      // Save entire budget to server
      await api.budget.saveBudget(op.payload);

      // Update local budget as synced
      const localData = await db.budgets.where({ userId, month }).first();
      if (localData) {
        await db.budgets.update(localData.id!, { syncStatus: 'synced' });
      }
    } else if (op.entityType === 'budgetLineItem') {
      // Budget line items are saved as part of the full budget
      // Collect all current items and save the full budget
      const localBudgetData = await db.budgets.where({ userId, month }).first();
      const allItems = await db.budgetLineItems.where({ userId, budgetMonth: month }).toArray();

      if (localBudgetData) {
        const budgetToSave = {
          month: localBudgetData.month,
          netSalary: localBudgetData.netSalary,
          secondaryIncome: localBudgetData.secondaryIncome,
          partnerContribution: localBudgetData.partnerContribution,
          grants: localBudgetData.grants,
          housing: localBudgetData.housing,
          transport: localBudgetData.transport,
          utilities: localBudgetData.utilities,
          insurance: localBudgetData.insurance,
          education: localBudgetData.education,
          familySupport: localBudgetData.familySupport,
          groceries: localBudgetData.groceries,
          personalCare: localBudgetData.personalCare,
          health: localBudgetData.health,
          entertainment: localBudgetData.entertainment,
          other: localBudgetData.other,
          customItems: allItems.map(item => ({
            id: item.id,
            type: item.type,
            category: item.category as BudgetLineItem['category'],
            name: item.name,
            amount: item.amount,
          })),
        };

        await api.budget.saveBudget(budgetToSave);
      }
    }
  };

  // Initial sync and periodic sync setup
  useEffect(() => {
    if (userId && month && !initialSyncDone.current) {
      initialSyncDone.current = true;
      syncFromServer();
    }
  }, [userId, month, syncFromServer]);

  // Reset initial sync flag when month changes
  useEffect(() => {
    initialSyncDone.current = false;
    setIsLoading(true);
  }, [month]);

  // Periodic sync when online
  useEffect(() => {
    if (isOnline) {
      syncIntervalRef.current = setInterval(() => {
        syncFromServer();
        processQueue();
      }, SYNC_INTERVAL);
    } else if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline, syncFromServer, processQueue]);

  // Add a budget line item
  const addBudgetLineItem = useCallback(async (item: Omit<BudgetLineItem, 'id'>) => {
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const localItem: LocalBudgetLineItem = {
      id,
      budgetMonth: month,
      userId,
      type: item.type,
      category: item.category,
      name: item.name,
      amount: item.amount,
      syncStatus: 'pending',
      lastModified: Date.now(),
    };

    await db.budgetLineItems.add(localItem);

    // Queue for sync
    await db.pendingOperations.add({
      operationType: 'create',
      entityType: 'budgetLineItem',
      entityId: id,
      payload: { ...item, id },
      createdAt: Date.now(),
      retryCount: 0,
    });

    // Try to sync immediately if online
    if (isOnline) {
      processQueue();
    }
  }, [userId, month, isOnline, processQueue]);

  // Update a budget line item
  const updateBudgetLineItem = useCallback(async (item: BudgetLineItem) => {
    const localItem: LocalBudgetLineItem = {
      id: item.id,
      budgetMonth: month,
      userId,
      type: item.type,
      category: item.category,
      name: item.name,
      amount: item.amount,
      syncStatus: 'pending',
      lastModified: Date.now(),
    };

    await db.budgetLineItems.put(localItem);

    // Remove any existing operations for this item and add new one
    await db.pendingOperations.where({ entityId: item.id }).delete();
    await db.pendingOperations.add({
      operationType: 'update',
      entityType: 'budgetLineItem',
      entityId: item.id,
      payload: item,
      createdAt: Date.now(),
      retryCount: 0,
    });

    if (isOnline) {
      processQueue();
    }
  }, [userId, month, isOnline, processQueue]);

  // Delete a budget line item
  const deleteBudgetLineItem = useCallback(async (itemId: string) => {
    await db.budgetLineItems.delete(itemId);

    // Remove any existing operations for this item
    await db.pendingOperations.where({ entityId: itemId }).delete();

    // Add delete operation
    await db.pendingOperations.add({
      operationType: 'delete',
      entityType: 'budgetLineItem',
      entityId: itemId,
      payload: { id: itemId },
      createdAt: Date.now(),
      retryCount: 0,
    });

    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  // Update the budget (non-line-item fields)
  const updateBudget = useCallback(async (updates: Partial<Budget>) => {
    const localData = await db.budgets.where({ userId, month }).first();

    if (localData) {
      const updatedBudget = {
        ...localData,
        netSalary: updates.netSalary ?? localData.netSalary,
        secondaryIncome: updates.secondaryIncome ?? localData.secondaryIncome,
        partnerContribution: updates.partnerContribution ?? localData.partnerContribution,
        grants: updates.grants ?? localData.grants,
        housing: updates.housing ?? localData.housing,
        transport: updates.transport ?? localData.transport,
        utilities: updates.utilities ?? localData.utilities,
        insurance: updates.insurance ?? localData.insurance,
        education: updates.education ?? localData.education,
        familySupport: updates.familySupport ?? localData.familySupport,
        groceries: updates.groceries ?? localData.groceries,
        personalCare: updates.personalCare ?? localData.personalCare,
        health: updates.health ?? localData.health,
        entertainment: updates.entertainment ?? localData.entertainment,
        other: updates.other ?? localData.other,
        syncStatus: 'pending' as const,
        lastModified: Date.now(),
      };

      await db.budgets.update(localData.id!, updatedBudget);

      // Get all line items for the full save
      const allItems = await db.budgetLineItems.where({ userId, budgetMonth: month }).toArray();

      // Queue for sync
      await db.pendingOperations.add({
        operationType: 'update',
        entityType: 'budget',
        entityId: `budget-${month}`,
        payload: {
          month,
          netSalary: updatedBudget.netSalary,
          secondaryIncome: updatedBudget.secondaryIncome,
          partnerContribution: updatedBudget.partnerContribution,
          grants: updatedBudget.grants,
          housing: updatedBudget.housing,
          transport: updatedBudget.transport,
          utilities: updatedBudget.utilities,
          insurance: updatedBudget.insurance,
          education: updatedBudget.education,
          familySupport: updatedBudget.familySupport,
          groceries: updatedBudget.groceries,
          personalCare: updatedBudget.personalCare,
          health: updatedBudget.health,
          entertainment: updatedBudget.entertainment,
          other: updatedBudget.other,
          customItems: allItems.map(item => ({
            id: item.id,
            type: item.type,
            category: item.category as BudgetLineItem['category'],
            name: item.name,
            amount: item.amount,
          })),
        },
        createdAt: Date.now(),
        retryCount: 0,
      });

      if (isOnline) {
        processQueue();
      }
    }
  }, [userId, month, isOnline, processQueue]);

  // Manual sync trigger
  const syncNow = useCallback(async () => {
    await processQueue();
    await syncFromServer();
  }, [processQueue, syncFromServer]);

  // Clear all local data for this month
  const clearLocalData = useCallback(async () => {
    await db.budgetLineItems.where({ userId, budgetMonth: month }).delete();
    await db.budgets.where({ userId, month }).delete();
    await db.pendingOperations.clear();
  }, [userId, month]);

  return {
    budget,
    budgetLineItems,
    isOnline,
    isSyncing,
    pendingChanges: pendingOps ?? 0,
    syncError,
    isLoading,
    addBudgetLineItem,
    updateBudgetLineItem,
    deleteBudgetLineItem,
    updateBudget,
    syncNow,
    clearLocalData,
  };
}
