/**
 * Simple CORS Wrapper for Lambda Functions
 *
 * Usage:
 * import { withCorsWrapper } from '../../lib/cors-wrapper';
 *
 * const baseHandler = async (event) => {
 *   // Your handler logic here
 *   return { statusCode: 200, body: JSON.stringify({ data: 'something' }) };
 * };
 *
 * export const handler = withCorsWrapper(baseHandler);
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getCorsOrigin, CONFIG, logCorsRequest, isOriginAllowed } from './config';

/**
 * CORS headers - uses centralized config from config.ts
 */
function getCorsHeaders(event: APIGatewayProxyEvent): Record<string, string> {
  const requestOrigin = event.headers?.origin || event.headers?.Origin;
  const allowedOrigin = getCorsOrigin(requestOrigin);

  // Log CORS request in dev/qa
  logCorsRequest(requestOrigin, isOriginAllowed(requestOrigin));

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': CONFIG.cors.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': CONFIG.cors.allowedHeaders.join(', '),
    'Access-Control-Max-Age': CONFIG.cors.maxAge.toString(),
    'Content-Type': 'application/json',
  };
}

/**
 * Handle OPTIONS preflight request
 */
function handleOptionsRequest(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: getCorsHeaders(event),
    body: '',
  };
}

/**
 * Wrapper function to add CORS support to Lambda handlers
 *
 * @param handler - Your Lambda handler function
 * @returns Wrapped handler with CORS support
 */
export function withCorsWrapper(
  handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>
) {
  return async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`[CORS] ${event.httpMethod} request from origin: ${event.headers?.origin || 'unknown'}`);

    // Handle OPTIONS preflight request
    if (event.httpMethod === 'OPTIONS') {
      console.log('[CORS] Handling OPTIONS preflight request');
      return handleOptionsRequest(event);
    }

    try {
      // Execute the actual handler
      const result = await handler(event, context);

      // Get CORS headers
      const corsHeaders = getCorsHeaders(event);

      // Add CORS headers to the response
      return {
        ...result,
        headers: {
          ...corsHeaders,
          ...(result.headers || {}), // Preserve existing headers
        },
      };
    } catch (error: any) {
      console.error('[CORS] Handler error:', error);

      // Return error response with CORS headers
      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Internal server error',
          timestamp: new Date().toISOString(),
        }),
      };
    }
  };
}

/**
 * Quick response helpers with CORS
 */
export function successResponse(data: any, statusCode = 200, event: APIGatewayProxyEvent): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getCorsHeaders(event),
    body: JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }),
  };
}

export function errorResponse(message: string, statusCode = 500, event: APIGatewayProxyEvent): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getCorsHeaders(event),
    body: JSON.stringify({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    }),
  };
}
