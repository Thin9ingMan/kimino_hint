import { apis } from "@/shared/api";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";
import type { QueryKey } from "@tanstack/react-query";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { useMemo } from "react";
import { mapProfileDataToUiProfile } from "./profileUi";

/**
 * Shared query configuration for the current user's profile.
 * Use this to ensure consistent query keys and data structures in the cache.
 */
export const myProfileQuery = [
  ["profiles.getMyProfile"] as QueryKey,
  async () => {
    try {
      const res = await apis.profiles.getMyProfile();
      return res;
    } catch (error) {
      const is404 =
        error instanceof ResponseError && error.response.status === 404;
      if (is404) {
        return null;
      }
      throw error;
    }
  },
] as const;

/**
 * Hook to retrieve the current user's profile raw data.
 */
export function useMyProfile() {
  return useSuspenseQuery(...myProfileQuery);
}

/**
 * Hook to retrieve the current user's profile mapped to UI structure.
 */
export function useMyUiProfile() {
  const data = useMyProfile();
  return useMemo(
    () => mapProfileDataToUiProfile(data?.profileData as any),
    [data],
  );
}
