/**
 * Custom Cache System - React Hooks
 * 
 * Reactive hooks for querying and mutating data with caching support.
 * Uses React's useSyncExternalStore for efficient subscriptions.
 */

import { useSyncExternalStore, useCallback, useState, useRef } from 'react';
import { getCacheStore } from './CacheStore';
import { serializeKey } from './utils';
import type { CacheKey, CachePolicy } from './types';

// Track ongoing fetch promises for deduplication and Suspense support
const fetchPromises = new Map<string, Promise<unknown>>();

/**
 * Hook to query data with caching and Suspense support.
 * 
 * This hook:
 * - Returns cached data if available and fresh
 * - Throws a Promise for Suspense if data needs to be fetched
 * - Automatically revalidates based on cache policy
 * - Subscribes to cache updates for reactivity
 * 
 * @param key - The cache key
 * @param fetcher - Function to fetch data
 * @param policy - Cache policy (optional)
 * @returns The cached or fetched data
 * 
 * @example
 * ```tsx
 * function MyProfile() {
 *   const profile = useQuery(
 *     ['profile', 'me'],
 *     () => apis.profiles.getMyProfile(),
 *     CachePolicies.MY_PROFILE
 *   );
 *   return <div>{profile.name}</div>;
 * }
 * ```
 */
export function useQuery<T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  policy: CachePolicy = {}
): T {
  const store = getCacheStore();
  const stringKey = serializeKey(key);

  // Subscribe to cache updates
  const data = useSyncExternalStore(
    (onStoreChange) => store.subscribe(key, onStoreChange),
    () => store.getEntry(key),
    () => store.getEntry(key)
  );

  // Determine if we need to fetch
  const shouldFetch = !data || store.shouldRefetch(key);
  const canUseStale = data && store.shouldStaleWhileRevalidate(key);

  // If we can use stale data, trigger background revalidation
  if (canUseStale && shouldFetch) {
    // Trigger fetch in background without blocking render
    if (!fetchPromises.has(stringKey)) {
      const promise = fetcher()
        .then((result) => {
          store.set(key, result, policy, 'fresh');
          fetchPromises.delete(stringKey);
        })
        .catch((error) => {
          store.setError(key, error);
          fetchPromises.delete(stringKey);
        });
      fetchPromises.set(stringKey, promise);
    }
    return data.data as T;
  }

  // If we need fresh data, fetch and throw promise for Suspense
  if (shouldFetch) {
    // Check if already fetching
    if (fetchPromises.has(stringKey)) {
      throw fetchPromises.get(stringKey);
    }

    // Start fetching
    store.setStatus(key, 'fetching');
    const promise = fetcher()
      .then((result) => {
        store.set(key, result, policy, 'fresh');
        fetchPromises.delete(stringKey);
        return result;
      })
      .catch((error) => {
        store.setError(key, error);
        fetchPromises.delete(stringKey);
        throw error;
      });

    fetchPromises.set(stringKey, promise);
    throw promise; // Suspense will catch this
  }

  // Return cached data
  if (data.status === 'error' && data.error) {
    throw data.error;
  }

  return data.data as T;
}

/**
 * Hook to invalidate cache entries.
 * 
 * @returns Function to invalidate cache entries
 * 
 * @example
 * ```tsx
 * function UpdateProfile() {
 *   const invalidate = useInvalidate();
 *   
 *   const handleUpdate = async () => {
 *     await api.updateProfile(data);
 *     invalidate(['profile', 'me']);
 *   };
 * }
 * ```
 */
export function useInvalidate() {
  const store = getCacheStore();

  return useCallback(
    (pattern: CacheKey | ((key: CacheKey) => boolean)) => {
      store.invalidate(pattern);
    },
    [store]
  );
}

/**
 * Mutation state.
 */
export interface MutationState<TData> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: TData;
  error?: Error;
}

/**
 * Options for useMutation hook.
 */
export interface MutationOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  invalidateKeys?: CacheKey[];
}

/**
 * Result of useMutation hook.
 */
export interface MutationResult<TData, TVariables> extends MutationState<TData> {
  mutate: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

/**
 * Hook to perform mutations with cache invalidation.
 * 
 * @param mutationFn - Function to perform the mutation
 * @param options - Mutation options
 * @returns Mutation state and mutate function
 * 
 * @example
 * ```tsx
 * function UpdateProfileForm() {
 *   const { mutate, status } = useMutation(
 *     (data) => apis.profiles.updateMyProfile({ profile: data }),
 *     {
 *       onSuccess: () => console.log('Updated!'),
 *       invalidateKeys: [['profile', 'me']],
 *     }
 *   );
 *   
 *   return (
 *     <form onSubmit={() => mutate(formData)}>
 *       <button disabled={status === 'loading'}>Save</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: MutationOptions<TData>
): MutationResult<TData, TVariables> {
  const invalidate = useInvalidate();
  const [state, setState] = useState<MutationState<TData>>({
    status: 'idle',
  });

  // Use ref to keep options stable
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setState({ status: 'loading' });

      try {
        const data = await mutationFn(variables);
        setState({ status: 'success', data });

        // Invalidate specified cache keys
        optionsRef.current?.invalidateKeys?.forEach((key) => {
          invalidate(key);
        });

        // Call success callback
        optionsRef.current?.onSuccess?.(data);

        return data;
      } catch (error) {
        const err = error as Error;
        setState({ status: 'error', error: err });

        // Call error callback
        optionsRef.current?.onError?.(err);

        throw error;
      }
    },
    [mutationFn, invalidate]
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

/**
 * Hook to prefetch data into the cache.
 * 
 * @param key - The cache key
 * @param fetcher - Function to fetch data
 * @param policy - Cache policy
 * @returns Function to trigger prefetch
 * 
 * @example
 * ```tsx
 * function UserList() {
 *   const prefetch = usePrefetch();
 *   
 *   const handleMouseEnter = (userId: string) => {
 *     prefetch(['user', userId], () => api.getUser(userId), CachePolicies.USER_PROFILE);
 *   };
 * }
 * ```
 */
export function usePrefetch() {
  const store = getCacheStore();

  return useCallback(
    <T>(key: CacheKey, fetcher: () => Promise<T>, policy: CachePolicy = {}) => {
      const stringKey = serializeKey(key);

      // Don't prefetch if already cached and fresh
      if (!store.shouldRefetch(key)) {
        return;
      }

      // Don't prefetch if already fetching
      if (fetchPromises.has(stringKey)) {
        return;
      }

      // Start prefetch
      const promise = fetcher()
        .then((result) => {
          store.set(key, result, policy, 'fresh');
          fetchPromises.delete(stringKey);
        })
        .catch((error) => {
          console.warn('Prefetch failed:', error);
          fetchPromises.delete(stringKey);
        });

      fetchPromises.set(stringKey, promise);
    },
    [store]
  );
}
