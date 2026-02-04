/**
 * Simple in-memory cache for Lambda functions
 *
 * NOTE: This is a Lambda-scoped cache that persists across warm starts.
 * For production, consider using ElastiCache/Redis for distributed caching.
 *
 * Features:
 * - TTL-based expiration
 * - Automatic cleanup of expired entries
 * - Type-safe generic interface
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set value in cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs TTL in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, value: T, ttlMs: number = this.DEFAULT_TTL_MS): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete value from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   * Call this periodically to prevent memory bloat
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: Removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance (persists across Lambda warm starts)
export const cache = new SimpleCache();

// Run cleanup periodically (every invocation has a small chance to trigger)
if (Math.random() < 0.1) {
  cache.cleanup();
}

/**
 * Cache helper with async getter pattern
 * Automatically handles cache miss by calling the getter function
 *
 * @param key Cache key
 * @param getter Async function to get value if not in cache
 * @param ttlMs TTL in milliseconds
 * @returns Cached or freshly fetched value
 */
export async function cacheOrFetch<T>(
  key: string,
  getter: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(key);

  if (cached !== undefined) {
    console.log(`Cache HIT: ${key}`);
    return cached;
  }

  // Cache miss - fetch and cache
  console.log(`Cache MISS: ${key}`);
  const value = await getter();
  cache.set(key, value, ttlMs);

  return value;
}
