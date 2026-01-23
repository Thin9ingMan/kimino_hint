/**
 * Custom Cache System - Main Entry Point
 * 
 * A lightweight, reactive cache system for React applications.
 * Designed to replace Tanstack Query with a simpler, more predictable API.
 * 
 * @example
 * ```tsx
 * import { CacheProvider, useQuery, CachePolicies } from '@/shared/cache';
 * 
 * // In your app root:
 * function App() {
 *   return (
 *     <CacheProvider>
 *       <MyApp />
 *     </CacheProvider>
 *   );
 * }
 * 
 * // In your components:
 * function MyProfile() {
 *   const profile = useQuery(
 *     ['profile', 'me'],
 *     () => api.getMyProfile(),
 *     CachePolicies.MY_PROFILE
 *   );
 *   return <div>{profile.name}</div>;
 * }
 * ```
 */

// Core store
export { CacheStore, getCacheStore, resetCacheStore } from './CacheStore';

// React integration
export { CacheProvider, useCacheStore } from './CacheProvider';

// Hooks
export { useQuery, useInvalidate, useMutation, usePrefetch } from './hooks';
export type { MutationState, MutationOptions, MutationResult } from './hooks';

// Types
export { CachePolicies } from './types';
export type { CacheKey, CachePolicy, CacheStatus, CacheEntry } from './types';

// Utils
export { serializeKey, matchesKey } from './utils';
