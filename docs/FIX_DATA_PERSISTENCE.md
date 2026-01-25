# Fix Summary: Quiz Supplement Data Persistence Issue

## Issue Reported

@yuki-js reported that while PUT requests to `/api/events/{eventId}/users/{userId}` were being made correctly, the quiz editor was not loading existing data. When navigating away and returning, or reloading the page, all input content (including explanations) was being lost.

## Root Cause

The QuizEditScreen component was only initializing questions from profile data and never fetching existing quiz data from EventUserData. This meant that even though data was being saved correctly, it was never being loaded back when the user reopened the quiz editor.

## Solution Implemented

### Code Changes (Commit: 1e34ac8)

**File: app/feat/quiz/screens/QuizEditScreen.tsx**

1. **Added Imports:**

   ```typescript
   import { useSuspenseQueries } from "@/shared/hooks/useSuspenseQuery";
   import type { Quiz } from "../types";
   ```

2. **Fetch Existing Quiz Data:**

   ```typescript
   // Fetch existing quiz data
   const [existingQuizData] = useSuspenseQueries([
     [
       ["events.getEventUserData", { eventId, userId: meData.id }],
       () => apis.events.getEventUserData({ eventId, userId: meData.id }),
     ],
   ]);

   const existingQuiz = existingQuizData?.userData?.myQuiz as Quiz | undefined;
   ```

3. **Load Existing Questions in useEffect:**

   ```typescript
   useEffect(() => {
     if (isInitialized.current) return;
     if (!displayName && !hobby && !favoriteArtist && !myFaculty && !myGrade)
       return;

     // If we have existing quiz data, load it
     if (
       existingQuiz &&
       existingQuiz.questions &&
       existingQuiz.questions.length > 0
     ) {
       const loadedQuestions: QuestionState[] = existingQuiz.questions.map(
         (q) => {
           // Determine category and type from question ID
           let category: QuestionCategory = "custom";
           let type: "fixed" | "custom" = "custom";

           if (q.id === "q-names") {
             category = "names";
             type = "fixed";
           } else if (q.id === "q-vsim-names") {
             category = "verySimilarNames";
             type = "fixed";
           } else if (q.id === "q-hobby") {
             category = "hobbies";
             type = "fixed";
           } else if (q.id === "q-artist") {
             category = "artists";
             type = "fixed";
           } else if (q.id === "q-faculty") {
             category = "faculty";
             type = "fixed";
           } else if (q.id === "q-grade") {
             category = "grade";
             type = "fixed";
           }

           return {
             id: q.id,
             type,
             category,
             title: q.question,
             choices: q.choices.map((c) => ({
               id: c.id,
               text: c.text,
               isCorrect: c.isCorrect,
             })),
             explanation: q.explanation, // ← Preserves explanation
           };
         },
       );

       setQuestions(loadedQuestions);
       isInitialized.current = true;
       return;
     }

     // Otherwise, create initial questions from profile
     // ... (existing code for creating initial questions)
   }, [displayName, hobby, favoriteArtist, myFaculty, myGrade, existingQuiz]);
   ```

### Test Enhancement (Commit: caabd55)

**File: e2e/test_quiz_supplement.spec.ts**

Added verification step to test data persistence:

```typescript
// 8.5. Navigate back to quiz edit to verify data persistence
await page.goto(`http://localhost:5173/events/${eventId}/quiz/edit`);
await expect(page.getByText("クイズエディタ")).toBeVisible({ timeout: 10000 });

// Verify the supplement text is still there after reload
const reloadedSupplementInput = page
  .locator("textarea")
  .filter({ hasText: supplementText })
  .first();
await expect(reloadedSupplementInput).toBeVisible({ timeout: 5000 });
await expect(reloadedSupplementInput).toHaveValue(supplementText);
```

## Flow Comparison

### Before Fix:

1. User creates quiz and adds explanations
2. User saves quiz → Data saved to backend ✅
3. User navigates away and returns
4. Quiz editor loads → Only profile data used
5. All explanations lost ❌

### After Fix:

1. User creates quiz and adds explanations
2. User saves quiz → Data saved to backend ✅
3. User navigates away and returns
4. Quiz editor loads → Fetches EventUserData
5. Existing quiz data loaded including explanations ✅
6. All data preserved ✅

## Technical Details

- Uses `useSuspenseQueries` for data fetching with React Suspense
- Fetches data via `apis.events.getEventUserData`
- Maps Quiz type to QuestionState preserving all fields
- Identifies question categories based on question IDs
- Falls back to creating new questions if no existing data
- Updated useEffect dependency array to include existingQuiz

## Quality Assurance

✅ **Build:** Successful  
✅ **CodeQL Security Scan:** No vulnerabilities  
✅ **Code Review:** Completed (minor suggestions for future optimization)  
✅ **E2E Test:** Enhanced with reload verification  
✅ **Data Persistence:** Verified working

## Files Changed

- `app/feat/quiz/screens/QuizEditScreen.tsx` (+60 lines)
- `e2e/test_quiz_supplement.spec.ts` (+13 lines)

## Commits

1. `1e34ac8` - Load existing quiz data including explanations when editing
2. `caabd55` - Add E2E test verification for data persistence after reload

## Resolution

The read operation has been fully implemented. Quiz data including explanations now persists correctly across page navigations and reloads. The issue is completely resolved.
