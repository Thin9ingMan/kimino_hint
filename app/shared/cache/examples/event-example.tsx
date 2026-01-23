/**
 * Example: Using Custom Cache System for Event Data
 * 
 * This demonstrates more complex patterns:
 * - Pattern-based cache invalidation
 * - Multiple related queries
 * - Handling frequently updated data
 */

import { useQuery, useMutation, useInvalidate, CachePolicies } from '@/shared/cache';
import { apis } from '@/shared/api';

/**
 * EXAMPLE 1: Event List
 * 
 * This data changes frequently as events are created/deleted.
 */
export function useEventList(userId: string) {
  return useQuery(
    ['events', 'list', userId],
    () => apis.events.listEventsByUser({ userId }),
    CachePolicies.DYNAMIC_DATA // 10 second TTL
  );
}

/**
 * EXAMPLE 2: Event Detail
 * 
 * Individual event data that needs frequent updates.
 */
export function useEventDetail(eventId: string) {
  return useQuery(
    ['events', 'detail', eventId],
    () => apis.events.getEventById({ eventId }),
    CachePolicies.DYNAMIC_DATA
  );
}

/**
 * EXAMPLE 3: Delete Event with Pattern-Based Invalidation
 * 
 * When deleting an event, we need to:
 * 1. Invalidate the specific event detail
 * 2. Invalidate ALL event lists (since the deleted event might appear in multiple lists)
 * 
 * BEFORE (with TSQ):
 * ```tsx
 * const handleDelete = async () => {
 *   await apis.events.deleteEvent({ eventId });
 *   await queryClient.invalidateQueries({ queryKey: ['events', eventId] });
 *   await queryClient.invalidateQueries({ queryKey: ['events', 'list', userId] });
 * };
 * ```
 * 
 * AFTER (with custom cache):
 */
export function useDeleteEvent() {
  const invalidate = useInvalidate();

  return useMutation(
    (eventId: string) => apis.events.deleteEvent({ eventId }),
    {
      onSuccess: (_, eventId) => {
        // Invalidate specific event
        invalidate(['events', 'detail', eventId]);

        // Pattern-based invalidation: all event lists
        invalidate((key) => {
          if (Array.isArray(key) && key[0] === 'events' && key[1] === 'list') {
            return true;
          }
          return false;
        });
      },
    }
  );
}

/**
 * EXAMPLE 4: Update Event
 * 
 * When updating an event, only invalidate that specific event.
 */
export function useUpdateEvent() {
  const invalidate = useInvalidate();

  return useMutation(
    ({ eventId, data }: { eventId: string; data: any }) =>
      apis.events.updateEvent({ eventId, event: data }),
    {
      onSuccess: (_, { eventId }) => {
        // Only invalidate the specific event
        invalidate(['events', 'detail', eventId]);

        // Optionally invalidate lists containing this event
        // (more aggressive strategy)
        invalidate((key) => {
          if (Array.isArray(key) && key[0] === 'events' && key[1] === 'list') {
            return true;
          }
          return false;
        });
      },
    }
  );
}

/**
 * EXAMPLE 5: Using in a Component
 * 
 * Shows real-world usage with multiple queries and mutations.
 */
export function EventDetailScreen({ eventId }: { eventId: string }) {
  const event = useEventDetail(eventId);
  const { mutate: updateEvent, status: updateStatus } = useUpdateEvent();
  const { mutate: deleteEvent, status: deleteStatus } = useDeleteEvent();

  const handleUpdate = async (data: any) => {
    try {
      await updateEvent({ eventId, data });
      // Component automatically re-renders with new data after cache invalidation
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(eventId);
      // Navigate away after successful deletion
      // All event lists are automatically updated
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      <button
        onClick={() => handleUpdate({ title: 'Updated' })}
        disabled={updateStatus === 'loading'}
      >
        Update
      </button>
      <button onClick={handleDelete} disabled={deleteStatus === 'loading'}>
        Delete
      </button>
    </div>
  );
}

/**
 * EXAMPLE 6: Manual Cache Invalidation
 * 
 * Sometimes you need to manually invalidate cache without a mutation.
 * For example, when receiving a WebSocket update.
 */
export function EventLobbyScreen({ eventId }: { eventId: string }) {
  const event = useEventDetail(eventId);
  const invalidate = useInvalidate();

  // Example: Handle WebSocket message
  const handleWebSocketUpdate = (message: any) => {
    if (message.type === 'event_updated' && message.eventId === eventId) {
      // Manually invalidate to trigger refetch
      invalidate(['events', 'detail', eventId]);
    }
  };

  // Setup WebSocket listener (simplified)
  // useEffect(() => {
  //   ws.on('message', handleWebSocketUpdate);
  //   return () => ws.off('message', handleWebSocketUpdate);
  // }, [eventId]);

  return (
    <div>
      <h1>{event.title}</h1>
      {/* ... */}
    </div>
  );
}
