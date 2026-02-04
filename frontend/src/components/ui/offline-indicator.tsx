'use client';

import { WifiOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  syncError: string | null;
  onRetry?: () => void;
}

export function OfflineIndicator({
  isOnline,
  isSyncing,
  pendingChanges,
  syncError,
  onRetry,
}: OfflineIndicatorProps) {
  // Hide when online with no pending changes and no error
  if (isOnline && pendingChanges === 0 && !syncError && !isSyncing) {
    return null;
  }

  // Determine state and styling
  let variant: 'offline' | 'syncing' | 'error' | 'pending' = 'offline';
  let bgColor = 'bg-amber-50 border-amber-200';
  let textColor = 'text-amber-800';
  let iconColor = 'text-amber-600';

  if (syncError) {
    variant = 'error';
    bgColor = 'bg-red-50 border-red-200';
    textColor = 'text-red-800';
    iconColor = 'text-red-600';
  } else if (isSyncing) {
    variant = 'syncing';
    bgColor = 'bg-blue-50 border-blue-200';
    textColor = 'text-blue-800';
    iconColor = 'text-blue-600';
  } else if (!isOnline) {
    variant = 'offline';
    bgColor = 'bg-amber-50 border-amber-200';
    textColor = 'text-amber-800';
    iconColor = 'text-amber-600';
  } else if (pendingChanges > 0) {
    variant = 'pending';
    bgColor = 'bg-yellow-50 border-yellow-200';
    textColor = 'text-yellow-800';
    iconColor = 'text-yellow-600';
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto md:min-w-[300px] z-50',
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
        bgColor
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0', iconColor)}>
        {variant === 'offline' && <WifiOff className="h-5 w-5" />}
        {variant === 'syncing' && <RefreshCw className="h-5 w-5 animate-spin" />}
        {variant === 'error' && <AlertCircle className="h-5 w-5" />}
        {variant === 'pending' && <RefreshCw className="h-5 w-5" />}
      </div>

      {/* Message */}
      <div className={cn('flex-1 text-sm font-medium', textColor)}>
        {variant === 'offline' && (
          <>
            You're offline
            {pendingChanges > 0 && (
              <span className="ml-1">
                ({pendingChanges} change{pendingChanges !== 1 ? 's' : ''} pending)
              </span>
            )}
          </>
        )}
        {variant === 'syncing' && 'Syncing changes...'}
        {variant === 'error' && (
          <span className="truncate">{syncError || 'Sync failed'}</span>
        )}
        {variant === 'pending' && (
          <>
            {pendingChanges} unsaved change{pendingChanges !== 1 ? 's' : ''}
          </>
        )}
      </div>

      {/* Retry Button (for errors) */}
      {variant === 'error' && onRetry && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRetry}
          className="flex-shrink-0 text-red-700 hover:text-red-800 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

// Compact version for inline use
export function OfflineIndicatorCompact({
  isOnline,
  isSyncing,
  pendingChanges,
}: Pick<OfflineIndicatorProps, 'isOnline' | 'isSyncing' | 'pendingChanges'>) {
  if (isOnline && pendingChanges === 0 && !isSyncing) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <Check className="h-3 w-3" />
        Saved
      </span>
    );
  }

  if (isSyncing) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Syncing...
      </span>
    );
  }

  if (!isOnline) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        <WifiOff className="h-3 w-3" />
        Offline
        {pendingChanges > 0 && ` (${pendingChanges})`}
      </span>
    );
  }

  if (pendingChanges > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
        <RefreshCw className="h-3 w-3" />
        {pendingChanges} pending
      </span>
    );
  }

  return null;
}
