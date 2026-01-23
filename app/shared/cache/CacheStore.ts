/**
 * Custom Cache System - Core Store
 * 
 * A lightweight, reactive cache store using the observer pattern.
 * No dependencies on external state management libraries.
 */

import type { CacheKey, CacheEntry, CachePolicy, CacheStatus } from './types';
import { serializeKey, matchesKey } from './utils';

type Subscriber = () => void;

/**
 * CacheStore - Singleton cache storage with subscription support.
 * 
 * This store:
 * - Holds data with associated policies
 * - Notifies subscribers when data changes
 * - Evaluates cache freshness based on TTL
 * - Supports invalidation by key or predicate
 */
export class CacheStore {
  private cache = new Map<string, CacheEntry>();
  private subscribers = new Map<string, Set<Subscriber>>();
  private globalSubscribers = new Set<Subscriber>();

  /**
   * Subscribe to changes for a specific cache key.
   * 
   * @param key - The cache key to subscribe to
   * @param callback - Called when the data for this key changes
   * @returns Unsubscribe function
   */
  subscribe(key: CacheKey, callback: Subscriber): () => void {
    const stringKey = serializeKey(key);

    if (!this.subscribers.has(stringKey)) {
      this.subscribers.set(stringKey, new Set());
    }
    this.subscribers.get(stringKey)!.add(callback);

    return () => {
      this.subscribers.get(stringKey)?.delete(callback);
    };
  }

  /**
   * Subscribe to all cache changes.
   * 
   * @param callback - Called when any cache entry changes
   * @returns Unsubscribe function
   */
  subscribeGlobal(callback: Subscriber): () => void {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  /**
   * Get cached data for a key.
   * 
   * @param key - The cache key
   * @returns The cached data, or undefined if not found
   */
  get<T>(key: CacheKey): T | undefined {
    const stringKey = serializeKey(key);
    const entry = this.cache.get(stringKey);
    return entry?.data as T | undefined;
  }

  /**
   * Get the full cache entry (with metadata) for a key.
   * 
   * @param key - The cache key
   * @returns The cache entry, or undefined if not found
   */
  getEntry(key: CacheKey): CacheEntry | undefined {
    const stringKey = serializeKey(key);
    return this.cache.get(stringKey);
  }

  /**
   * Set data in the cache.
   * 
   * @param key - The cache key
   * @param data - The data to cache
   * @param policy - The cache policy
   * @param status - The cache status (default: 'fresh')
   */
  set<T>(
    key: CacheKey,
    data: T,
    policy: CachePolicy,
    status: CacheStatus = 'fresh'
  ): void {
    const stringKey = serializeKey(key);

    this.cache.set(stringKey, {
      data,
      timestamp: Date.now(),
      policy,
      status,
    });

    this.notify(stringKey);
  }

  /**
   * Set error status for a cache entry.
   */
  setError(key: CacheKey, error: Error): void {
    const stringKey = serializeKey(key);
    const entry = this.cache.get(stringKey);

    if (entry) {
      entry.status = 'error';
      entry.error = error;
      this.notify(stringKey);
    }
  }

  /**
   * Update the status of a cache entry.
   */
  setStatus(key: CacheKey, status: CacheStatus): void {
    const stringKey = serializeKey(key);
    const entry = this.cache.get(stringKey);

    if (entry) {
      entry.status = status;
      this.notify(stringKey);
    }
  }

  /**
   * Check if data should be refetched based on cache policy.
   * 
   * @param key - The cache key
   * @returns true if data should be refetched
   */
  shouldRefetch(key: CacheKey): boolean {
    const stringKey = serializeKey(key);
    const entry = this.cache.get(stringKey);

    if (!entry) {
      return true; // No data, should fetch
    }

    if (entry.status === 'fetching') {
      return false; // Already fetching
    }

    if (entry.policy.onDemandOnly) {
      return false; // Never auto-refetch
    }

    if (entry.policy.ttl === undefined) {
      return false; // Never expires
    }

    if (entry.policy.ttl === 0) {
      return true; // Always refetch (no cache)
    }

    const age = Date.now() - entry.timestamp;
    return age > entry.policy.ttl;
  }

  /**
   * Check if cached data is stale but can be returned while revalidating.
   * 
   * @param key - The cache key
   * @returns true if stale-while-revalidate should be used
   */
  shouldStaleWhileRevalidate(key: CacheKey): boolean {
    const stringKey = serializeKey(key);
    const entry = this.cache.get(stringKey);

    if (!entry || !entry.policy.staleWhileRevalidate) {
      return false;
    }

    return this.shouldRefetch(key);
  }

  /**
   * Invalidate cache entries.
   * 
   * @param pattern - Cache key or predicate function to match keys
   */
  invalidate(pattern: CacheKey | ((key: CacheKey) => boolean)): void {
    const keysToInvalidate: string[] = [];

    if (typeof pattern === 'function') {
      // Invalidate all matching keys
      for (const key of this.cache.keys()) {
        if (matchesKey(key, pattern)) {
          keysToInvalidate.push(key);
        }
      }
    } else {
      // Invalidate specific key
      const stringKey = serializeKey(pattern);
      if (this.cache.has(stringKey)) {
        keysToInvalidate.push(stringKey);
      }
    }

    // Remove from cache and notify subscribers
    for (const key of keysToInvalidate) {
      this.cache.delete(key);
      this.notify(key);
    }
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.cache.clear();
    this.notifyAll();
  }

  /**
   * Get the number of cached entries.
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Notify subscribers for a specific key.
   */
  private notify(key: string): void {
    // Notify key-specific subscribers
    this.subscribers.get(key)?.forEach((callback) => callback());

    // Notify global subscribers
    this.globalSubscribers.forEach((callback) => callback());
  }

  /**
   * Notify all subscribers.
   */
  private notifyAll(): void {
    for (const subscribers of this.subscribers.values()) {
      subscribers.forEach((callback) => callback());
    }
    this.globalSubscribers.forEach((callback) => callback());
  }
}

// Singleton instance
let storeInstance: CacheStore | null = null;

/**
 * Get the singleton cache store instance.
 */
export function getCacheStore(): CacheStore {
  if (!storeInstance) {
    storeInstance = new CacheStore();
  }
  return storeInstance;
}

/**
 * Reset the cache store (useful for testing).
 */
export function resetCacheStore(): void {
  storeInstance = null;
}
