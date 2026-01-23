/**
 * Example: Using Custom Cache System for Profile Data
 * 
 * This file demonstrates how to migrate from Tanstack Query to the custom cache system.
 * It shows patterns for:
 * - Reading data (useQuery)
 * - Mutations with cache invalidation
 * - Different cache policies for different data types
 */

import { useQuery, useMutation, CachePolicies, usePrefetch } from '@/shared/cache';
import { apis } from '@/shared/api';
import type { CachePolicy } from '@/shared/cache';

/**
 * EXAMPLE 1: Current User's Profile
 * 
 * This data should be cached aggressively since it rarely changes
 * and is accessed frequently throughout the app.
 */

// Define custom policy if needed
const MY_PROFILE_POLICY: CachePolicy = {
  ttl: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true, // Show old data while fetching new
  onDemandOnly: false,
};

/**
 * Hook to get the current user's profile.
 * 
 * BEFORE (with TSQ):
 * ```tsx
 * export function useMyProfile() {
 *   return useSuspenseQuery(...myProfileQuery);
 * }
 * ```
 * 
 * AFTER (with custom cache):
 */
export function useMyProfile() {
  return useQuery(
    ['profiles', 'me'], // Cache key
    () => apis.profiles.getMyProfile(), // Fetcher function
    CachePolicies.MY_PROFILE // Or use MY_PROFILE_POLICY
  );
}

/**
 * EXAMPLE 2: Other User's Profile
 * 
 * This data should have a shorter TTL since other users' data
 * might be updated more frequently.
 */
export function useUserProfile(userId: string) {
  return useQuery(
    ['profiles', userId],
    () => apis.profiles.getProfile({ userId }),
    CachePolicies.USER_PROFILE // 30 second TTL
  );
}

/**
 * EXAMPLE 3: Mutation - Update Profile
 * 
 * Shows how to invalidate cache after a mutation.
 * 
 * BEFORE (with TSQ):
 * ```tsx
 * const queryClient = useQueryClient();
 * const handleUpdate = async () => {
 *   await apis.profiles.updateMyProfile(data);
 *   await queryClient.invalidateQueries({ queryKey: ['profiles', 'me'] });
 * };
 * ```
 * 
 * AFTER (with custom cache):
 */
export function useUpdateMyProfile() {
  return useMutation(
    (profile: any) => apis.profiles.updateMyProfile({ profile }),
    {
      onSuccess: () => {
        console.log('Profile updated successfully!');
      },
      invalidateKeys: [['profiles', 'me']], // Automatically invalidates
    }
  );
}

/**
 * EXAMPLE 4: Using in a Component
 * 
 * NO useEffect needed - the hook is reactive!
 */
export function MyProfileScreen() {
  const profile = useMyProfile();
  const { mutate, status } = useUpdateMyProfile();

  const handleUpdate = async () => {
    try {
      await mutate({ name: 'New Name' });
      // Cache is automatically invalidated, component re-renders with new data
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <div>
      <h1>{profile.name}</h1>
      <button onClick={handleUpdate} disabled={status === 'loading'}>
        Update Profile
      </button>
    </div>
  );
}

/**
 * EXAMPLE 5: Prefetching
 * 
 * Prefetch data on hover for better UX.
 */
export function UserListItem({ userId, name }: { userId: string; name: string }) {
  const prefetch = usePrefetch();

  const handleMouseEnter = () => {
    // Prefetch user profile data
    prefetch(
      ['profiles', userId],
      () => apis.profiles.getProfile({ userId }),
      CachePolicies.USER_PROFILE
    );
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      <a href={`/users/${userId}`}>{name}</a>
    </div>
  );
}
