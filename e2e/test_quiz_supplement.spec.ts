import { test, expect } from "@playwright/test";

test("Quiz Supplement Feature", async ({ page }) => {
  // Increase test timeout because this test involves multiple API calls and navigation
  test.setTimeout(120000);
  // 1. Setup: Create a new event via API
  const authRes = await page.request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
  );
  const authData = await authRes.json();
  const token = authRes.headers()["authorization"];

  // Create profile
  await page.request.put(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
    {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "補足テストユーザー",
          hobby: "読書",
          favoriteArtist: "YOASOBI",
        },
      },
    },
  );

  // Create Event
  const eventRes = await page.request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
    {
      headers: { Authorization: token },
      data: {
        meta: {
          name: "補足機能テストイベント",
          description: "Testing Quiz Supplement Feature",
          maxParticipants: 10,
        },
      },
    },
  );
  const eventData = await eventRes.json();
  const eventId = eventData.id;
  const invitationCode = eventData.invitationCode;

  // 2. Login in browser (set token in localStorage)
  await page.goto("http://localhost:5173/");
  const cleanToken = token.replace("Bearer ", "");
  await page.evaluate((t) => {
    localStorage.setItem("jwtToken", t);
  }, cleanToken);

  // Wait for profile data to be synced by polling the API
  console.log("Waiting for backend to sync profile...");
  const maxRetries = 10;
  const retryDelay = 1000;
  let profileSynced = false;

  for (let attempt = 0; attempt < maxRetries && !profileSynced; attempt++) {
    const profileRes = await page.request.get(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      { headers: { Authorization: token } },
    );
    if (profileRes.ok()) {
      const profileData = await profileRes.json();
      if (profileData?.profileData?.displayName === "補足テストユーザー") {
        profileSynced = true;
        console.log(`Profile synced after ${attempt + 1} attempt(s)`);
        break;
      }
    }
    // Wait before next retry, but not after the last attempt
    if (attempt < maxRetries - 1) {
      await page.waitForTimeout(retryDelay);
    }
  }

  if (!profileSynced) {
    throw new Error("Profile failed to sync within timeout");
  }

  await page.reload();

  // 3. Navigate to Quiz Edit Screen
  await page.goto(`http://localhost:5173/events/${eventId}/quiz/edit`);

  // 4. Wait for page to load and quiz editor to be ready with profile data
  await expect(page.getByText("クイズ編集")).toBeVisible({ timeout: 15000 });

  // 5. Wait for the quiz editor content to load (profile-based questions)
  // This ensures profile data has been properly loaded by the app

  // Look for the "補足説明" label (it's in a Divider element)
  // Multiple elements exist (one per question), so use .first()
  await expect(page.getByText("補足説明（任意）").first()).toBeVisible({
    timeout: 10000,
  });

  // Find the supplement textarea - it has a label "補足説明"
  const supplementInput = page.getByLabel("補足説明").first();
  await expect(supplementInput).toBeVisible();

  // Add a supplement text
  const supplementText =
    "この質問は私の趣味に関するものです。読書が好きな理由は、新しい世界を知ることができるからです。";
  await supplementInput.fill(supplementText);

  // 6. Click auto-generate to fill choices
  await page.click("text=誤答を生成");
  // Wait for the auto-generation to complete by checking for filled choices
  await page.waitForTimeout(5000); // LLM takes time

  // 7. Save the quiz
  await page.click("text=保存して完了");

  // 8. Wait for navigation back to event lobby
  await page.waitForURL(`**/events/${eventId}`, { timeout: 10000 });

  // 8.5. Navigate back to quiz edit to verify data persistence
  await page.goto(`http://localhost:5173/events/${eventId}/quiz/edit`);
  await expect(page.getByText("クイズ編集")).toBeVisible({ timeout: 10000 });

  // Verify the supplement text is still there after reload
  const reloadedSupplementInput = page
    .locator("textarea")
    .filter({ hasText: supplementText })
    .first();
  await expect(reloadedSupplementInput).toBeVisible({ timeout: 5000 });
  await expect(reloadedSupplementInput).toHaveValue(supplementText);

  // Navigate back to event lobby for the next part of the test
  await page.goto(`http://localhost:5173/events/${eventId}`);
  await page.waitForLoadState("domcontentloaded");

  // 9. Now create a second user to answer the quiz
  const user2AuthRes = await page.request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
  );
  const user2Token = user2AuthRes.headers()["authorization"];

  // Create profile for user2
  await page.request.put(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
    {
      headers: { Authorization: user2Token },
      data: {
        profileData: {
          displayName: "回答者ユーザー",
          furigana: "カイトウシャユーザー",
          hobby: "映画鑑賞",
          favoriteArtist: "米津玄師",
          faculty: "文学部",
          grade: "3年生",
        },
      },
    },
  );

  // Join the event using invitation code
  await page.request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code",
    {
      headers: { Authorization: user2Token },
      data: { invitationCode },
    },
  );

  // User 2 needs a quiz too
  const user2MeRes = await page.request.get(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/me",
    {
      headers: { Authorization: user2Token },
    },
  );
  const user2MeData = await user2MeRes.json();
  const user2Id = user2MeData.id;

  await page.request.put(
    `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${user2Id}`,
    {
      headers: { Authorization: user2Token },
      data: {
        userData: {
          myQuiz: {
            questions: [
              {
                id: "u2q1",
                question: "User 2 Hobby?",
                choices: [
                  { id: "u2q1c1", text: "映画鑑賞", isCorrect: true },
                  { id: "u2q1c2", text: "X", isCorrect: false },
                  { id: "u2q1c3", text: "Y", isCorrect: false },
                  { id: "u2q1c4", text: "Z", isCorrect: false },
                ],
              },
            ],
            updatedAt: new Date().toISOString(),
          },
        },
      },
    },
  );

  // 10. Login as user2
  await page.evaluate((t) => {
    localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
  }, user2Token);

  // Reload to apply new token
  await page.reload();
  await page.waitForLoadState("domcontentloaded");

  // 11. Navigate to event lobby directly (skip quiz challenge list)
  await page.goto(`http://localhost:5173/events/${eventId}`);
  // Wait for page to load - look for ロビー title
  await expect(page.locator("h1").filter({ hasText: "ロビー" })).toBeVisible({ timeout: 15000 });
  // Wait for the quiz challenge button to be visible and clickable
  await expect(page.getByText("クイズに挑戦")).toBeVisible({ timeout: 10000 });
  await page.click("text=クイズに挑戦");

  // 13. Wait for quiz sequence to load and navigate to first challenge
  // The sequence page should automatically redirect to the first quiz challenge
  await page.waitForURL(/.*\/quiz\/(sequence|challenge\/.*)/, { timeout: 15000 });

  // Wait for question content to load with retry on error
  // The first question should be about user1's name "補足テストユーザー"
  const questionLocator = page.getByText("私の「名前」はどれ？");
  
  // Keep retrying until question is visible or max attempts reached
  for (let retryAttempt = 0; retryAttempt < 10; retryAttempt++) {
    // Check if question is visible
    const isQuestionVisible = await questionLocator.isVisible().catch(() => false);
    if (isQuestionVisible) {
      break;
    }
    
    // Check if there's an error with retry button
    const retryButton = page.getByRole("button", { name: "再試行" });
    const hasRetryButton = await retryButton.isVisible().catch(() => false);
    if (hasRetryButton) {
      console.log(`Retry attempt ${retryAttempt + 1} - clicking retry button`);
      await retryButton.click();
      await page.waitForTimeout(2000);
    } else {
      // Wait a bit before checking again
      await page.waitForTimeout(1000);
    }
  }
  
  await expect(questionLocator).toBeVisible({ timeout: 10000 });

  // 14. Answer the question - click any choice button
  // The quiz shows 4 buttons for choices - click one of them
  const choiceButtons = page.locator('button[data-answer]');
  const buttonCount = await choiceButtons.count();
  if (buttonCount > 0) {
    await choiceButtons.first().click();
  } else {
    // Fallback - click any visible choice button
    const anyChoice = page.locator("button").filter({ hasText: /テスト|ユーザー/ }).first();
    await expect(anyChoice).toBeVisible({ timeout: 10000 });
    await anyChoice.click();
  }

  // 15. Wait for result to show - the supplement text should appear after answering
  // 16. Verify that the supplement/explanation is displayed
  await expect(page.getByText(supplementText)).toBeVisible({ timeout: 10000 });

  console.log("Quiz supplement feature verified successfully");
});
