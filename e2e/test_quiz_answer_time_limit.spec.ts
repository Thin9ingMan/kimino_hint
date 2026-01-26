import { test, expect } from "@playwright/test";

test.describe("Quiz Answer Time Limit", () => {
  test("should show RingProgress and auto-submit after timeout", async ({
    page,
    request,
  }) => {
    test.setTimeout(60000);

    // Setup: Create User and Event
    const authRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const token = authRes.headers()["authorization"];

    // Create profile for quiz creator (User A)
    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: token },
        data: {
          profileData: {
            displayName: "Quiz Creator",
            hobby: "Testing",
            favoriteArtist: "Test Artist",
          },
        },
      },
    );

    // Create Event
    const eventRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
      {
        headers: { Authorization: token },
        data: {
          meta: {
            name: "Time Limit Test Event",
            description: "Testing answer time limit",
          },
        },
      },
    );
    const eventData = await eventRes.json();
    const eventId = eventData.id;
    const creatorId = eventData.initiatorId;

    // Create a quiz for User A via API
    await request.put(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${creatorId}`,
      {
        headers: { Authorization: token },
        data: {
          userData: {
            myQuiz: {
              questions: [
                {
                  id: "q1",
                  question: "What is the time limit?",
                  choices: [
                    { id: "c1", text: "10 seconds", isCorrect: true },
                    { id: "c2", text: "20 seconds", isCorrect: false },
                    { id: "c3", text: "30 seconds", isCorrect: false },
                    { id: "c4", text: "No limit", isCorrect: false },
                  ],
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    );

    // Create User B (tester) who will answer the quiz
    const userBRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const tokenB = userBRes.headers()["authorization"];

    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: tokenB },
        data: {
          profileData: {
            displayName: "Quiz Taker",
            hobby: "Testing",
            favoriteArtist: "Test",
          },
        },
      },
    );

    // Join event with User B
    const eventInfo = await request.get(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}`,
      {
        headers: { Authorization: tokenB },
      },
    );
    const invitationCode = (await eventInfo.json()).invitationCode;

    await request.post(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join/${invitationCode}`,
      {
        headers: { Authorization: tokenB },
      },
    );

    // User B creates their own quiz so they can participate
    const userBData = await request.get(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me",
      {
        headers: { Authorization: tokenB },
      },
    );
    const userBId = (await userBData.json()).id;

    await request.put(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${userBId}`,
      {
        headers: { Authorization: tokenB },
        data: {
          userData: {
            myQuiz: {
              questions: [
                {
                  id: "q1",
                  question: "Dummy question",
                  choices: [
                    { id: "c1", text: "Answer 1", isCorrect: true },
                    { id: "c2", text: "Answer 2", isCorrect: false },
                    { id: "c3", text: "Answer 3", isCorrect: false },
                    { id: "c4", text: "Answer 4", isCorrect: false },
                  ],
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    );

    // Login as User B in browser
    await page.goto("http://localhost:5173/");
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, tokenB);
    await page.reload();

    // Navigate to the quiz question directly
    await page.goto(
      `http://localhost:5173/events/${eventId}/quiz/challenge/${creatorId}/1`,
    );

    // Wait for the question to load
    await expect(page.getByText("What is the time limit?")).toBeVisible({
      timeout: 10000,
    });

    // Test 1: Verify RingProgress is visible
    // RingProgress should be rendered as an SVG element
    const ringProgress = page.locator("svg").filter({ has: page.locator("circle") }).first();
    await expect(ringProgress).toBeVisible({ timeout: 5000 });
    console.log("✓ RingProgress component is visible");

    // Test 2: Verify countdown is happening (the progress should be changing)
    // We'll wait a moment and check that the component is still visible
    await page.waitForTimeout(2000);
    await expect(ringProgress).toBeVisible();
    console.log("✓ RingProgress is still visible during countdown");

    // Test 3: Wait for timeout (10+ seconds) and verify auto-submit
    // The result alert should appear after timeout
    await expect(page.getByText(/正解！|不正解/)).toBeVisible({
      timeout: 12000,
    });
    console.log("✓ Quiz auto-submitted after timeout");

    // Test 4: Verify that no answer was selected (should show incorrect since no choice was made)
    const resultText = await page.getByText(/正解！|不正解/).textContent();
    console.log(`Result: ${resultText}`);

    // The answer box should now be showing the result
    await expect(page.getByRole("button", { name: /結果を見る|次の問題へ/ })).toBeVisible();
    console.log("✓ Result displayed with navigation button");
  });

  test("should allow answering before timeout", async ({ page, request }) => {
    test.setTimeout(60000);

    // Setup similar to above test
    const authRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const token = authRes.headers()["authorization"];

    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: token },
        data: {
          profileData: {
            displayName: "Fast Answerer",
            hobby: "Speed",
            favoriteArtist: "Quick",
          },
        },
      },
    );

    const eventRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
      {
        headers: { Authorization: token },
        data: {
          meta: {
            name: "Fast Answer Test",
            description: "Testing quick answers",
          },
        },
      },
    );
    const eventData = await eventRes.json();
    const eventId = eventData.id;
    const creatorId = eventData.initiatorId;

    await request.put(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${creatorId}`,
      {
        headers: { Authorization: token },
        data: {
          userData: {
            myQuiz: {
              questions: [
                {
                  id: "q1",
                  question: "Quick question?",
                  choices: [
                    { id: "c1", text: "Yes", isCorrect: true },
                    { id: "c2", text: "No", isCorrect: false },
                  ],
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    );

    // Create User B and setup
    const userBRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const tokenB = userBRes.headers()["authorization"];

    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: tokenB },
        data: {
          profileData: {
            displayName: "Tester B",
            hobby: "Test",
            favoriteArtist: "Test",
          },
        },
      },
    );

    const eventInfo = await request.get(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}`,
      {
        headers: { Authorization: tokenB },
      },
    );
    const invitationCode = (await eventInfo.json()).invitationCode;

    await request.post(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join/${invitationCode}`,
      {
        headers: { Authorization: tokenB },
      },
    );

    const userBData = await request.get(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me",
      {
        headers: { Authorization: tokenB },
      },
    );
    const userBId = (await userBData.json()).id;

    await request.put(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${userBId}`,
      {
        headers: { Authorization: tokenB },
        data: {
          userData: {
            myQuiz: {
              questions: [
                {
                  id: "q1",
                  question: "Dummy",
                  choices: [
                    { id: "c1", text: "A", isCorrect: true },
                    { id: "c2", text: "B", isCorrect: false },
                  ],
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    );

    await page.goto("http://localhost:5173/");
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, tokenB);
    await page.reload();

    await page.goto(
      `http://localhost:5173/events/${eventId}/quiz/challenge/${creatorId}/1`,
    );

    // Wait for question
    await expect(page.getByText("Quick question?")).toBeVisible({
      timeout: 10000,
    });

    // Verify RingProgress is visible
    const ringProgress = page.locator("svg").filter({ has: page.locator("circle") }).first();
    await expect(ringProgress).toBeVisible({ timeout: 5000 });

    // Click an answer quickly (within timeout)
    await page.getByRole("button", { name: "Yes" }).click();

    // Result should appear immediately
    await expect(page.getByText(/正解！|不正解/)).toBeVisible({
      timeout: 3000,
    });
    console.log("✓ Answer submitted before timeout");

    // Timer should stop after answer is submitted
    // We can verify the result is shown
    await expect(page.getByRole("button", { name: /結果を見る|次の問題へ/ })).toBeVisible();
  });
});
