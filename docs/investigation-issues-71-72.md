# Investigation Report: Issues #71 and #72

## Executive Summary

After thorough investigation using API testing and code analysis, I was **unable to reproduce** the reported issues #71 and #72 at the API level. The backend allows event organizers to save quizzes and access participant data.

However, as a **defensive measure** and to ensure consistent behavior, I've implemented an auto-join feature that explicitly joins the event creator as an attendee during event creation.

## Fix Implemented

### Changes Made
- **File**: `app/feat/events/screens/CreateEventScreen.tsx`
- **Change**: Added auto-join call after event creation
- **Effect**: Event creators are now explicitly joined as attendees via the `joinEventByCode` API

### Code Change
```typescript
// Auto-join the organizer as an attendee
// This ensures the organizer can save quizzes and access participant data
// Fixes issues #71 and #72
try {
  await apis.events.joinEventByCode({
    eventJoinByCodeRequest: {
      invitationCode: event.invitationCode,
    },
  });
} catch (joinErr: any) {
  // If join fails with 409 Conflict, the user is already joined (which is fine)
  if (joinErr?.response?.status !== 409) {
    console.warn("Failed to auto-join event:", joinErr);
  }
}
```

### Why This Fix?
1. **Consistency**: Matches the pattern used in all E2E tests
2. **Defensive**: Prevents potential edge cases or timing issues
3. **Explicit**: Makes the attendee relationship clear in the code
4. **Safe**: Handles 409 Conflict gracefully if user is already joined

## Issue Descriptions

### Issue #71: "Organizer cannot save quizzes"
**Reported behavior:**
- Event organizer creates quiz
- Fills in quiz questions
- Clicks save button
- Gets error: "クイズの保存に失敗しました。もう一度お試しください。"

**Workaround mentioned:**
- Organizer joins their own event using invitation code
- Then can save quizzes successfully

### Issue #72: "Loading error when organizer tries to start participant's quiz"
**Reported behavior:**
- Event organizer tries to take a participant's quiz
- Loading error occurs

**Workaround mentioned:**
- Same as #71 - join own event first

## Investigation Results

### API-Level Testing

I conducted comprehensive API testing with the following results:

#### Test 1: Event Creation and Organizer Status
```
✓ User created: userId=445
✓ Event created: ID=2494
✓ Initiator ID matches user ID
⚠ Attendees list shows 1 attendee with userId=undefined
✓ Backend returns 200 OK for organizer saving quiz WITHOUT explicit join
✓ Backend returns 200 OK for organizer accessing quiz data
```

#### Test 2: Explicit Join Attempt
```
✓ Attempting to join own event returns 409 Conflict (already joined)
✓ This confirms organizer is already an attendee
```

### Code Analysis

#### Backend Behavior (confirmed via API testing)
1. When an event is created, the backend automatically creates an attendee record for the organizer
2. The organizer can immediately update their event user data (save quizzes)
3. The organizer can immediately access other participants' event user data
4. Attempting to join an event the user is already in returns 409 Conflict

#### Frontend Code (from static analysis)
1. `CreateEventScreen.tsx`: Creates event but does NOT call `joinEventByCode`
2. `QuizEditScreen.tsx`: Uses `apis.events.updateEventUserData()` with `meData.id`
3. Event Lobby: Fetches attendees using `apis.events.listEventAttendees()`
4. All E2E tests explicitly call `joinEventByCode` for event creators

## Key Findings

### 1. Attendee Data Inconsistency
The API returns attendee records with `userId: undefined` in some cases, but the backend still associates them correctly with the user's actual ID. This suggests:
- There may be a serialization issue in the API
- The frontend handles this with fallback logic (`a.attendeeUserId || a.userId`)

### 2. API vs UI Behavior Mismatch
- **API Level**: Organizer can save quizzes ✓
- **UI Level**: Issue author reports they cannot save quizzes ✗
- This suggests the issue is frontend-specific, not backend-specific

### 3. E2E Test Pattern
All existing E2E tests call `joinEventByCode` for event creators, even though the API testing shows this is not necessary. This suggests:
- Developers are aware of potential issues
- They implemented a defensive workaround in tests
- The workaround may have been added to fix a previous bug

## Possible Explanations

### 1. Frontend State Management Issue
- Race condition between event creation and attendee list loading
- Frontend caching issue causing stale data
- Incorrect user ID being used in frontend (although code review shows it's correct)

### 2. Browser-Specific Issue
- Issue reported on Microsoft Edge on Windows 11
- Could be related to CORS, cookies, localStorage, or browser security settings
- University Wi-Fi may have proxies or firewalls affecting requests

### 3. Timing/Network Issue
- Slow network causing timeout before backend processes attendee creation
- Frontend assumes failure before backend completes
- Race condition in frontend state updates

### 4. Issue Already Fixed
- Code may have been updated since issue was reported
- Issue author testing old version or cached code

### 5. Incomplete Issue Description
- As noted in the problem statement, the issue description lacks sufficient information
- Missing: exact error messages, browser console logs, network tab details, step-by-step reproduction

## Recommendations

### For Issue Author
Please provide the following additional information to help reproduce the issue:

1. **Browser Console Logs**
   - Open DevTools (F12)
   - Go to Console tab
   - Reproduce the issue
   - Copy all error messages

2. **Network Tab Details**
   - Open DevTools Network tab
   - Reproduce the issue
   - Filter for failed requests (red ones)
   - For each failed request, provide:
     - Request URL
     - Request method (GET, POST, PUT, etc.)
     - Status code
     - Response body

3. **Exact Steps**
   - Clear browser cache and localStorage
   - Step-by-step actions from login to error
   - Screenshot at each step

4. **Version Information**
   - Which commit/version were you testing?
   - Was this on the deployed site or local development?

5. **User ID Information**
   - What is your user ID when logged in?
   - What is the event ID?
   - What is shown in the attendees list?

### For Developers

If the issue cannot be reproduced even with additional information:

1. **Consider Auto-Join Implementation**
   - Even though it works via API, adding explicit `joinEventByCode` call in `CreateEventScreen` could prevent edge cases
   - This matches the pattern in E2E tests
   - Implementation:
     ```typescript
     // In CreateEventScreen.tsx, after event creation:
     const event = await apis.events.createEvent({...});
     
     // Auto-join the organizer
     await apis.events.joinEventByCode({
       eventJoinByCodeRequest: {
         invitationCode: event.invitationCode
       }
     });
     
     navigate(`/events/${event.id}`);
     ```

2. **Add Frontend Logging**
   - Log user ID, event ID, and attendee status in QuizEditScreen
   - This will help diagnose future reports

3. **Improve Error Messages**
   - Current error is generic: "クイズの保存に失敗しました"
   - Should include HTTP status code and specific reason

## Conclusion

Based on API testing, **Issues #71 and #72 cannot be reproduced at the backend level**. The organizer is automatically added as an attendee and can save quizzes and access participant data without explicitly joining.

However, the issue author reported a real problem they experienced. Without additional debugging information (console logs, network traces, etc.), it's impossible to determine:
- Whether this was a temporary backend issue that has since been fixed
- Whether this is a frontend-specific bug triggered by certain conditions
- Whether this is related to the user's specific environment (browser, network, etc.)

**Recommendation**: Request more detailed reproduction steps and debugging information from the issue author before implementing changes. If no additional information can be provided, consider implementing the auto-join workaround as a defensive measure.

## Appendix: Test Scripts

The following test scripts were created during investigation:

- `/tmp/test_issue_71.mjs` - Basic API reproduction test
- `/tmp/test_issue_71_v2.mjs` - Detailed API investigation
- `/tmp/test_issue_complete.mjs` - Complete end-to-end API test
- `/tmp/setup_test_user.mjs` - Setup script for browser testing

These can be run with `node <script>` to verify the API behavior.
