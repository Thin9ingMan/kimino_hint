import { test, expect } from "@playwright/test";

/**
 * Test for question order bug: "名前に関する質問が2連続になっている"
 *
 * Expected order:
 * 1. 私の「名前」はどれ？
 * 2. 私の「学部」はどれ？
 * 3. 私の「学年」はどれ？
 * 4. 私の「趣味」はどれ？
 * 5. 改めて、私の「名前」はどれ？
 * 6. 私の「好きなアーティスト」はどれ？
 */
test.describe("Question Order Verification", () => {
  test("Quiz questions appear in the correct order", async ({
    page,
    request,
  }) => {
    test.setTimeout(90000);

    // --- Setup: Create User A with complete profile ---
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
            displayName: "山田 太郎",
            faculty: "工学部",
            grade: "3年生",
            hobby: "プログラミング",
            favoriteArtist: "YOASOBI",
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
            name: "Question Order Test Event",
            description: "Testing question order",
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

    // --- User A: Navigate to Quiz Edit screen to verify question order ---
    await page.goto("http://localhost:5173/");
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, tokenA);

    // Navigate to event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    await page.waitForTimeout(1000);

    // Click "自分のクイズを編集"
    await page.click("text=自分のクイズを編集");
    await page.waitForTimeout(1000);

    // Click "クイズを作成" or navigate to edit
    await page.click("text=クイズを作成");
    await page.waitForTimeout(2000);

    // Verify we're on the edit screen
    await expect(page).toHaveURL(new RegExp(`/events/${eventId}/quiz/edit`));
    await expect(page.getByText("クイズエディタ")).toBeVisible({
      timeout: 10000,
    });

    // Get all question cards in order
    const questionCards = page.locator(".mantine-Card-root");
    const questionCount = await questionCards.count();

    console.log(`Found ${questionCount} question cards`);

    // Expected: 6 questions (names, faculty, grade, hobby, verySimilarNames, artist)
    // But they should appear in a specific order
    expect(questionCount).toBeGreaterThanOrEqual(5); // At least the basic questions

    // Extract question titles in order
    const questionTitles: string[] = [];
    for (let i = 0; i < questionCount; i++) {
      const card = questionCards.nth(i);
      const titleInput = card.locator(
        'input[placeholder="例: 私の趣味は何でしょう？"]',
      );
      const title = await titleInput.inputValue();
      questionTitles.push(title);
      console.log(`Question ${i + 1}: ${title}`);
    }

    // Verify the correct order
    // Expected order when all profile fields are filled:
    // 1. 私の「名前」はどれ？
    // 2. 私の「学部」はどれ？
    // 3. 私の「学年」はどれ？
    // 4. 私の「趣味」はどれ？
    // 5. 改めて、私の「名前」はどれ？
    // 6. 私の「好きなアーティスト」はどれ？

    const expectedOrder = [
      "私の「名前」はどれ？",
      "私の「学部」はどれ？",
      "私の「学年」はどれ？",
      "私の「趣味」はどれ？",
      "改めて、私の「名前」はどれ？",
      "私の「好きなアーティスト」はどれ？",
    ];

    // Check if we have the expected questions
    for (
      let i = 0;
      i < Math.min(expectedOrder.length, questionTitles.length);
      i++
    ) {
      console.log(
        `Checking position ${i + 1}: expected "${expectedOrder[i]}", got "${questionTitles[i]}"`,
      );
      expect(questionTitles[i]).toBe(expectedOrder[i]);
    }

    // Specifically check that "改めて、私の「名前」はどれ？" is NOT in position 2
    if (
      questionTitles.length >= 2 &&
      questionTitles[1] === "改めて、私の「名前」はどれ？"
    ) {
      throw new Error(
        'BUG REPRODUCED: "改めて、私の「名前」はどれ？" appears at position 2 instead of position 5!',
      );
    }

    // Check that "改めて、私の「名前」はどれ？" appears at position 5 (index 4)
    if (questionTitles.length >= 5) {
      expect(questionTitles[4]).toBe("改めて、私の「名前」はどれ？");
    }

    console.log("Question order verification completed successfully");
  });
});
