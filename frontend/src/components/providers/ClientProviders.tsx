'use client';

import { AuthProvider } from '@/lib/auth-context';
import { ImpersonationProvider } from '@/lib/impersonation-context';
import { AmplifyProvider } from '@/components/providers/AmplifyProvider';
import { ReferralTrackingProvider } from '@/components/providers/ReferralTrackingProvider';
import { Toaster } from 'sonner';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const PHProvider = dynamic(() => import('@/components/providers/PostHogProvider').then(mod => mod.PHProvider), {
  ssr: false,
});

const PostHogPageView = dynamic(() => import('@/components/providers/PostHogPageView').then(mod => mod.PostHogPageView), {
  ssr: false,
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AmplifyProvider>
      <AuthProvider>
        <ImpersonationProvider>
          <PHProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <ReferralTrackingProvider>
              {children}
            </ReferralTrackingProvider>
          </PHProvider>
          <Toaster position="top-right" />
        </ImpersonationProvider>
      </AuthProvider>
    </AmplifyProvider>
  );
}
