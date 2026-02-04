/**
 * Utility for persisting selected month across pages
 */

const STORAGE_KEY = 'quickbudget_selected_month';

/**
 * Get the currently selected month from localStorage
 * @returns Month string in YYYY-MM format, or current month if none stored
 */
export function getStoredMonth(): string {
  if (typeof window === 'undefined') {
    return getCurrentMonth();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && /^\d{4}-\d{2}$/.test(stored)) {
    return stored;
  }

  return getCurrentMonth();
}

/**
 * Store the selected month in localStorage
 * @param month Month string in YYYY-MM format
 */
export function setStoredMonth(month: string): void {
  if (typeof window === 'undefined') return;

  if (/^\d{4}-\d{2}$/.test(month)) {
    localStorage.setItem(STORAGE_KEY, month);
  }
}

/**
 * Format a date as YYYY-MM using local time (not UTC)
 */
function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get the current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  return formatYearMonth(new Date());
}

/**
 * Get the previous month
 * @param month Month string in YYYY-MM format
 */
export function getPreviousMonth(month: string): string {
  const parts = month.split('-').map(Number);
  const year = parts[0] ?? new Date().getFullYear();
  const monthNum = parts[1] ?? 1;
  const date = new Date(year, monthNum - 2, 1); // -2 because months are 0-indexed
  return formatYearMonth(date);
}

/**
 * Get the next month
 * @param month Month string in YYYY-MM format
 */
export function getNextMonth(month: string): string {
  const parts = month.split('-').map(Number);
  const year = parts[0] ?? new Date().getFullYear();
  const monthNum = parts[1] ?? 1;
  const date = new Date(year, monthNum, 1); // monthNum (not -1) gives next month
  return formatYearMonth(date);
}

/**
 * Format month for display (e.g., "January 2025")
 * @param month Month string in YYYY-MM format
 */
export function formatMonthDisplay(month: string): string {
  const parts = month.split('-').map(Number);
  const year = parts[0] ?? new Date().getFullYear();
  const monthNum = parts[1] ?? 1;
  const date = new Date(year, monthNum - 1, 1);
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
}

/**
 * Check if the month is the current month
 */
export function isCurrentMonth(month: string): boolean {
  return month === getCurrentMonth();
}

/**
 * Check if the month is in the future
 */
export function isFutureMonth(month: string): boolean {
  return month > getCurrentMonth();
}
