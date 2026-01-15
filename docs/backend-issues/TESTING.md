# How to Run the Organizer Quiz Save Tests

## Prerequisites

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   The server should be running on `http://localhost:5173`

3. **Install Playwright browsers** (if not already installed):
   ```bash
   npx playwright install
   ```

## Running the Test

### Run Only the Organizer Quiz Save Test
```bash
npx playwright test e2e/test_organizer_quiz_save.spec.ts
```

### Run with UI Mode (for debugging)
```bash
npx playwright test e2e/test_organizer_quiz_save.spec.ts --ui
```

### Run with Headed Browser (see what's happening)
```bash
npx playwright test e2e/test_organizer_quiz_save.spec.ts --headed
```

### Run in Debug Mode
```bash
npx playwright test e2e/test_organizer_quiz_save.spec.ts --debug
```

## Expected Results

### Before Backend Fix
- **Test 1** (Organizer WITHOUT joining): Should FAIL or show error
  - Demonstrates the bug
  - Organizer creates event but cannot save quiz
  - Either shows error alert or stays on edit screen
  
- **Test 2** (Organizer WITH joining): Should PASS
  - Shows the workaround
  - Organizer explicitly joins their event, then saves quiz successfully

### After Backend Fix
- **Both tests should PASS**
  - Backend auto-adds organizer as attendee
  - Test 1 will now succeed without explicit join
  - Test 2 continues to work

## Checking Test Output

### Screenshots
Tests create screenshots in `/tmp/`:
- `organizer-quiz-save-attempt.png` - Shows the state when save is attempted

### Console Logs
The tests include detailed console.log statements showing:
- Event creation details (ID, invitation code)
- API responses
- Current URLs
- Error messages
- Whether the bug was reproduced

### Example Console Output
```
Event Created: ID=123, Code=ABC-123
Event data: { "id": 123, "initiatorId": 456, ... }
Current URL after save attempt: http://localhost:5173/events/123/quiz/edit
Has error alert: true
Error message: クイズの保存に失敗しました
BUG REPRODUCED: Organizer cannot save quiz!
```

## Troubleshooting

### Development Server Not Running
```bash
# Check if server is running
curl http://localhost:5173

# If not running, start it
npm run dev
```

### Port Already in Use
If port 5173 is taken:
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or set different port in vite.config.js
```

### Playwright Browsers Not Found
```bash
npx playwright install
```

### Test Times Out
Increase timeout in the test file:
```typescript
test.setTimeout(120000); // 2 minutes
```

## Running All E2E Tests

To run all E2E tests to ensure no regressions:
```bash
npx playwright test e2e/
```

## Continuous Integration

When running in CI:
```bash
# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install --with-deps

# Run tests
npx playwright test

# Generate HTML report
npx playwright show-report
```

## Next Steps After Tests Pass

1. **Verify the fix**:
   - Both test scenarios should pass
   - No error messages should appear
   - Save should navigate to event lobby

2. **Update issue documentation**:
   - Mark the issue as resolved in `docs/backend-issues/organizer-cannot-save-quiz.md`
   - Add backend PR/commit reference
   - Note the date of resolution

3. **Clean up workarounds** (if any exist in production code):
   - Remove any temporary fixes
   - Ensure code uses standard flow

## Related Files

- Test file: `e2e/test_organizer_quiz_save.spec.ts`
- Issue doc: `docs/backend-issues/organizer-cannot-save-quiz.md`
- Frontend code: `app/feat/quiz/screens/QuizEditScreen.tsx`
- Existing tests: `e2e/test_full_quiz_flow.spec.ts`, `e2e/test_quiz_flow.spec.ts`

---
**Last Updated**: 2026-01-15
