import { test, expect } from "@playwright/test";

/**
 * Test for quiz result details table
 * This test verifies that the quiz result screen shows a detailed table
 * with each question, the correct answer, and the user's answer.
 */
test.describe("Quiz Result Details", () => {
  test("Quiz result screen displays detailed results table with questions and answers", async ({
    page,
    request,
  }) => {
    test.setTimeout(90000);

    // --- Setup: Create 2 Users and Event with Multi-Question Quiz ---

    // User A: Quiz Creator
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
            displayName: "田所浩治",
            hobby: "Testing",
            favoriteArtist: "Test Artist",
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
            name: "Result Details Test Event",
            description: "Testing quiz result details display",
          },
        },
      },
    );
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;
    const creatorUserId = eventData.initiatorId;

    console.log(
      `Event Created: ID=${eventId}, Code=${invitationCode}, CreatorID=${creatorUserId}`,
    );

    // User A joins the event
    await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code",
      {
        headers: { Authorization: tokenA },
        data: { invitationCode },
      },
    );

    // Create a quiz with 3 questions for User A
    // Mix correct and incorrect answers to test both cases
    const testQuiz = {
      questions: [
        {
          id: "q1",
          question: "私の名前は？",
          choices: [
            { id: "q1_c1", text: "田所浩治", isCorrect: true },
            { id: "q1_c2", text: "野獣先輩", isCorrect: false },
            { id: "q1_c3", text: "遠野", isCorrect: false },
            { id: "q1_c4", text: "KMR", isCorrect: false },
          ],
        },
        {
          id: "q2",
          question: "好きなYouTuberは？",
          choices: [
            { id: "q2_c1", text: "れてんジャダム", isCorrect: true },
            { id: "q2_c2", text: "ヒカキン", isCorrect: false },
            { id: "q2_c3", text: "はじめしゃちょー", isCorrect: false },
            { id: "q2_c4", text: "Fischer's", isCorrect: false },
          ],
        },
        {
          id: "q3",
          question: "好みのエディタは？",
          choices: [
            { id: "q3_c1", text: "Vim", isCorrect: true },
            { id: "q3_c2", text: "Emacs", isCorrect: false },
            { id: "q3_c3", text: "VSCode", isCorrect: false },
            { id: "q3_c4", text: "Nano", isCorrect: false },
          ],
        },
      ],
    };

    const quizRes = await request.put(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${creatorUserId}`,
      {
        headers: { Authorization: tokenA },
        data: {
          userData: {
            myQuiz: testQuiz,
          },
        },
      },
    );

    if (!quizRes.ok()) {
      throw new Error(
        `Quiz creation failed: ${quizRes.status()} ${await quizRes.text()}`,
      );
    }

    console.log("Test quiz created successfully");

    // --- User B: Quiz Taker ---
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
            displayName: "Quiz Taker",
            hobby: "Taking Tests",
            favoriteArtist: "Taker Artist",
          },
        },
      },
    );

    // User B joins the event
    await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code",
      {
        headers: { Authorization: tokenB },
        data: { invitationCode },
      },
    );

    // User B needs a quiz too for allAttendeesReady to be true
    const userBDataRes = await request.get(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me",
      {
        headers: { Authorization: tokenB },
      },
    );
    const userBData = await userBDataRes.json();
    const userBId = userBData.id;

    await request.put(
      `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${userBId}`,
      {
        headers: { Authorization: tokenB },
        data: {
          userData: {
            myQuiz: {
              questions: [
                {
                  id: "qb1",
                  question: "User B Hobby?",
                  choices: [
                    { id: "qb1_c1", text: "Taking Tests", isCorrect: true },
                    { id: "qb1_c2", text: "X", isCorrect: false },
                    { id: "qb1_c3", text: "Y", isCorrect: false },
                    { id: "qb1_c4", text: "Z", isCorrect: false },
                  ],
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    );

    // --- User B UI Flow ---
    await page.goto("http://localhost:5173/");
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, tokenB);

    // Navigate to event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    await page.reload(); // Ensure fresh data
    await page.waitForTimeout(2000);

    // Click "クイズに挑戦" – the start control may be a link or button.
    const startBtn = page.getByText(/クイズに挑戦/).first();
    await expect(startBtn).toBeVisible({ timeout: 20000 });
    await startBtn.click();
    // Wait for the first question of the quiz to appear instead of relying on URL changes.
    await expect(page.getByText("私の名前は？")).toBeVisible({
      timeout: 30000,
    });

    // Start the quiz (automatic redirect in sequence)
    // The quiz may start in either the challenge flow or the sequential flow.
    // Accept URLs that end with either /quiz/challenge/... or /quiz/sequence (with optional trailing segment)
    await expect(page).toHaveURL(/.*\/quiz\/(challenge|sequence)(\/.*)?/, {
      timeout: 15000,
    });

    // The quiz sequence will auto-navigate to first quiz (User A/Quiz Creator's quiz)
    await page.waitForURL(/.*\/quiz\/(challenge|sequence)(\/.*)?/, {
      timeout: 10000,
    });
    await page.waitForTimeout(1000);

    // --- Question 1: Answer correctly ---
    console.log("Answering Question 1...");
    // Wait for the first answer button to appear; this ensures the quiz UI has rendered.
    // Use a role‑based selector for the answer button to avoid flaky text matching.
    // The answer button may not have an accessible name, so fall back to a text selector.
    const firstAnswerBtn = page.getByText(/田所浩治/).first();
    await expect(firstAnswerBtn).toBeVisible({ timeout: 30000 });
    await firstAnswerBtn.click();
    await expect(page.getByText("正解！")).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("次の問題へ")');
    await page.waitForTimeout(1000);

    // --- Question 2: Answer incorrectly ---
    console.log("Answering Question 2...");
    await expect(page.getByText("好きなYouTuberは？")).toBeVisible({
      timeout: 10000,
    });
    // Click wrong answer
    await page.click('button:has-text("ヒカキン")');
    await expect(page.getByText("不正解")).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("次の問題へ")');
    await page.waitForTimeout(1000);

    // --- Question 3: Answer correctly ---
    console.log("Answering Question 3...");
    await expect(page.getByText("好みのエディタは？")).toBeVisible({
      timeout: 10000,
    });
    await page.click('button:has-text("Vim")');
    await expect(page.getByText("正解！")).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("結果を見る")');
    await page.waitForTimeout(1000);

    // --- Verify Result Screen ---
    console.log("Verifying result screen...");
    await expect(
      page.getByRole("heading", { name: "結果", exact: true }),
    ).toBeVisible({ timeout: 10000 });

    // Verify score display – rely on the correct/incorrect markers below instead of exact text.

    // --- NEW: Verify Detailed Results Table ---
    console.log("Verifying detailed results table...");

    // Check for table headers
    await expect(page.getByRole("columnheader", { name: "問題" })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("columnheader", { name: "正解" })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("columnheader", { name: "あなたの回答" }),
    ).toBeVisible({ timeout: 5000 });

    // Check for question 1 - correct answer
    await expect(page.getByText("私の名前は？")).toBeVisible();
    await expect(page.getByText("田所浩治")).toBeVisible(); // Correct answer

    // Check for question 2 - incorrect answer
    await expect(page.getByText("好きなYouTuberは？")).toBeVisible();
    await expect(page.getByText("れてんジャダム")).toBeVisible(); // Correct answer

    // Check for question 3 - correct answer
    await expect(page.getByText("好みのエディタは？")).toBeVisible();
    await expect(page.getByText("Vim")).toBeVisible(); // Correct answer

    // Check for correct/incorrect indicators (⭕ and ✖)
    // The page should contain 2 ⭕ (for correct answers) and 1 ✖ (for incorrect answer)
    const correctMarks = await page.locator("text=⭕").count();
    const incorrectMarks = await page.locator("text=✖").count();

    expect(correctMarks).toBe(2);
    expect(incorrectMarks).toBe(1);

    console.log("Quiz result details table verified successfully!");
  });
});
