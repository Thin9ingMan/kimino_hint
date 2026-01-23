# Custom Cache System

A lightweight, reactive cache system for React applications, designed to replace Tanstack Query.

## Features

- ✅ **Lightweight**: ~5KB vs TSQ's ~50KB
- ✅ **Reactive**: Uses `useSyncExternalStore` - no useEffect needed
- ✅ **Suspense Support**: Full support for React Suspense
- ✅ **Flexible Policies**: Different cache strategies per data type
- ✅ **Non-coherent**: Explicit invalidation - predictable behavior
- ✅ **Safe by Default**: When unsure, refetch data
- ✅ **TypeScript**: Fully typed API

## Quick Start

### 1. Setup Provider

```tsx
import { CacheProvider } from '@/shared/cache';

function App() {
  return (
    <CacheProvider>
      <YourApp />
    </CacheProvider>
  );
}
```

### 2. Query Data

```tsx
import { useQuery, CachePolicies } from '@/shared/cache';

function MyProfile() {
  const profile = useQuery(
    ['profile', 'me'],
    () => api.getMyProfile(),
    CachePolicies.MY_PROFILE
  );

  return <div>Hello, {profile.name}</div>;
}
```

### 3. Mutate Data

```tsx
import { useMutation } from '@/shared/cache';

function UpdateProfile() {
  const { mutate, status } = useMutation(
    (data) => api.updateProfile(data),
    {
      onSuccess: () => console.log('Updated!'),
      invalidateKeys: [['profile', 'me']],
    }
  );

  return (
    <button onClick={() => mutate({ name: 'New Name' })}>
      {status === 'loading' ? 'Saving...' : 'Save'}
    </button>
  );
}
```

## Core Concepts

### Cache Keys

Cache keys uniquely identify cached data. They can be:

- **String**: `'user'`
- **Array**: `['users', userId]`
- **Nested**: `['events', 'list', { status: 'active' }]`

Keys are automatically serialized and normalized for consistency.

### Cache Policies

Control how data is cached and revalidated:

```typescript
interface CachePolicy {
  ttl?: number;                  // Time to live (ms)
  staleWhileRevalidate?: boolean; // Return stale data while refetching
  onDemandOnly?: boolean;         // Never auto-revalidate
}
```

#### Built-in Policies

```typescript
import { CachePolicies } from '@/shared/cache';

// For current user profile (5 min TTL, stale-while-revalidate)
CachePolicies.MY_PROFILE

// For other users (30s TTL)
CachePolicies.USER_PROFILE

// For frequently updated data (10s TTL)
CachePolicies.DYNAMIC_DATA

// For static data (never expires, manual invalidation only)
CachePolicies.STATIC_DATA

// For no caching (always refetch)
CachePolicies.NO_CACHE
```

## API Reference

### useQuery

Query data with caching and Suspense support.

```typescript
function useQuery<T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  policy?: CachePolicy
): T
```

**Example:**

```tsx
const user = useQuery(['user', userId], () => api.getUser(userId), {
  ttl: 30000, // 30 seconds
  staleWhileRevalidate: true,
});
```

### useMutation

Perform mutations with automatic cache invalidation.

```typescript
function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidateKeys?: CacheKey[];
  }
): MutationResult<TData, TVariables>
```

**Example:**

```tsx
const { mutate, status, data, error } = useMutation(
  (id) => api.deleteUser(id),
  {
    onSuccess: () => {
      console.log('Deleted!');
    },
    invalidateKeys: [['users', 'list']],
  }
);
```

### useInvalidate

Manually invalidate cache entries.

```typescript
function useInvalidate(): (pattern: CacheKey | ((key: CacheKey) => boolean)) => void
```

**Examples:**

```tsx
const invalidate = useInvalidate();

// Invalidate specific key
invalidate(['user', userId]);

// Invalidate by pattern
invalidate((key) => {
  if (Array.isArray(key) && key[0] === 'users') {
    return true; // Invalidate all user-related keys
  }
  return false;
});
```

### usePrefetch

Prefetch data into the cache.

```typescript
function usePrefetch(): <T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  policy?: CachePolicy
) => void
```

**Example:**

```tsx
const prefetch = usePrefetch();

<div onMouseEnter={() => prefetch(['user', userId], () => api.getUser(userId))}>
  {userName}
</div>
```

## Patterns

### Pattern 1: Different Policies for Different Data

```tsx
// Aggressive caching for own profile
function useMyProfile() {
  return useQuery(['profile', 'me'], api.getMyProfile, CachePolicies.MY_PROFILE);
}

// Short-lived cache for other users
function useUserProfile(userId: string) {
  return useQuery(['profile', userId], () => api.getProfile(userId), CachePolicies.USER_PROFILE);
}

// No cache for real-time data
function useLiveData(id: string) {
  return useQuery(['live', id], () => api.getLiveData(id), CachePolicies.NO_CACHE);
}
```

### Pattern 2: Bulk Invalidation

```tsx
function useDeleteEvent() {
  const invalidate = useInvalidate();

  return useMutation(
    (eventId) => api.deleteEvent(eventId),
    {
      onSuccess: (_, eventId) => {
        // Specific event
        invalidate(['events', eventId]);

        // All event lists
        invalidate((key) => Array.isArray(key) && key[0] === 'events' && key[1] === 'list');
      },
    }
  );
}
```

### Pattern 3: Optimistic Updates

```tsx
function useUpdateProfile() {
  const invalidate = useInvalidate();

  return useMutation(
    (data) => api.updateProfile(data),
    {
      onSuccess: () => {
        // Invalidate immediately - next render will fetch fresh data
        invalidate(['profile', 'me']);
      },
    }
  );
}
```

### Pattern 4: Conditional Caching

```tsx
function useConditionalQuery(enabled: boolean) {
  const policy = enabled
    ? CachePolicies.DYNAMIC_DATA
    : CachePolicies.NO_CACHE;

  return useQuery(['data'], api.getData, policy);
}
```

## Migration from Tanstack Query

### Before (TSQ)

```tsx
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId),
    staleTime: 30000,
  });

  const handleUpdate = async () => {
    await api.updateUser(userId, newData);
    await queryClient.invalidateQueries({ queryKey: ['user', userId] });
  };

  return <div>{data.name}</div>;
}
```

### After (Custom Cache)

```tsx
import { useQuery, useMutation } from '@/shared/cache';

function MyComponent() {
  const data = useQuery(['user', userId], () => api.getUser(userId), {
    ttl: 30000,
  });

  const { mutate } = useMutation(
    (newData) => api.updateUser(userId, newData),
    {
      invalidateKeys: [['user', userId]],
    }
  );

  return <div>{data.name}</div>;
}
```

## Comparison with Tanstack Query

| Feature | TSQ | Custom Cache |
|---------|-----|--------------|
| **Bundle Size** | ~50KB | ~5KB |
| **Caching Strategy** | Automatic, sometimes unpredictable | Explicit, predictable |
| **DevTools** | Yes | No |
| **Learning Curve** | Steep | Shallow |
| **Flexibility** | High (many options) | Moderate (focused features) |
| **Maintenance** | Community | Your team |
| **Best For** | Large apps with complex requirements | Small-to-medium apps with clear requirements |

## Best Practices

### 1. Choose the Right Policy

- **Own profile, settings**: `MY_PROFILE` (long TTL, stale-while-revalidate)
- **Other users, public data**: `USER_PROFILE` (short TTL)
- **Real-time data, frequently updated**: `DYNAMIC_DATA` or `NO_CACHE`
- **Static resources**: `STATIC_DATA` (manual invalidation only)

### 2. Use Consistent Cache Keys

```tsx
// Good: Consistent structure
['users', userId]
['events', 'list', { status: 'active' }]

// Bad: Inconsistent
['user', userId]
['userDetails', userId]
```

### 3. Invalidate Related Data

When mutating data, think about what other cache entries might be affected:

```tsx
// When creating a new event
invalidate((key) => Array.isArray(key) && key[0] === 'events' && key[1] === 'list');

// When updating a user
invalidate(['user', userId]);
invalidate(['users', 'list']); // If user appears in list
```

### 4. Avoid Over-Caching

Don't cache data that changes frequently or is cheap to fetch:

```tsx
// Bad: Caching fast, volatile data
useQuery(['timestamp'], () => Promise.resolve(Date.now()), { ttl: 5000 });

// Good: Just compute it
const timestamp = Date.now();
```

### 5. Use Prefetching Wisely

Prefetch data that users are likely to access next:

```tsx
// Good: Prefetch on hover
<Link onMouseEnter={() => prefetch(['user', userId], fetchUser)}>
  View Profile
</Link>

// Bad: Prefetching unlikely data
prefetch(['random'], fetchRandomData); // User probably won't need this
```

## Troubleshooting

### Data Not Updating

Check if the cache policy is too aggressive:

```tsx
// If data is stuck, reduce TTL or enable staleWhileRevalidate
const data = useQuery(['key'], fetcher, {
  ttl: 5000, // Shorter TTL
  staleWhileRevalidate: true, // Background updates
});
```

### Too Many Requests

Increase TTL or use `onDemandOnly`:

```tsx
const data = useQuery(['key'], fetcher, {
  ttl: 5 * 60 * 1000, // 5 minutes
  onDemandOnly: true, // Manual invalidation only
});
```

### Memory Issues

Cache is storing too much data. Use more aggressive invalidation:

```tsx
// Invalidate old data periodically
useEffect(() => {
  const timer = setInterval(() => {
    invalidate((key) => /* check if old */);
  }, 60000);
  return () => clearInterval(timer);
}, []);
```

## Examples

See the [examples](./examples/) directory for complete examples:

- [Profile Example](./examples/profile-example.tsx) - Basic usage with profile data
- [Event Example](./examples/event-example.tsx) - Pattern-based invalidation and complex scenarios

## License

This is a custom implementation for the Kimino Hint project.
