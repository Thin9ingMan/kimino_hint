import {
  useSuspenseQuery as useTanstackSuspenseQuery,
  useSuspenseQueries as useTanstackSuspenseQueries,
  type QueryKey,
  type UseSuspenseQueryOptions as TanstackUseSuspenseQueryOptions,
} from "@tanstack/react-query";

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
  options?: UseSuspenseQueryOptions<TQueryFnData, TData>
): TData {
  const { data } = useTanstackSuspenseQuery({
    queryKey,
    queryFn,
    ...(options ?? {}),
  });

  return data;
}

// Explicit tuple type for type inference
// [Key, Fn] or [Key, Fn, Options]
export type SuspenseQueryTuple<TData = unknown> =
  | [QueryKey, () => Promise<TData>]
  | [
      QueryKey,
      () => Promise<TData>,
      UseSuspenseQueryOptions<TData, TData> | undefined,
    ];

/**
 * Wrapper for useSuspenseQueries to execute multiple queries in parallel.
 * Accepts ONLY an array of tuples [key, fn] or [key, fn, options].
 * Infers valid return types.
 */
export function useSuspenseQueries<T extends readonly unknown[]>(queries: {
  [K in keyof T]: SuspenseQueryTuple<T[K]>;
}): T {
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

  return results.map((r) => r.data) as any as T;
}