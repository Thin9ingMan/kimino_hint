# Backend API Request: List Events Attended by User

## Issue Summary
There is no API endpoint to retrieve the list of events that a user has joined (as an attendee), only events they have created. This forces the frontend to use localStorage as a workaround.

## Current State

### Available API
- `GET /api/users/{userId}/events` - Returns events **created** by the user (via `listEventsByUser`)
- `GET /api/events/{eventId}/attendees` - Returns attendees for a specific event

### Missing API
- `GET /api/users/{userId}/attended-events` or similar - Should return events where the user is an **attendee**

## Backend Implementation Evidence

The backend **already has** the necessary database query method in `EventAttendeeMapper.java`:

```java
@Select("SELECT id, event_id, attendee_user_id, usermeta::text as usermeta, sysmeta::text as sysmeta, created_at, updated_at FROM event_attendees WHERE attendee_user_id = #{attendeeUserId}")
@ResultMap("eventAttendeeResultMap")
List<EventAttendee> findByAttendeeUserId(@Param("attendeeUserId") Long attendeeUserId);
```

This means the data layer is ready, but the API layer is missing.

## Proposed Solution

### Option 1: New Endpoint (Recommended)
Add a new endpoint to `EventsApiImpl.java`:

```java
@Override
@Authenticated
@GET
@Path("/users/{userId}/attended-events")
@Produces(MediaType.APPLICATION_JSON)
public Response listAttendedEventsByUser(@PathParam("userId") Long userId) {
    User user = authenticatedUser.get();
    try {
        List<Event> events = eventUseCase.listAttendedEventsByUser(userId, user.getId());
        return Response.ok(events).build();
    } catch (IllegalArgumentException e) {
        return Response.status(Response.Status.NOT_FOUND)
            .entity(new ErrorResponse(e.getMessage()))
            .build();
    }
}
```

Add corresponding method to `EventUseCase`:

```java
public List<Event> listAttendedEventsByUser(Long userId, Long requesterId) {
    // Query event_attendees table by attendeeUserId
    List<EventAttendee> attendees = eventAttendeeMapper.findByAttendeeUserId(userId);
    
    // Get event details for each attended event
    List<Event> events = new ArrayList<>();
    for (EventAttendee attendee : attendees) {
        eventMapper.findById(attendee.getEventId()).ifPresent(events::add);
    }
    
    return events;
}
```

### Option 2: Extend Existing Endpoint
Add query parameter to `/api/users/{userId}/events`:
- `/api/users/{userId}/events?type=created` - Events created by user (default)
- `/api/users/{userId}/events?type=attended` - Events attended by user
- `/api/users/{userId}/events?type=all` - Both created and attended

## OpenAPI Schema Update

Add to `openapi.yaml`:

```yaml
/api/users/{userId}/attended-events:
  get:
    tags:
      - Events
    summary: List events attended by a user
    description: Retrieve events where the specified user is an attendee.
    operationId: listAttendedEventsByUser
    parameters:
      - name: userId
        in: path
        description: Identifier of the user.
        required: true
        schema:
          format: int64
          type: integer
    responses:
      "200":
        description: OK
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: "#/components/schemas/Event"
      "401":
        description: Authentication required.
      "404":
        description: User not found.
      "500":
        description: Unexpected error.
```

## Use Case / User Story

**As a user**, when I join an event via invitation code or QR code:
- I want to see that event in my events list
- I want to easily return to that event later
- I don't want to re-enter the invitation code (which gives "already joined" error)
- I don't want to manually enter the event URL

**Current workaround**: The frontend stores joined event IDs in localStorage, which:
- ❌ Only works per browser/device (not synced)
- ❌ Lost when browser data is cleared
- ❌ Requires N additional API calls to fetch event details
- ❌ Cannot show join timestamps or other metadata

**With backend API**:
- ✅ Data synced across devices
- ✅ Persistent and reliable
- ✅ Single API call to get all attended events
- ✅ Can include join timestamp, role, and other metadata

## Related Frontend Issue

Frontend Issue: "参加したイベントの履歴がない" (No history of joined events)
- Repository: Thin9ingMan/kimino_hint
- PR: #[number] (Add joined events history with localStorage tracking)

## Priority

**Medium-High** - This is a user-facing feature gap that affects the core user experience. Users cannot easily return to events they've joined.

## Estimated Effort

**Small** - The data layer (`findByAttendeeUserId`) already exists. Only need to:
1. Add method to `EventUseCase` (~10-15 lines)
2. Add endpoint to `EventsApiImpl` (~20-30 lines)
3. Update OpenAPI spec (~20 lines)
4. Add tests (~30-50 lines)

Total: ~1-2 hours of development work

## Testing Considerations

1. Unit tests for `EventUseCase.listAttendedEventsByUser`
2. Integration tests for the new endpoint
3. Verify pagination if there are many attended events
4. Verify permissions (users can only see their own attended events, or public events)
5. Test with users who have attended 0, 1, and many events

## Migration Plan

Once this API is available, the frontend can:
1. Replace localStorage reads with API calls
2. Keep localStorage writes as a cache for offline support
3. Sync localStorage with backend on app load
4. Display join timestamps from backend

## Questions for Backend Team

1. Should we include events the user created in this list? Or keep them separate?
2. Should there be pagination for users who attended many events?
3. Should we return EventAttendee objects (with join metadata) or Event objects?
4. Any privacy/permission considerations for who can query this?

## References

- Backend Repository: https://github.com/yuki-js/quarkus-crud
- Mapper: `src/main/java/app/aoki/quarkuscrud/mapper/EventAttendeeMapper.java` (line 42-44)
- API Implementation: `src/main/java/app/aoki/quarkuscrud/resource/EventsApiImpl.java`
- Use Case: `src/main/java/app/aoki/quarkuscrud/usecase/EventUseCase.java`
