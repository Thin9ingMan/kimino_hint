# Backend API Request: List Events Attended by User

## ⚠️ Security Update (2026-01-15)

**Original proposal had a security issue**: Allowing any user to query attended events for any other user would leak private information about users' event participation.

**Updated recommendation**: Use `/api/me/attended-events` endpoint that only returns attended events for the **authenticated user**. This prevents privacy leaks while serving the frontend use case.

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

## Security Considerations ⚠️

**CRITICAL**: This endpoint must enforce access control to prevent privacy leaks.

### Privacy Analysis
Currently, `/api/users/{userId}/events` allows ANY authenticated user to see events **created** by any other user (but not their invitation codes). This may be acceptable since created events are somewhat "public" as the creator.

However, events a user has **attended** could be considered private information:
- Users may not want others to know which events they've joined
- This could reveal social connections or interests
- Different from "created events" which are inherently visible to attendees

### Recommended Access Control Policy

**Option A: Self-Only Access (Most Restrictive)**
```java
public List<Event> listAttendedEventsByUser(Long userId, Long requesterId) {
    // SECURITY: Only allow users to query their own attended events
    if (!userId.equals(requesterId)) {
        throw new SecurityException("Not authorized to view other users' attended events");
    }
    
    if (userService.findById(userId).isEmpty()) {
        throw new IllegalArgumentException("User not found");
    }
    
    List<EventAttendee> attendees = eventAttendeeMapper.findByAttendeeUserId(userId);
    
    List<Event> events = new ArrayList<>();
    for (EventAttendee attendee : attendees) {
        eventMapper.findById(attendee.getEventId()).ifPresent(events::add);
    }
    
    return events;
}
```

**Option B: Match Existing Pattern (Public with Limited Info)**
Allow any user to query, but like `listEventsByUser`, hide sensitive information:
```java
public List<Event> listAttendedEventsByUser(Long userId, Long requesterId) {
    if (userService.findById(userId).isEmpty()) {
        throw new IllegalArgumentException("User not found");
    }
    
    List<EventAttendee> attendees = eventAttendeeMapper.findByAttendeeUserId(userId);
    
    return attendees.stream()
        .map(attendee -> eventMapper.findById(attendee.getEventId()))
        .filter(Optional::isPresent)
        .map(Optional::get)
        .map(event -> {
            // Never include invitation code for attended events query
            // Only include basic event info
            return toEventDto(event, null);
        })
        .collect(Collectors.toList());
}
```

**Option C: Use /me Endpoint (Recommended) ✅**
Instead of `/api/users/{userId}/attended-events`, use `/api/me/attended-events`:
```java
@Override
@Authenticated
@GET
@Path("/me/attended-events")
@Produces(MediaType.APPLICATION_JSON)
public Response listMyAttendedEvents() {
    User user = authenticatedUser.get();
    try {
        List<Event> events = eventUseCase.listMyAttendedEvents(user.getId());
        return Response.ok(events).build();
    } catch (Exception e) {
        LOG.errorf(e, "Failed to list attended events for user %d", user.getId());
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(new ErrorResponse("Failed to list attended events: " + e.getMessage()))
            .build();
    }
}
```

Add to `EventUseCase.java`:
```java
/**
 * Lists all events attended by the current user.
 *
 * <p>This method returns events where the user is an attendee.
 * No access control needed since users can only query their own attended events.
 *
 * @param userId the user ID (must be the authenticated user)
 * @return list of event DTOs (without invitation codes)
 */
public List<app.aoki.quarkuscrud.generated.model.Event> listMyAttendedEvents(Long userId) {
    if (userService.findById(userId).isEmpty()) {
        throw new IllegalArgumentException("User not found");
    }
    
    List<EventAttendee> attendees = eventAttendeeMapper.findByAttendeeUserId(userId);
    
    return attendees.stream()
        .map(attendee -> eventMapper.findById(attendee.getEventId()))
        .filter(Optional::isPresent)
        .map(Optional::get)
        .map(event -> {
            // Don't include invitation codes for attended events
            // User can get invitation code from getEventById if they're the owner
            return toEventDto(event, null);
        })
        .collect(Collectors.toList());
}
```

### Recommendation
**Use Option C** (`/api/me/attended-events`) because:
1. ✅ Clear that it's for the current user only
2. ✅ No privacy concerns - users can only see their own data
3. ✅ Follows existing pattern (backend has `/api/me` for current user)
4. ✅ Frontend use case only needs current user's attended events
5. ✅ Simpler implementation with no access control edge cases

### Option 2: Extend Existing Endpoint
Add query parameter to `/api/users/{userId}/events`:
- `/api/users/{userId}/events?type=created` - Events created by user (default)
- `/api/users/{userId}/events?type=attended` - Events attended by user
- `/api/users/{userId}/events?type=all` - Both created and attended

## OpenAPI Schema Update

Add to `openapi.yaml` (using recommended `/api/me/attended-events` endpoint):

```yaml
/api/me/attended-events:
  get:
    tags:
      - Authentication
    summary: List events attended by the current user
    description: Retrieve events where the authenticated user is an attendee.
    operationId: listMyAttendedEvents
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

1. **Security**: Confirm that `/api/me/attended-events` (self-only access) is the correct approach
2. Should we include events the user created in this list? Or keep them separate?
3. Should there be pagination for users who attended many events?
4. Should we return EventAttendee objects (with join metadata) or Event objects?
5. Should we filter out closed/expired events from the list?

## References

- Backend Repository: https://github.com/yuki-js/quarkus-crud
- Mapper: `src/main/java/app/aoki/quarkuscrud/mapper/EventAttendeeMapper.java` (line 42-44)
- API Implementation: `src/main/java/app/aoki/quarkuscrud/resource/EventsApiImpl.java`
- Use Case: `src/main/java/app/aoki/quarkuscrud/usecase/EventUseCase.java`
