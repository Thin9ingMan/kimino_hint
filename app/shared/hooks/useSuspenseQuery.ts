import {
  useSuspenseQuery as useTanstackSuspenseQuery,
  useSuspenseQueries as useTanstackSuspenseQueries,
  type QueryKey,
  type UseSuspenseQueryOptions as TanstackUseSuspenseQueryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";

export type UseSuspenseQueryOptions<TQueryFnData, TData = TQueryFnData> = Omit<
  TanstackUseSuspenseQueryOptions<TQueryFnData, Error, TData, QueryKey>,
  "queryKey" | "queryFn"
>;

/**
 * Suspense wrapper for TanStack Query (Standard)
 */
export function useSuspenseQuery<TQueryFnData, TData = TQueryFnData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TQueryFnData>,
  invalidateOnUnmount = true,
  options?: UseSuspenseQueryOptions<TQueryFnData, TData>,
): TData {
  const queryClient = useQueryClient();
  const { data } = useTanstackSuspenseQuery({
    queryKey,
    queryFn,
    ...(options ?? {}),
  });

  useEffect(() => {
    return () => {
      // Invalidate any outgoing queries on unmount
      if (invalidateOnUnmount) {
        queryClient.invalidateQueries({ queryKey });
      }
    };
  }, [queryKey, invalidateOnUnmount, queryClient]);

  return data;
}

// Explicit tuple type for type inference
// [Key, Fn] or [Key, Fn, Options]
export type SuspenseQueryTuple<TData = unknown> =
  | readonly [QueryKey, () => Promise<TData>]
  | readonly [
      QueryKey,
      () => Promise<TData>,
      UseSuspenseQueryOptions<TData, TData> | undefined,
    ];

/**
 * Wrapper for useSuspenseQueries to execute multiple queries in parallel.
 * Accepts ONLY an array of tuples [key, fn] or [key, fn, options].
 * Infers valid return types.
 */
export function useSuspenseQueries<T extends readonly unknown[]>(
  queries: {
    [K in keyof T]: SuspenseQueryTuple<T[K]>;
  },
  invalidateOnUnmount = true,
): T {
  const queryClient = useQueryClient();
  const results = useTanstackSuspenseQueries({
    queries: queries.map((q) => {
      const [queryKey, queryFn, options] = q;
      return {
        queryKey,
        queryFn,
        ...(options ?? {}),
      };
    }) as any, // internal casting for tanstack
  });

  useEffect(() => {
    return () => {
      // Invalidate any outgoing queries on unmount
      queries.forEach((q) => {
        queryClient.invalidateQueries({ queryKey: q[0] });
      });
    };
  }, [queryClient, queries, invalidateOnUnmount]);

  return results.map((r) => r.data) as any as T;
}
