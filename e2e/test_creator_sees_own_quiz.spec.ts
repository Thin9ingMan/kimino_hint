import { test, expect } from "@playwright/test";

test.describe("Creator Can See Own Quiz", () => {
  test("Creator can view their own quiz content during sequential flow", async ({
    page,
    request,
  }) => {
    test.setTimeout(60000);

    // --- Setup: Create Event & 2 Users via API ---

    // User A: Event Creator
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
            displayName: "Quiz Creator",
            hobby: "Creating Quizzes",
            favoriteArtist: "Test Artist",
          },
        },
      },
    );

    // Create Event (User A)
    const createEventRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
      {
        headers: { Authorization: tokenA },
        data: {
          meta: {
            name: "Creator Quiz View Test",
            description: "Testing creator can see their quiz",
          },
        },
      },
    );
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;

    // Create Quiz for User A with distinct content
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
                  question: "私の好きなアーティストは？",
                  choices: [
                    { id: "c1", text: "Test Artist", isCorrect: true },
                    { id: "c2", text: "Wrong Artist 1", isCorrect: false },
                    { id: "c3", text: "Wrong Artist 2", isCorrect: false },
                    { id: "c4", text: "Wrong Artist 3", isCorrect: false },
                  ],
                  explanation: "私は Test Artist が大好きです！",
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    );

    // --- User B: Joiner ---
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
            displayName: "Quiz Participant",
            hobby: "Testing",
            favoriteArtist: "Another Artist",
          },
        },
      },
    );

    // Join Event as User B
    await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join",
      {
        headers: { Authorization: tokenB },
        data: { invitationCode },
      },
    );

    // Create Quiz for User B
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
                  question: "私の趣味は？",
                  choices: [
                    { id: "c1", text: "Testing", isCorrect: true },
                    { id: "c2", text: "Wrong 1", isCorrect: false },
                    { id: "c3", text: "Wrong 2", isCorrect: false },
                    { id: "c4", text: "Wrong 3", isCorrect: false },
                  ],
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    );

    // --- Login as User A (Creator) ---
    await page.goto("http://localhost:5173/");
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, tokenA);
    await page.reload();

    // Navigate to event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    await page.waitForTimeout(2000);

    // Wait for lobby to be ready
    let lobbyReady = false;
    for (let i = 0; i < 10; i++) {
      await page.reload();
      await page.waitForTimeout(2000);
      const alertVisible = await page
        .getByText("クイズを開始できません")
        .isVisible()
        .catch(() => false);
      if (!alertVisible) {
        lobbyReady = true;
        break;
      }
    }

    if (!lobbyReady) {
      throw new Error("Lobby did not become ready within expected time");
    }

    // Start quiz sequence
    await page.click("text=クイズに挑戦");
    await page.waitForTimeout(2000);

    // User A's quiz should be first (they're the creator/first attendee)
    // The creator should now SEE their quiz content
    const pageContent = await page.innerText("body");

    // Check that the quiz question is visible
    expect(pageContent).toContain("私の好きなアーティストは？");

    // Check that choices are visible
    expect(pageContent).toContain("Test Artist");
    expect(pageContent).toContain("Wrong Artist");

    // Check that there's indication this is their own quiz
    expect(
      pageContent.includes("あなたのクイズ") ||
        pageContent.includes("出題者") ||
        pageContent.includes("プレビュー"),
    ).toBeTruthy();

    // The creator should be able to proceed without answering
    const hasNextButton =
      (await page.getByText("次のクイズへ").isVisible().catch(() => false)) ||
      (await page.getByText("スキップ").isVisible().catch(() => false));

    expect(hasNextButton).toBeTruthy();
  });
});
