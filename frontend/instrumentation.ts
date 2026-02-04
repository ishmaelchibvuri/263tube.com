// instrumentation.ts - Server-side error tracking for Next.js
// This file should be at the root of your project

export function register() {
  // No-op for initialization
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('PostHog server-side instrumentation registered');
  }
}

export const onRequestError = async (
  err: Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[]>;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath?: string;
    routeType?: string;
    renderSource?: string;
    revalidateReason?: string;
  }
) => {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Dynamically import PostHog server (only in Node.js runtime)
      const { getPostHogServer } = await import('./src/lib/posthog-server');
      const posthog = getPostHogServer();

      // Extract distinct_id from PostHog cookie
      let distinctId: string | undefined = undefined;

      if (request.headers.cookie) {
        // Handle both string and string[] cookie headers
        const cookieString = Array.isArray(request.headers.cookie)
          ? request.headers.cookie.join('; ')
          : request.headers.cookie;

        // Match PostHog cookie (format: ph_<project_key>_posthog)
        const postHogCookieMatch = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/);

        if (postHogCookieMatch && postHogCookieMatch[1]) {
          try {
            const decodedCookie = decodeURIComponent(postHogCookieMatch[1]);
            const postHogData = JSON.parse(decodedCookie);
            distinctId = postHogData.distinct_id;
          } catch (e) {
            console.error('Error parsing PostHog cookie:', e);
          }
        }
      }

      // Capture exception with context
      posthog.capture({
        distinctId: distinctId || 'anonymous',
        event: '$exception',
        properties: {
          $exception_message: err.message,
          $exception_type: err.name,
          $exception_stack_trace: err.stack,
          request_path: request.path,
          request_method: request.method,
          router_kind: context.routerKind,
          route_path: context.routePath,
          route_type: context.routeType,
          render_source: context.renderSource,
          source: 'server-side',
          runtime: 'nodejs',
        },
      });

      console.log('Server-side error captured in PostHog:', {
        error: err.message,
        path: request.path,
        distinctId: distinctId || 'anonymous',
      });
    } catch (captureError) {
      // Fallback: log to console if PostHog capture fails
      console.error('Failed to capture error in PostHog:', captureError);
      console.error('Original error:', err);
    }
  }
};
