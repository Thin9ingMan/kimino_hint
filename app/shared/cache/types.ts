/**
 * Custom Cache System - Type Definitions
 * 
 * A lightweight, reactive cache system to replace Tanstack Query.
 * This is a PROOF OF CONCEPT implementation.
 */

export type CacheKey = string | readonly unknown[];

/**
 * Cache policy defining how data should be cached and revalidated.
 */
export interface CachePolicy {
  /**
   * Time to live in milliseconds. After this time, the cache entry is considered stale.
   * undefined = no expiration (cache indefinitely until explicitly invalidated)
   */
  ttl?: number;

  /**
   * If true, returns stale data immediately while revalidating in the background.
   * If false, waits for revalidation before returning data.
   */
  staleWhileRevalidate?: boolean;

  /**
   * If true, never automatically revalidate. Only invalidate on explicit calls.
   * Useful for static data that rarely changes.
   */
  onDemandOnly?: boolean;
}

/**
 * Status of a cache entry.
 */
export type CacheStatus = 'fresh' | 'stale' | 'fetching' | 'error';

/**
 * Cache entry storing data with metadata.
 */
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  policy: CachePolicy;
  status: CacheStatus;
  error?: Error;
}

/**
 * Default cache policies for common data types.
 */
export const CachePolicies = {
  /**
   * For current user's profile - cache aggressively
   */
  MY_PROFILE: {
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true,
    onDemandOnly: false,
  } as CachePolicy,

  /**
   * For other users' profiles - cache briefly
   */
  USER_PROFILE: {
    ttl: 30 * 1000, // 30 seconds
    staleWhileRevalidate: false,
    onDemandOnly: false,
  } as CachePolicy,

  /**
   * For frequently updated data (events, real-time data)
   */
  DYNAMIC_DATA: {
    ttl: 10 * 1000, // 10 seconds
    staleWhileRevalidate: false,
    onDemandOnly: false,
  } as CachePolicy,

  /**
   * For static data that rarely changes
   */
  STATIC_DATA: {
    ttl: undefined, // Never expires
    staleWhileRevalidate: false,
    onDemandOnly: true, // Only invalidate explicitly
  } as CachePolicy,

  /**
   * For data that should not be cached
   */
  NO_CACHE: {
    ttl: 0,
    staleWhileRevalidate: false,
    onDemandOnly: true,
  } as CachePolicy,
} as const;
