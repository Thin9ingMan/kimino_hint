import { test, expect } from "@playwright/test";

test("Quiz Timer - Basic Functionality", async ({ page, request }) => {
  test.setTimeout(120000); // 2 minutes total timeout

  // --- Setup: Create Event & User with Quiz via API ---

  // Step 1: User A creates guest account
  const userA_res = await request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
  );
  const tokenA = userA_res.headers()["authorization"];

  // Step 2: Set User A's profile
  await request.put(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
    {
      headers: { Authorization: tokenA },
      data: {
        profileData: {
          displayName: "Timer Test Creator",
          hobby: "Testing",
          favoriteArtist: "Artist",
        },
      },
    },
  );

  // Step 3: Create Event
  const createEventRes = await request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
    {
      headers: { Authorization: tokenA },
      data: {
        meta: {
          name: "Quiz Timer Test Event",
          description: "Testing timer functionality",
        },
      },
    },
  );
  const eventData = await createEventRes.json();
  const eventId = eventData.id;
  const initiatorId = eventData.initiatorId;

  console.log(`Event Created: ID=${eventId}, Initiator=${initiatorId}`);

  // Step 4: Create Quiz with 2 questions
  await request.put(
    `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${initiatorId}`,
    {
      headers: { Authorization: tokenA },
      data: {
        userData: {
          myQuiz: {
            questions: [
              {
                id: "q1",
                question: "What is the first question?",
                choices: [
                  { id: "c1", text: "First Answer", isCorrect: true },
                  { id: "c2", text: "Wrong Answer 1", isCorrect: false },
                  { id: "c3", text: "Wrong Answer 2", isCorrect: false },
                  { id: "c4", text: "Wrong Answer 3", isCorrect: false },
                ],
              },
              {
                id: "q2",
                question: "What is the second question?",
                choices: [
                  { id: "c5", text: "Second Answer", isCorrect: true },
                  { id: "c6", text: "Wrong Answer 4", isCorrect: false },
                  { id: "c7", text: "Wrong Answer 5", isCorrect: false },
                  { id: "c8", text: "Wrong Answer 6", isCorrect: false },
                ],
              },
            ],
            updatedAt: new Date().toISOString(),
          },
        },
      },
    },
  );

  console.log("Quiz created successfully");

  // --- Setup: User B logs in and takes the quiz ---

  // Step 5: User B creates guest account
  const userB_res = await request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
  );
  const tokenB = userB_res.headers()["authorization"];

  // Step 6: Set User B's profile
  await request.put(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
    {
      headers: { Authorization: tokenB },
      data: {
        profileData: {
          displayName: "Timer Test Taker",
          hobby: "Answering",
          favoriteArtist: "Music",
        },
      },
    },
  );

  // Step 7: Login as User B in browser
  await page.goto("http://localhost:5173/");
  await page.evaluate((t) => {
    localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
  }, tokenB);
  await page.reload();

  // --- Test: Navigate to quiz question and verify timer ---

  // Step 8: Navigate to first question
  console.log(
    `Navigating to: /events/${eventId}/quiz/challenge/${initiatorId}/1`,
  );
  await page.goto(
    `http://localhost:5173/events/${eventId}/quiz/challenge/${initiatorId}/1`,
  );

  // Step 9: Wait for question to load
  await expect(page.getByText("What is the first question?")).toBeVisible({
    timeout: 15000,
  });
  console.log("Question loaded successfully");

  // Step 10: Verify timer element is visible
  const timerElement = page.locator('[data-testid="quiz-timer"]');
  await expect(timerElement).toBeVisible({ timeout: 5000 });
  console.log("Timer element is visible");

  // Step 11: Verify timer shows a number (should be around 10 seconds)
  const timerText = await timerElement.textContent();
  console.log(`Timer displays: "${timerText}"`);
  expect(timerText).toBeTruthy();
  expect(timerText).toMatch(/\d+/); // Should contain a number

  // Step 12: Wait for timer to expire (11 seconds)
  console.log("Waiting 11 seconds for timer to expire...");
  await page.waitForTimeout(11000);

  // Step 13: Verify page auto-advanced
  const finalUrl = page.url();
  console.log(`Final URL after timeout: ${finalUrl}`);

  // Should have advanced to question 2 or results page
  const hasAdvanced =
    finalUrl.includes("/2") ||
    finalUrl.includes("/result") ||
    finalUrl.includes("result");

  if (!hasAdvanced) {
    const screenshot = await page.screenshot({
      path: "/tmp/timer-test-final.png",
    });
    console.log(`Screenshot saved: ${screenshot}`);
  }

  expect(hasAdvanced).toBeTruthy();
  console.log("✓ Timer auto-advance test passed!");
});
