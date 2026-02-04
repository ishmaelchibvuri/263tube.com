/**
 * Centralized CORS Configuration for Infrastructure
 *
 * This generates allowed origins based on the environment parameter
 * passed at deployment time.
 *
 * This ensures that:
 * - QA deployments get QA allowed origins
 * - Prod deployments get Prod allowed origins
 * - Dev deployments get Dev allowed origins
 *
 * Used by:
 * - API Gateway (api-stack.ts)
 * - Cognito OAuth callbacks (auth-stack.ts)
 *
 * IMPORTANT: These origins must match the backend config in ../backend/lib/config.ts
 */

/**
 * Get allowed origins based on environment
 * This is determined at deployment time based on the environment parameter
 */
export function getAllowedOrigins(environment: string): string[] {
  switch (environment) {
    case "prod":
      return [
        "https://quickbudget.co.za",
        "https://www.quickbudget.co.za",
        "http://localhost:3000",
      ];

    case "qa":
      return [
        "https://qa.quickbudget.co.za",
        "http://localhost:3000", // Keep for local testing against QA
      ];

    case "dev":
    default:
      return [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://192.168.1.105:3000",
        "https://dev.quickbudget.co.za",
        "https://qa.quickbudget.co.za",
        "https://quickbudget.co.za",
        "https://www.quickbudget.co.za",
      ];
  }
}

// For backwards compatibility, export ALLOWED_ORIGINS for dev environment
// This is used by older code that doesn't pass environment parameter
export const ALLOWED_ORIGINS = getAllowedOrigins(process.env.ENVIRONMENT || "dev");

/**
 * Get callback URLs for Cognito OAuth
 * Note: Cognito only allows HTTPS URLs (and localhost HTTP for development)
 * In dev mode, also allows HTTP URLs with local IP addresses like 192.168.x.x
 */
export function getCallbackUrls(environment: string, path: string = "/auth/callback"): string[] {
  const allowedOrigins = getAllowedOrigins(environment);
  return allowedOrigins
    .filter(origin => {
      // Allow HTTPS URLs
      if (origin.startsWith('https://')) return true;
      // Allow localhost/127.0.0.1 HTTP
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
      // In development, allow local IP addresses (192.168.x.x, 10.x.x.x, etc.)
      if (environment === 'dev' && origin.startsWith('http://')) return true;
      // Block everything else
      return false;
    })
    .map(origin => `${origin}${path}`);
}

/**
 * Get logout URLs for Cognito OAuth
 * Note: Cognito only allows HTTPS URLs (and localhost HTTP for development)
 * In dev mode, also allows HTTP URLs with local IP addresses like 192.168.x.x
 */
export function getLogoutUrls(environment: string, path: string = "/auth/logout"): string[] {
  const allowedOrigins = getAllowedOrigins(environment);
  return allowedOrigins
    .filter(origin => {
      // Allow HTTPS URLs
      if (origin.startsWith('https://')) return true;
      // Allow localhost/127.0.0.1 HTTP
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
      // In development, allow local IP addresses (192.168.x.x, 10.x.x.x, etc.)
      if (environment === 'dev' && origin.startsWith('http://')) return true;
      // Block everything else
      return false;
    })
    .map(origin => `${origin}${path}`);
}
