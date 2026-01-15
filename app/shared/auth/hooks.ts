import { apis } from "@/shared/api";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import type { QueryKey } from "@tanstack/react-query";

/**
 * Shared query configuration for the current user.
 */
export const currentUserQuery = [
  ["auth.getCurrentUser"] as QueryKey,
  () => apis.auth.getCurrentUser(),
] as const;

/**
 * Hook to retrieve the current user's information.
 */
export function useCurrentUser() {
  return useSuspenseQuery(...currentUserQuery);
}
