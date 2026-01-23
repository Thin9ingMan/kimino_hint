/**
 * Custom Cache System - Utility Functions
 */

import type { CacheKey } from './types';

/**
 * Serialize a cache key to a stable string representation.
 * 
 * This ensures that equivalent keys produce the same string,
 * even if object properties are in different orders.
 */
export function serializeKey(key: CacheKey): string {
  if (typeof key === 'string') {
    return key;
  }

  // For arrays/objects, create a stable JSON string
  return JSON.stringify(key, (k, v) => {
    // Sort object keys for consistency
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v)
        .sort()
        .reduce((acc, key) => {
          acc[key] = v[key];
          return acc;
        }, {} as Record<string, unknown>);
    }
    return v;
  });
}

/**
 * Check if a key matches a pattern.
 * 
 * @param key - The key to check
 * @param pattern - Either a specific key or a predicate function
 * @returns true if the key matches the pattern
 */
export function matchesKey(
  key: string,
  pattern: CacheKey | ((key: CacheKey) => boolean)
): boolean {
  if (typeof pattern === 'function') {
    // Try to deserialize the key back to original form for predicate
    try {
      const originalKey = JSON.parse(key);
      return pattern(originalKey);
    } catch {
      // If deserialization fails, try with string key
      return pattern(key);
    }
  }

  // Direct comparison of serialized keys
  return serializeKey(pattern) === key;
}
