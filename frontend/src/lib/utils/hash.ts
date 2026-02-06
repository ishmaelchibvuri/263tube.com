import { createHmac } from "crypto";

/**
 * Generate a deterministic tracking ID from a request ID.
 * Uses HMAC-SHA256 truncated to 16 hex characters.
 */
export function hashRequestId(requestId: string): string {
  const secret = process.env.TRACKING_HASH_SECRET || "263tube-track-salt";
  return createHmac("sha256", secret)
    .update(requestId)
    .digest("hex")
    .slice(0, 16);
}
