/**
 * Centralized Configuration for Backend
 *
 * This configuration is determined at RUNTIME based on the ENVIRONMENT
 * environment variable set by the infrastructure (CDK).
 *
 * This controls:
 * - CORS allowed origins
 * - API endpoints
 * - Environment-specific settings
 */

// =============================================================================
// RUNTIME ENVIRONMENT DETECTION
// =============================================================================

/**
 * Get environment from Lambda environment variable
 * Falls back to 'dev' for local development
 */
export const ENVIRONMENT = (process.env.ENVIRONMENT || "dev") as "dev" | "qa" | "prod";

/**
 * Get allowed origins based on runtime environment
 */
function getAllowedOrigins(): string[] {
  switch (ENVIRONMENT) {
    case "prod":
      return [
        "https://quickbudget.co.za",
        "https://www.quickbudget.co.za",
        "http://localhost:3000",
      ];

    case "qa":
      return [
        "https://qa.quickbudget.co.za",
        "http://localhost:3000",
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

export const ALLOWED_ORIGINS = getAllowedOrigins();

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

/**
 * Get CORS origin based on request origin
 * Returns the matching allowed origin or '*' if not found
 */
export function getCorsOrigin(requestOrigin?: string): string {
  if (!requestOrigin) {
    return "*";
  }

  // Check if the request origin is in our allowed list
  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  // For development, allow all localhost variations
  if (ENVIRONMENT === "dev" && requestOrigin.includes("localhost")) {
    return requestOrigin;
  }

  // Default to first allowed origin or '*'
  return ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS[0]! : "*";
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin?: string): boolean {
  if (!origin) {
    return true; // Allow requests without origin header
  }

  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // For development, allow all localhost variations
  if (ENVIRONMENT === "dev" && origin.includes("localhost")) {
    return true;
  }

  return false;
}

// =============================================================================
// ENVIRONMENT-SPECIFIC SETTINGS
// =============================================================================

export const CONFIG = {
  environment: ENVIRONMENT,
  allowedOrigins: ALLOWED_ORIGINS,
  isDevelopment: ENVIRONMENT === "dev",
  isQA: ENVIRONMENT === "qa",
  isProduction: ENVIRONMENT === "prod",

  // CORS Settings
  cors: {
    allowedOrigins: ALLOWED_ORIGINS,
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "X-Amz-Date",
      "Authorization",
      "X-Api-Key",
      "X-Amz-Security-Token",
      "x-impersonate-tier",
    ],
    maxAge: 86400, // 24 hours
  },

  // Logging
  logging: {
    level: ENVIRONMENT === "prod" ? "error" : "debug",
    logCorsRequests: ENVIRONMENT !== "prod",
  },
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Log CORS request (only in dev/qa)
 */
export function logCorsRequest(origin: string | undefined, allowed: boolean) {
  if (CONFIG.logging.logCorsRequests) {
    console.log(`[CORS] Origin: ${origin || "none"} - Allowed: ${allowed}`);
  }
}
