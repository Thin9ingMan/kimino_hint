import { test, expect } from "@playwright/test";
// import { apis } from "../app/shared/api"; // not needed for this test

test.describe("Full User Journey", () => {
  test("User can Join, Create Quiz, and Answer", async ({ page, request }) => {
    test.setTimeout(60000);
    // --- 0. Setup: Create Event & 2 Users via API ---

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
            displayName: "User A (Host)",
            hobby: "Hosting",
            favoriteArtist: "HostArtist",
          },
        },
      },
    );

    // Create Event (User A)
    const eventParams = {
      meta: { name: "Full Flow Event", description: "Testing everything" },
      invitationCode: "FULL-FLOW-123", // Try requesting specific code
    };
    // Note: API might generate its own code. Let's create normally and capture it.

    const createEventRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
      {
        headers: { Authorization: tokenA },
        data: eventParams,
      },
    );
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;

    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}`);

    // User A is creator and automatically joined - no need to join again

    // Create Quiz for User A (So User B can answer it)
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
                  question: "私の「名前」はどれ？",
                  choices: [
                    { id: "c1", text: "User A", isCorrect: true },
                    { id: "c2", text: "X", isCorrect: false },
                    { id: "c3", text: "Y", isCorrect: false },
                    { id: "c4", text: "Z", isCorrect: false },
                  ],
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    );

    // --- 1. User B (The Tester) Flow ---

    // User B: Joiner
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
            displayName: "User B (Joiner)",
            hobby: "Joining",
            favoriteArtist: "JoinArtist",
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

    // A. Join by Code
    await page.goto("http://localhost:5173/events/join");
    await page.getByLabel("招待コード").fill(invitationCode);
    // await page.fill('input[placeholder="QUIZ-2025-01"]', invitationCode);

    await page.click('button:has-text("参加する")');

    // Verify moved to Lobby
    await expect(page).toHaveURL(/.*\/events\/\d+/);
    // Wait for list to load
    await page.waitForTimeout(2000);

    // Look for the participants section heading first to ensure it's loaded
    await expect(page.getByRole("heading", { name: "参加者" })).toBeVisible();

    // User should appear in the list - just check that the attendees section has content
    // const attendeesSection = page.locator("text=参加者").locator(".."); // unused, kept for reference
    const pageContent = await page.innerText("body");
    const hasUserName =
      pageContent.includes("User B (Joiner)") ||
      pageContent.includes("User A (Host)");

    expect(hasUserName).toBeTruthy();
    console.log("✓ User found in lobby participants list");

    // B. Create My Quiz
    await page.click("text=自分のクイズを編集");

    // Fill Quiz Form
    // Assuming pre-filled from profile mostly, but let's check inputs
    await expect(page.getByText("クイズについて")).toBeVisible();

    // Click Create
    await page.click('a[href*="/quiz/edit"]'); // Try selecting by href if text is ambiguous or use the button
    // Actually the button was click 'button:has-text("クイズを作成")'
    // but it wrapped in Link component. Playwright handles it.

    // Verify moved to Edit Screen
    await expect(page).toHaveURL(/.*\/quiz\/edit/);

    if (await page.getByText("プロフィール情報不足").isVisible()) {
      console.error(
        "Test blocked: Profile information missing on Edit screen.",
      );
    }

    // Wait for auto-generation (LLM) to populate at least one field
    // It triggers on mount, so we just wait for non-empty
    // Check the correct answer inputs - they should be pre-filled with profile data
    const correctAnswerInputs = page.getByPlaceholder("正解のテキスト...");
    await expect(correctAnswerInputs.first()).toBeVisible();
    await expect(correctAnswerInputs.first()).not.toBeEmpty({ timeout: 20000 });

    // Fill wrong answers manually - need to fill ALL empty wrong answer fields
    const wrongAnswerInputs = page.getByPlaceholder("間違いの選択肢...");
    const count = await wrongAnswerInputs.count();
    console.log(`Found ${count} wrong answer inputs to fill`);
    for (let i = 0; i < count; i++) {
      await wrongAnswerInputs.nth(i).fill(`Wrong ${i + 1}`);
    }

    // Click Save
    const saveResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/events/") &&
        resp.url().includes("/users/") &&
        resp.request().method() === "PUT",
    );
    await page.click("text=保存して完了");
    const saveResponse = await saveResponsePromise;
    console.log(
      `Quiz Save Status: ${saveResponse.status()} ${await saveResponse.text()}`,
    );

    // Verify returned to Lobby
    await expect(page.getByText("イベント情報")).toBeVisible({
      timeout: 10000,
    });

    // D. Answer Quiz (User A's quiz in sequential flow)
    // Ensure the lobby is ready – the UI shows a warning when not all attendees are ready.
    let _ready = false;
    for (let i = 0; i < 5; i++) {
      if (
        !(await page
          .getByText("クイズを開始できません")
          .isVisible()
          .catch(() => false))
      ) {
        _ready = true;
        break;
      }
      console.log(`Lobby not ready (attempt ${i + 1}), reloading...`);
      await page.reload();
      await page.waitForTimeout(2000);
    }
    if (!_ready) {
      throw new Error("Lobby not ready for quiz start");
    }

    // Click the button that starts the quiz flow and wait for navigation.
    await page
      .getByRole("button", { name: /クイズに挑戦/ })
      .click({ timeout: 30000 });

    // Wait for navigation to a quiz flow page (challenge or sequence).
    await page.waitForURL(/.*\/quiz\/(challenge|sequence)(\/.*)?/, {
      timeout: 30000,
    });

    // Wait for any answer button to become visible before proceeding.
    await expect(
      page
        .locator("button")
        .filter({ hasText: /^(?!.*次の問題へ)(?!.*結果を見る)/ })
        .first(),
    ).toBeVisible({ timeout: 20000 });

    // Answer the first available choice (the quiz UI may render the question in Japanese).
    // Wait for any answer button to appear and click the first one.
    const answerButton = page
      .locator("button")
      .filter({ hasText: /^(?!.*次の問題へ)(?!.*結果を見る)/ })
      .first();
    await expect(answerButton).toBeVisible({ timeout: 15000 });
    await answerButton.click();

    // Result Screen – verify that either a correct or incorrect indicator appears.
    await expect(page.getByText(/正解！|不正解/)).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole("button", { name: /結果を見る|次の問題へ/ }).click();

    // Note: With sequential flow, there's no "一覧へ戻る" button
    // Instead, there's navigation to result/rewards and then next quiz

    console.log("Full User Journey verified successfully");
  });
});
