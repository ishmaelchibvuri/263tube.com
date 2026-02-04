/bug Role: Senior React Architect. Task: Refactor the QuickBudget SA app to be "Offline-First" using Dexie.js and the specific synchronization pattern provided below.

Context: Currently, the app fetches data directly from the backend (DynamoDB). We want to change this so the UI only talks to a local IndexedDB (via Dexie), and a background hook handles the syncing with the cloud.

Reference Pattern (Use this logic structure):javascript import { useState, useEffect } from 'react'; import { useLiveQuery } from 'dexie-react-hooks'; import { db } from './db';

export function useBudgetStream(userId) { const [isOnline, setIsOnline] = useState(true);

// 1. Monitor Network useEffect(() => { setIsOnline(navigator.onLine); const handleOnline = () => { setIsOnline(true); // TODO: Trigger sync function here }; const handleOffline = () => setIsOnline(false); window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline); return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); }; },);

// 2. Query Local DB (The "Single Source of Truth" for UI) const transactions = useLiveQuery( () => db.transactions.where('userId').equals(userId).reverse().sortBy('date'), [userId] );

// 3. Sync Strategy (Read-Through) useEffect(() => { if (isOnline) { // Fetch latest from API and update local DB // Note: In a real implementation, we would also push pending local writes here fetch(/api/budget/transactions?userId=${userId}) .then(res => res.json()) .then(data => { db.transactions.bulkPut(data); }); } }, [isOnline, userId]);

return { transactions, isOnline }; }

**Execution Plan:**

1.  **Dependencies:** Install `dexie` and `dexie-react-hooks`.
2.  **Database Config (`src/lib/db.ts`):**
    *   Create a Dexie database instance named `QuickBudgetDB`.
    *   Define a schema for `transactions`: `++id, userId, date, amount, category, merchant, syncStatus`.
3.  **The Hook (`src/hooks/useBudgetStream.ts`):**
    *   Implement the reference code above, adapted for our Transaction data model.
    *   Add a function `addTransaction(data)` that writes to Dexie immediately with `syncStatus: 'pending'`.
4.  **UI Integration:**
    *   Modify the main Dashboard component to consume `useBudgetStream`.
    *   Replace the current `fetch` calls in the UI with the `addTransaction` method returned by the hook.

**Constraint:** ensure the solution handles the case where the user is offline (visual indicator) but allows them to continue adding expenses.