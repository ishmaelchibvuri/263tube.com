'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-reload when back online
      window.location.reload();
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

  const handleRetry = () => {
    window.location.reload();
  };

  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const goToBudget = () => {
    window.location.href = '/budget';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Logo */}
        <div className="mb-6">
          <Image
            src="/images/logo-transparent.png"
            alt="QuickBudget"
            width={120}
            height={120}
            className="mx-auto"
          />
        </div>

        {/* Offline Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You're Offline
        </h1>
        <p className="text-gray-600 mb-6">
          Don't worry - your budget data is saved locally.
          Try accessing a page you've visited before, or wait for your connection to restore.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={goToDashboard}
            className="w-full"
            variant="default"
          >
            Go to Dashboard
          </Button>

          <Button
            onClick={goToBudget}
            className="w-full"
            variant="outline"
          >
            Go to Budget
          </Button>

          <Button
            onClick={handleRetry}
            variant="ghost"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>

        {/* Status indicator */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Status: {' '}
            <span className={isOnline ? 'text-green-600' : 'text-amber-600'}>
              {isOnline ? 'Back online! Reloading...' : 'Waiting for connection...'}
            </span>
          </p>
        </div>
      </div>

      {/* Help text */}
      <p className="mt-6 text-sm text-gray-500 text-center max-w-sm">
        QuickBudget works offline! Your changes are saved locally and will sync automatically when you're back online.
      </p>
    </div>
  );
}
