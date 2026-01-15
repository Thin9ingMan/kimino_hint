# Backend Issue: Organizer Cannot Save Quiz

## Issue Summary
Event organizers (users who create events) are unable to save quizzes, while regular participants can save quizzes without any issues.

## Environment Information
- **OS**: Windows 11
- **Browser**: Microsoft Edge
- **Network**: University Wi-Fi
- **Frontend Application**: kimino_hint (React + Vite)
- **Backend API**: quarkus-crud (https://quarkus-crud.ouchiserver.aokiapp.com)

## Steps to Reproduce

### For Organizers (Bug Occurs)
1. User creates a guest account via API
2. User sets their profile (displayName, hobby, favoriteArtist)
3. User creates a new event via `POST /api/events`
   - This makes them the event **organizer/initiator**
4. User navigates to the event lobby in the UI
5. User clicks "自分のクイズを編集" (Edit My Quiz)
6. User clicks "クイズを作成" (Create Quiz)
7. User fills in quiz choices and clicks "保存して完了" (Save and Complete)
8. **Bug**: Save operation fails - organizer cannot save the quiz

### For Regular Participants (Works Fine)
1. User creates a guest account via API
2. User sets their profile
3. User joins an existing event via `POST /api/events/join-by-code` with invitation code
   - This makes them an **attendee**
4. User navigates to the event lobby
5. User creates and saves a quiz
6. **Result**: Save operation succeeds

## Expected Behavior
Event organizers should be able to create and save quizzes for their own events, just like regular participants can.

## Actual Behavior
When an event organizer attempts to save a quiz, the save operation fails. The error occurs when calling:

```
PUT /api/events/{eventId}/users/{userId}
```

With request body:
```json
{
  "userData": {
    "myQuiz": { ... },
    "fakeAnswers": { ... },
    "updatedAt": "2026-01-15T..."
  }
}
```

## Technical Analysis

### Frontend Code Reference
File: `app/feat/quiz/screens/QuizEditScreen.tsx` (lines 506-516)

```typescript
await apis.events.updateEventUserData({
  eventId,
  userId: meData.id,  // This is the current user's ID from /api/auth/me
  eventUserDataUpdateRequest: {
    userData: {
      myQuiz,
      fakeAnswers,
      updatedAt: new Date().toISOString(),
    },
  },
});
```

### Root Cause Hypothesis
The issue appears to be a discrepancy between user identity and event attendee records:

1. **When a user creates an event**:
   - They become the `initiator` of the event
   - However, they may NOT be automatically added to the event's `attendees` list
   - The event has an `initiatorId` field that references them

2. **When trying to save quiz data**:
   - The frontend calls `PUT /api/events/{eventId}/users/{userId}`
   - The `{userId}` comes from the current user's auth context (`meData.id`)
   - The backend may require that this `userId` exists in the event's attendees list
   - If the organizer was never added as an attendee, the API call fails

3. **Why participants work fine**:
   - Participants explicitly join via `/api/events/join-by-code`
   - This API call adds them to the attendees list
   - Their `userId` exists in attendees, so quiz save works

### Evidence from Existing Tests
Looking at `e2e/test_full_quiz_flow.spec.ts` (lines 39-42), we can see a workaround:

```typescript
// Create Event (User A)
const createEventRes = await request.post('.../api/events', ...);
const eventData = await createEventRes.json();

// Explicitly join User A to ensure they appear in attendees list
await request.post('.../api/events/join-by-code', {
    headers: { 'Authorization': tokenA },
    data: { invitationCode }
});
```

The test explicitly makes the organizer join their own event, suggesting this is a known requirement.

## Proposed Backend Solutions

### Option 1: Automatically Add Organizer as Attendee (Recommended)
When an event is created, automatically add the organizer/initiator to the event's attendees list.

**API Endpoint**: `POST /api/events`

**Change**: After creating the event, automatically create an attendee record for the initiator.

**Pros**:
- Most intuitive behavior - organizers are participants by default
- No frontend changes needed
- Fixes the issue at the root

**Cons**:
- Might require database schema validation

### Option 2: Support Initiator ID in Quiz Save Endpoint
Allow the quiz save endpoint to accept the initiator's user ID even if they're not in the attendees list.

**API Endpoint**: `PUT /api/events/{eventId}/users/{userId}`

**Change**: Check if `userId` is either:
- An attendee of the event, OR
- The initiator of the event

**Pros**:
- Minimal backend change
- Explicitly handles the organizer case

**Cons**:
- Doesn't solve the broader issue of organizers not being attendees
- May cause other UI inconsistencies (organizer not appearing in attendee lists)

### Option 3: Separate Endpoint for Organizer Quiz
Create a dedicated endpoint for organizers to save their quiz.

**New API Endpoint**: `PUT /api/events/{eventId}/organizer/quiz`

**Pros**:
- Clear separation of concerns

**Cons**:
- Requires frontend changes
- More complex - two different code paths for same functionality

## Recommended Solution
**Option 1** is recommended. When an event is created, the backend should automatically add the organizer as an attendee. This is the most intuitive behavior and matches user expectations.

## API Details to Investigate

### Current API Behavior Questions:
1. Does `POST /api/events` return the initiator in the attendees list?
2. Does `GET /api/events/{eventId}/attendees` include the initiator?
3. What validation does `PUT /api/events/{eventId}/users/{userId}` perform?
   - Does it check if userId exists in attendees?
   - Does it check if userId is the initiator?
   - What error code/message is returned when validation fails?

### Expected API Response for Event Creation:
```json
{
  "id": 123,
  "initiatorId": 456,
  "invitationCode": "ABC-123",
  "meta": { "name": "...", "description": "..." },
  "attendees": [
    {
      "attendeeUserId": 456,  // <-- Initiator should be here automatically
      "userId": 456,
      // ...
    }
  ]
}
```

## Testing

### E2E Test Created
A new E2E test has been added to reproduce this issue:
- File: `e2e/test_organizer_quiz_save.spec.ts`
- Test 1: Demonstrates organizer cannot save without joining
- Test 2: Demonstrates organizer CAN save after explicitly joining

### Backend Test Recommendations
1. Create a test that:
   - Creates an event as User A
   - Verifies User A appears in the attendees list automatically
   - Attempts to save quiz data via `PUT /api/events/{eventId}/users/{userId}` where userId is the initiator
   - Verifies the save succeeds

## Related Code Files

### Frontend
- `app/feat/quiz/screens/QuizEditScreen.tsx` - Quiz save logic
- `app/feat/events/screens/EventLobbyScreen.tsx` - Event lobby and attendee list
- `app/shared/api/client.ts` - API configuration
- `e2e/test_organizer_quiz_save.spec.ts` - New test reproducing the bug
- `e2e/test_full_quiz_flow.spec.ts` - Existing test with workaround

### Backend (quarkus-crud repository)
- Event creation endpoint: `POST /api/events`
- Join event endpoint: `POST /api/events/join-by-code`
- Update user data endpoint: `PUT /api/events/{eventId}/users/{userId}`
- List attendees endpoint: `GET /api/events/{eventId}/attendees`

## Additional Notes

### Workaround for Users (Temporary)
Until the backend is fixed, organizers can work around this issue by:
1. Creating the event
2. Manually "joining" their own event using the invitation code
3. Then creating and saving quizzes

This workaround is not intuitive and should not be required.

### UI Implications
If organizers are not automatically attendees:
- They won't appear in the attendee count badge
- They won't be listed in the participants list
- They can't create quizzes
- Other participants can't answer the organizer's quiz

All of these are undesirable behaviors that support adding the organizer as an attendee automatically.

## Priority
**High** - This prevents a core user flow (organizers creating quizzes for their events) from working.

## Labels
- bug
- backend
- api
- events
- quiz
- user-experience

## Contact
Frontend Team: kimino_hint repository maintainers
Backend Team: quarkus-crud repository maintainers

---
**Document Created**: 2026-01-15
**Created By**: Frontend Development Team (via GitHub Copilot Agent)
**Status**: Pending Backend Team Review
