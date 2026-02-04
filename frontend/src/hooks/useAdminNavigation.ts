/**
 * useAdminNavigation Hook
 *
 * Monitors admin impersonation state and handles navigation between
 * admin and user dashboards automatically
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useImpersonation } from '@/lib/impersonation-context';
import { isAdminPath, canAccessAdminPath } from '@/lib/admin-tier';

export function useAdminNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { impersonatedTier } = useImpersonation();

  useEffect(() => {
    // Skip if not logged in or still loading
    if (!user || !pathname) return;

    const currentlyOnAdminPath = isAdminPath(pathname);
    const canAccess = canAccessAdminPath(user, impersonatedTier);

    // If impersonating and on admin path, redirect to user dashboard
    if (impersonatedTier && currentlyOnAdminPath) {
      console.log('🔄 Admin impersonating on admin path, redirecting to user dashboard...');
      router.push('/dashboard');
      return;
    }

    // If not impersonating, is admin, but on user path (excluding public paths)
    // and not on a specific feature page, could suggest admin dashboard
    // but we'll allow admins to browse user pages freely
    // This is optional - you can uncomment if you want strict separation:
    /*
    if (!impersonatedTier && user.role === 'admin' && !currentlyOnAdminPath && pathname.startsWith('/dashboard')) {
      console.log('ℹ️ Admin viewing user dashboard');
      // Could show a banner or notification here
    }
    */
  }, [user, pathname, impersonatedTier, router]);

  return {
    isAdminMode: user?.role === 'admin' && !impersonatedTier,
    isImpersonating: !!impersonatedTier,
    currentPath: pathname,
  };
}
