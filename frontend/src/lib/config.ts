/**
 * Centralized Configuration for Frontend
 *
 * Uses environment variables for configuration.
 * Set these in your deployment environment:
 * - NEXT_PUBLIC_ENVIRONMENT: 'dev' | 'qa' | 'prod'
 * - NEXT_PUBLIC_API_URL: API Gateway URL
 * - NEXT_PUBLIC_APP_URL: Frontend URL (optional, auto-detected if not set)
 */

// =============================================================================
// ENVIRONMENT DETECTION FROM ENV VARS
// =============================================================================

// Get environment from env var or default to 'dev'
export const ENVIRONMENT = (process.env.NEXT_PUBLIC_ENVIRONMENT || "dev") as
  | "dev"
  | "qa"
  | "prod";

// Function to get default API URL based on environment
function getDefaultApiUrl(env: string): string {
  switch (env) {
    case "prod":
      // TODO: Update with production API Gateway URL after deployment
      return "https://263tube.com/api";
    case "qa":
      // TODO: Update with QA API Gateway URL after deployment
      return "https://qa.263tube.com/api";
    case "dev":
    default:
      return "https://2c2pwepzii.execute-api.af-south-1.amazonaws.com/dev";
  }
}

// Function to get default App URL based on environment
function getDefaultAppUrl(env: string): string {
  switch (env) {
    case "prod":
      return "https://263tube.com";
    case "qa":
      return "https://qa.263tube.com";
    case "dev":
    default:
      return "http://localhost:3000";
  }
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || getDefaultApiUrl(ENVIRONMENT);
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || getDefaultAppUrl(ENVIRONMENT);

export const CONFIG = {
  environment: ENVIRONMENT,
  apiBaseUrl: API_BASE_URL,
  appUrl: APP_URL,
  isDevelopment: ENVIRONMENT === "dev",
  isQA: ENVIRONMENT === "qa",
  isProduction: ENVIRONMENT === "prod",

  // API Configuration
  api: {
    timeout: 30000, // 30 seconds
    retries: ENVIRONMENT === "prod" ? 3 : 1,
  },

  // PostHog Configuration
  posthog: {
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || "",
    apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    enabled: true, // Set to false to disable PostHog in specific environments
    capturePageViews: ENVIRONMENT === "prod", // Auto-capture only in prod
    capturePageLeaves: ENVIRONMENT === "prod",
  },

  // Feature Flags (can be environment-specific)
  features: {
    enableAnalytics: true,
    enableErrorTracking: true,
    enableLeaderboards: true,
    showDebugInfo: ENVIRONMENT !== "prod",
  },

  // Payment Configuration (PayFast)
  payment: {
    // These should come from environment variables
    merchantId: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || "",
    merchantKey: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || "",
    isSandbox: ENVIRONMENT !== "prod",
  },
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get full API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

/**
 * Get full app URL for a path
 */
export function getAppUrl(path: string = ""): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return cleanPath ? `${APP_URL}/${cleanPath}` : APP_URL;
}

/**
 * Log environment info (only in dev)
 */
export function logEnvironmentInfo() {
  if (CONFIG.isDevelopment) {
    console.log("=".repeat(60));
    console.log("Environment Configuration");
    console.log("=".repeat(60));
    console.log(`Environment: ${ENVIRONMENT}`);
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`App URL: ${APP_URL}`);
    console.log(`PostHog Enabled: ${CONFIG.posthog.enabled}`);
    console.log("=".repeat(60));
  }
}

// Log on import in development
if (typeof window !== "undefined") {
  logEnvironmentInfo();
}
