/**
 * Custom Cache System - React Context Provider
 * 
 * Provides the cache store to the React component tree.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { CacheStore, getCacheStore } from './CacheStore';

const CacheContext = createContext<CacheStore | null>(null);

export interface CacheProviderProps {
  children: React.ReactNode;
  store?: CacheStore; // Optional custom store (mainly for testing)
}

/**
 * Provider component that makes the cache store available to child components.
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <CacheProvider>
 *       <MyComponents />
 *     </CacheProvider>
 *   );
 * }
 * ```
 */
export function CacheProvider({ children, store }: CacheProviderProps) {
  const cacheStore = useMemo(() => store ?? getCacheStore(), [store]);

  return (
    <CacheContext.Provider value={cacheStore}>
      {children}
    </CacheContext.Provider>
  );
}

/**
 * Hook to access the cache store from context.
 * 
 * @returns The cache store instance
 * @throws Error if used outside of CacheProvider
 */
export function useCacheStore(): CacheStore {
  const store = useContext(CacheContext);

  if (!store) {
    throw new Error('useCacheStore must be used within a CacheProvider');
  }

  return store;
}
