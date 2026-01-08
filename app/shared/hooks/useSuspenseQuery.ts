import {
  useSuspenseQuery as useTanstackSuspenseQuery,
  type QueryKey,
  type UseSuspenseQueryOptions as TanstackUseSuspenseQueryOptions,
} from "@tanstack/react-query";

export type UseSuspenseQueryOptions<TQueryFnData, TData = TQueryFnData> = Omit<
  TanstackUseSuspenseQueryOptions<TQueryFnData, Error, TData, QueryKey>,
  "queryKey" | "queryFn"
>;

/**
 * Suspense wrapper for TanStack Query.
 *
 * - Uses TanStack's built-in suspense query hook
 * - Throws a promise while loading (so `Suspense` shows fallback)
 * - Throws the error (so `ErrorBoundary` catches it)
 * - Returns resolved `data`
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