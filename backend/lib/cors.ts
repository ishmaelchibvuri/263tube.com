import { APIGatewayProxyEvent } from "aws-lambda";
import { getCorsOrigin, logCorsRequest, isOriginAllowed, CONFIG } from "./config";

/**
 * CORS Helper Module
 *
 * Provides CORS headers based on the request origin
 */

/**
 * Get CORS headers for a given request
 * Returns origin-specific headers for better security
 */
export function getCorsHeaders(event: APIGatewayProxyEvent): Record<string, string> {
  const requestOrigin = event.headers.origin || event.headers.Origin;
  const corsOrigin = getCorsOrigin(requestOrigin);
  const allowed = isOriginAllowed(requestOrigin);

  // Log CORS request in development
  logCorsRequest(requestOrigin, allowed);

  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": CONFIG.cors.allowedHeaders.join(","),
    "Access-Control-Allow-Methods": CONFIG.cors.allowedMethods.join(","),
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": CONFIG.cors.maxAge.toString(),
  };
}

/**
 * Create a CORS preflight response (OPTIONS)
 */
export function createPreflightResponse(event: APIGatewayProxyEvent) {
  return {
    statusCode: 200,
    headers: getCorsHeaders(event),
    body: "",
  };
}
