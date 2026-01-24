# Quiz Navigation Bug - Technical Explanation

## Bug: State Persistence Between Questions

### The Problem
After answering the first quiz question, subsequent questions immediately show "不正解" (incorrect) without the user selecting any answer.

### Root Cause

#### Before Fix (Buggy Behavior):
```
User Flow:
1. Navigate to Question 1: /quiz/challenge/123/1
   └─> QuizQuestionContent instance created
       └─> State: { selectedChoiceId: null, showResult: false }

2. User selects answer "A"
   └─> State: { selectedChoiceId: "A", showResult: true }
   └─> UI shows: "正解！" or "不正解"

3. User clicks "次の問題へ" 
   └─> Navigate to Question 2: /quiz/challenge/123/2
   └─> React reuses SAME QuizQuestionContent instance (no key prop)
       └─> State PERSISTS: { selectedChoiceId: "A", showResult: true }
       └─> Bug: Question 2 renders with showResult=true immediately!
       └─> Since "A" doesn't exist in Q2 choices → shows "不正解"
```

#### Why This Happens:
React's reconciliation algorithm tries to reuse component instances when possible. Since the component tree structure didn't change (just the URL param), React kept the same instance and only updated the props/context, but **did not reset the useState values**.

### The Fix

#### After Fix (Correct Behavior):
```
1. Navigate to Question 1: /quiz/challenge/123/1
   └─> QuizQuestionContent instance created with key=1
       └─> State: { selectedChoiceId: null, showResult: false }

2. User selects answer "A"
   └─> State: { selectedChoiceId: "A", showResult: true }
   └─> UI shows: "正解！" or "不正解"

3. User clicks "次の問題へ"
   └─> Navigate to Question 2: /quiz/challenge/123/2
   └─> React sees key changed (1 → 2)
   └─> React UNMOUNTS old instance (key=1)
   └─> React CREATES NEW instance with key=2
       └─> State RESET: { selectedChoiceId: null, showResult: false }
       └─> ✓ Question 2 renders fresh, no result shown!
```

### Code Changes

**File:** `app/feat/quiz/screens/QuizQuestionScreen.tsx`

```typescript
export function QuizQuestionScreen() {
  const questionNo = useNumericParam("questionNo") ?? 1;
  
  return (
    <Container title="クイズ">
      <ErrorBoundary>
        <Suspense>
          <QuizQuestionContent key={questionNo} />  // ← Added key prop
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
```

### React's Key Behavior

The `key` prop tells React:
- If `key` is the same → reuse the component instance
- If `key` changes → destroy old instance, create new instance
- New instance → all state resets to initial values

This is why:
- `<Component key={1} />` is treated as completely different from
- `<Component key={2} />`

Even though they're the same component type!

### Testing

The fix is validated by E2E test `test_multi_question_quiz.spec.ts`:

```typescript
// Question 2 - verify no result shown initially
await expect(page.getByText('私の趣味はどれ？')).toBeVisible();

const isResultShownImmediately = await page.getByText('不正解').isVisible();

if (isResultShownImmediately) {
  throw new Error('Bug reproduced: Result shown immediately');
}

// Only after user clicks an answer
await page.click('button:has-text("Testing")');
await expect(page.getByText('正解！')).toBeVisible();  // ✓ Now shown
```

### Lessons Learned

1. **State Management:** When using URL parameters that change frequently, consider whether component state should persist across parameter changes.

2. **React Keys:** The `key` prop is crucial for controlling component lifecycle. Use it when you want to force remounting.

3. **Common Pattern:** This bug pattern is common in:
   - Pagination (page number in URL)
   - Multi-step forms (step number in URL)
   - Item viewers (item ID in URL)
   - Quiz/survey questions (question number in URL)

4. **Alternative Solutions:**
   - Use `key` prop (chosen solution - simplest)
   - Use `useEffect` to reset state when params change
   - Move state to URL search params
   - Use external state management (Redux, Zustand)

### Impact

**Severity:** High - Core functionality broken
**User Impact:** Users cannot complete multi-question quizzes
**Fix Complexity:** Low - 3 lines of code
**Risk:** Very Low - Isolated change, no side effects
