/**
 * Distributed Cache using DynamoDB with TTL
 *
 * AWS Free Tier Compatible:
 * - Uses existing DynamoDB table (no additional cost)
 * - TTL automatically deletes expired items (no manual cleanup cost)
 * - Read/write capacity within free tier (25 RCU/WCU)
 *
 * Benefits over in-memory cache:
 * - Shared across all Lambda instances
 * - Survives cold starts
 * - Automatic cleanup with DynamoDB TTL
 */

import { DatabaseService, DynamoDBItem } from "./database";

export class DistributedCache {
  private static readonly CACHE_PREFIX = "CACHE#";
  private static readonly DEFAULT_TTL_SECONDS = 600; // 10 minutes

  /**
   * Get value from distributed cache
   * @param key Cache key
   * @returns Cached value or undefined if not found/expired
   */
  static async get<T>(key: string): Promise<T | undefined> {
    try {
      const cacheKey = this.buildCacheKey(key);
      const item = await DatabaseService.getItem(cacheKey, "DATA");

      if (!item) {
        return undefined;
      }

      // Check if expired (backup check, DynamoDB TTL handles actual deletion)
      const now = Math.floor(Date.now() / 1000);
      if (item.ttl && item.ttl < now) {
        console.log(`Cache entry expired: ${key}`);
        return undefined;
      }

      console.log(`Distributed cache HIT: ${key}`);
      return item.value as T;
    } catch (error) {
      console.error(`Error getting from distributed cache: ${key}`, error);
      return undefined;
    }
  }

  /**
   * Set value in distributed cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds TTL in seconds (default: 10 minutes)
   */
  static async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = this.DEFAULT_TTL_SECONDS
  ): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(key);
      const now = Math.floor(Date.now() / 1000);
      const ttl = now + ttlSeconds;

      const item: DynamoDBItem = {
        PK: cacheKey,
        SK: "DATA",
        value,
        ttl, // DynamoDB TTL attribute
        createdAt: new Date().toISOString(),
        entityType: "CACHE",
      };

      await DatabaseService.putItem(item);
      console.log(`Distributed cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.error(`Error setting distributed cache: ${key}`, error);
      // Don't throw - cache failures shouldn't break the app
    }
  }

  /**
   * Delete value from cache
   * @param key Cache key
   */
  static async delete(key: string): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(key);
      await DatabaseService.deleteItem(cacheKey, "DATA");
      console.log(`Distributed cache DELETE: ${key}`);
    } catch (error) {
      console.error(`Error deleting from distributed cache: ${key}`, error);
    }
  }

  /**
   * Cache-or-fetch pattern with automatic cache miss handling
   * @param key Cache key
   * @param getter Function to fetch value on cache miss
   * @param ttlSeconds TTL in seconds
   * @returns Cached or freshly fetched value
   */
  static async getOrFetch<T>(
    key: string,
    getter: () => Promise<T>,
    ttlSeconds: number = this.DEFAULT_TTL_SECONDS
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    // Cache miss - fetch and cache
    console.log(`Distributed cache MISS: ${key}`);
    const value = await getter();

    // Don't await cache write - return value immediately
    this.set(key, value, ttlSeconds).catch(err =>
      console.error(`Background cache write failed for ${key}:`, err)
    );

    return value;
  }

  /**
   * Invalidate cache entries by prefix
   * Useful for invalidating related cache entries
   * @param prefix Cache key prefix
   */
  static async invalidateByPrefix(prefix: string): Promise<void> {
    console.log(`Invalidating distributed cache entries with prefix: ${prefix}`);
    const cachePrefix = this.buildCacheKey(prefix);

    try {
      const items = await DatabaseService.queryItems(
        "begins_with(PK, :prefix) AND SK = :sk",
        {
          ":prefix": cachePrefix,
          ":sk": "DATA",
        }
      );

      console.log(`Found ${items.length} cache entries to invalidate`);

      for (const item of items) {
        if (item.PK && item.SK) {
          await DatabaseService.deleteItem(item.PK as string, item.SK as string);
        }
      }
    } catch (error) {
      console.error(`Error invalidating cache by prefix: ${prefix}`, error);
    }
  }

  /**
   * Build cache key with prefix
   */
  private static buildCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }
}

/**
 * Hybrid cache: In-memory first (fast), DynamoDB second (distributed)
 *
 * Strategy:
 * - Check in-memory cache first (< 1ms)
 * - On miss, check DynamoDB cache (10-20ms)
 * - On miss, fetch from source and populate both caches
 *
 * Benefits:
 * - Best of both worlds: speed + distribution
 * - Minimizes DynamoDB reads (cost optimization)
 * - Lambda warm starts benefit from in-memory cache
 */

import { cache as inMemoryCache } from "./cache";

export class HybridCache {
  /**
   * Get value from hybrid cache (in-memory → DynamoDB → fetch)
   */
  static async getOrFetch<T>(
    key: string,
    getter: () => Promise<T>,
    ttlSeconds: number = 600
  ): Promise<T> {
    // Level 1: In-memory cache (fastest)
    const memCached = inMemoryCache.get<T>(key);
    if (memCached !== undefined) {
      console.log(`L1 cache HIT (in-memory): ${key}`);
      return memCached;
    }

    // Level 2: Distributed cache (DynamoDB)
    const dbCached = await DistributedCache.get<T>(key);
    if (dbCached !== undefined) {
      console.log(`L2 cache HIT (DynamoDB): ${key}`);
      // Populate L1 cache for next time
      inMemoryCache.set(key, dbCached, ttlSeconds * 1000);
      return dbCached;
    }

    // Cache miss - fetch from source
    console.log(`Cache MISS (all levels): ${key}`);
    const value = await getter();

    // Populate both cache levels (non-blocking)
    inMemoryCache.set(key, value, ttlSeconds * 1000);
    DistributedCache.set(key, value, ttlSeconds).catch(err =>
      console.error(`L2 cache write failed: ${err}`)
    );

    return value;
  }

  /**
   * Invalidate from all cache levels
   */
  static async invalidate(key: string): Promise<void> {
    inMemoryCache.delete(key);
    await DistributedCache.delete(key);
  }

  /**
   * Invalidate by prefix from all cache levels
   */
  static async invalidateByPrefix(prefix: string): Promise<void> {
    // In-memory cache doesn't support prefix invalidation efficiently
    // So we clear all (acceptable since it's per-Lambda instance)
    inMemoryCache.clear();
    await DistributedCache.invalidateByPrefix(prefix);
  }
}
