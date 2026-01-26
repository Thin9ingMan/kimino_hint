import { test, expect } from "@playwright/test";

test.describe("Quiz Timer Feature", () => {
  test("Timer displays and counts down", async ({ page, request }) => {
    test.setTimeout(90000);

    // --- Setup: Create Event & User with Quiz ---
    const userA_res = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const tokenA = userA_res.headers()["authorization"];

    // Set Profile A
    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: tokenA },
        data: {
          profileData: {
            displayName: "User A Timer Test",
            hobby: "Testing Timers",
            favoriteArtist: "Timer Artist",
          },
        },
      },
    );

    // Create Event
    const createEventRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
      {
        headers: { Authorization: tokenA },
        data: {
          meta: {
            name: "Timer Test Event",
            description: "Testing quiz timer",
          },
        },
      },
    );
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;

    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}`);

    // Create Quiz for User A with 2 questions
    await request.put(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${eventData.initiatorId}`,
      {
        headers: { Authorization: tokenA },
        data: {
          userData: {
            myQuiz: {
              questions: [
                {
                  id: "q1",
                  question: "Question 1: What is my name?",
                  choices: [
                    { id: "c1", text: "User A Timer Test", isCorrect: true },
                    { id: "c2", text: "Wrong 1", isCorrect: false },
                    { id: "c3", text: "Wrong 2", isCorrect: false },
                    { id: "c4", text: "Wrong 3", isCorrect: false },
                  ],
                },
                {
                  id: "q2",
                  question: "Question 2: What is my hobby?",
                  choices: [
                    { id: "c5", text: "Testing Timers", isCorrect: true },
                    { id: "c6", text: "Wrong 4", isCorrect: false },
                    { id: "c7", text: "Wrong 5", isCorrect: false },
                    { id: "c8", text: "Wrong 6", isCorrect: false },
                  ],
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    );

    // --- User B: Answer the quiz ---
    const userB_res = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const tokenB = userB_res.headers()["authorization"];

    // Set Profile B
    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: tokenB },
        data: {
          profileData: {
            displayName: "User B Timer Test",
            hobby: "Answering",
            favoriteArtist: "Answer Artist",
          },
        },
      },
    );

    // Login as User B
    await page.goto("http://localhost:5173/");
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, tokenB);
    await page.reload();

    // Navigate directly to quiz question
    await page.goto(
      `http://localhost:5173/events/${eventId}/quiz/challenge/${eventData.initiatorId}/1`,
    );

    // Wait for the question to load
    await expect(page.getByText("Question 1: What is my name?")).toBeVisible({
      timeout: 15000,
    });

    // Test 1: Timer should be visible and show around 10 seconds
    console.log("Test 1: Checking for timer display...");
    const timerElement = page.locator('[data-testid="quiz-timer"]');
    await expect(timerElement).toBeVisible({ timeout: 10000 });

    // Timer text should show something like "残り時間: 10秒" or just "10"
    const timerText = await timerElement.textContent();
    console.log(`Timer text found: ${timerText}`);
    expect(timerText).toMatch(/10|9|8|残り/);

    console.log("Timer display test passed!");
  });

  test("Timer auto-advances when time runs out", async ({ page, request }) => {
    test.setTimeout(90000);

    // --- Setup: Similar to first test ---
    const userA_res = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const tokenA = userA_res.headers()["authorization"];

    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: tokenA },
        data: {
          profileData: {
            displayName: "User A Timeout Test",
            hobby: "Testing",
            favoriteArtist: "Artist",
          },
        },
      },
    );

    const createEventRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
      {
        headers: { Authorization: tokenA },
        data: {
          meta: {
            name: "Timeout Test Event",
            description: "Testing auto-advance",
          },
        },
      },
    );
    const eventData = await createEventRes.json();
    const eventId = eventData.id;

    // Create multi-question quiz
    await request.put(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${eventData.initiatorId}`,
      {
        headers: { Authorization: tokenA },
        data: {
          userData: {
            myQuiz: {
              questions: [
                {
                  id: "q1",
                  question: "Q1: First Question",
                  choices: [
                    { id: "c1", text: "Correct", isCorrect: true },
                    { id: "c2", text: "Wrong", isCorrect: false },
                  ],
                },
                {
                  id: "q2",
                  question: "Q2: Second Question",
                  choices: [
                    { id: "c3", text: "Correct", isCorrect: true },
                    { id: "c4", text: "Wrong", isCorrect: false },
                  ],
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    );

    const userB_res = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const tokenB = userB_res.headers()["authorization"];

    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: tokenB },
        data: {
          profileData: {
            displayName: "User B",
            hobby: "Test",
            favoriteArtist: "Test",
          },
        },
      },
    );

    await page.goto("http://localhost:5173/");
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, tokenB);
    await page.reload();

    // Navigate directly to first question
    await page.goto(
      `http://localhost:5173/events/${eventId}/quiz/challenge/${eventData.initiatorId}/1`,
    );

    // Wait for question to load
    await expect(page.getByText("Q1: First Question")).toBeVisible({
      timeout: 15000,
    });

    // Verify timer is present
    const timerElement = page.locator('[data-testid="quiz-timer"]');
    await expect(timerElement).toBeVisible();

    // Wait for timer to expire (11 seconds)
    console.log("Waiting for timer to expire...");
    await page.waitForTimeout(11000);

    // Should auto-advance to question 2 or result
    const url = page.url();
    const hasAdvanced =
      url.includes("/2") || url.includes("/result") || url.includes("次の問題");

    if (!hasAdvanced) {
      await page.screenshot({ path: "/tmp/timeout-not-advanced.png" });
      console.error(`Page did not auto-advance. Current URL: ${url}`);
    }

    expect(hasAdvanced).toBeTruthy();

    // Verify score is 0 (timed out = incorrect)
    const scoreKey = `quiz_${eventId}_${eventData.initiatorId}_score`;
    const score = await page.evaluate((key) => {
      return sessionStorage.getItem(key);
    }, scoreKey);
    console.log(`Score after timeout: ${score}`);
    expect(score).toBe("0");

    console.log("Auto-advance test passed!");
  });
});
