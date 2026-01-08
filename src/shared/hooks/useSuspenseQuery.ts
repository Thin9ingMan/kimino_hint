import { useRef } from "react";

type AsyncState<T> = {
  status: "pending" | "fulfilled" | "rejected";
  value?: T;
  error?: Error;
};

/**
 * Suspense-compatible hook for async operations.
 * Throws promise on first call (causing Suspense to show fallback),
 * throws error on rejection, returns data on success.
 */
export function useSuspenseQuery<T>(
  queryFn: () => Promise<T>,
  deps: ReadonlyArray<unknown> = []
): T {
  const stateRef = useRef<AsyncState<T> | null>(null);
  const depsRef = useRef<ReadonlyArray<unknown> | undefined>(undefined);

  // Check if dependencies changed
  const depsChanged = 
    !depsRef.current || 
    depsRef.current.length !== deps.length ||
    depsRef.current.some((dep, i) => dep !== deps[i]);

  if (depsChanged || !stateRef.current) {
    depsRef.current = deps;
    stateRef.current = { status: "pending" };

    const promise = queryFn()
      .then((value) => {
        if (stateRef.current?.status === "pending") {
          stateRef.current = { status: "fulfilled", value };
        }
      })
      .catch((error) => {
        if (stateRef.current?.status === "pending") {
          stateRef.current = { status: "rejected", error };
        }
      });

    // Throw promise to trigger Suspense
    throw promise;
  }

  const state = stateRef.current;

  if (state.status === "rejected") {
    throw state.error;
  }

  if (state.status === "pending") {
    throw new Promise(() => {}); // This shouldn't happen, but just in case
  }

  return state.value as T;
}