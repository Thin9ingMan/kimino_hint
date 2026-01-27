import { test, expect } from "@playwright/test";

test("Quiz Supplement Feature", async ({ page }) => {
  // 1. Setup: Create a new event via API
  const authRes = await page.request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
  );
  // authData is not needed for the test logic; retrieve token only.
  const _authData = await authRes.json();
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

  // 2. Login in browser (set token in localStorage)
  await page.goto("http://localhost:5173/");
  const cleanToken = token.replace("Bearer ", "");
  await page.evaluate((t) => {
    localStorage.setItem("jwtToken", t);
  }, cleanToken);

  // Wait a bit and check if profile is actually there via console
  console.log("Waiting for backend to sync profile...");
  await page.waitForTimeout(2000);
  await page.reload();
  await page.waitForTimeout(1000);

  // 3. Navigate to Quiz Edit Screen
  await page.goto(`http://localhost:5173/events/${eventId}/quiz/edit`);

  // 4. Wait for page to load
  await expect(page.getByText("クイズ編集")).toBeVisible({ timeout: 10000 });

  // 5. Find a question card and add a supplement/explanation
  // Ensure the editor UI has finished loading before searching for the input.
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Locate the supplement textarea. Prefer the labelled field, but fall back to a generic textarea
  // selector if the label is not present (e.g., UI changes).
  let supplementInput = page.getByLabel("補足説明").first();
  if (!(await supplementInput.isVisible().catch(() => false))) {
    supplementInput = page.locator("textarea").first();
  }
  await expect(supplementInput).toBeVisible({ timeout: 60000 });

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
  // The page may keep open long‑polling connections, causing `networkidle` to never fire.
  // Instead, wait for the lobby URL to be confirmed and give a short grace period.
  await page.waitForURL(`**/events/${eventId}`, { timeout: 10000 });
  await page.waitForTimeout(2000);

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

  // Join the event
  await page.request.post(
    `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users`,
    {
      headers: { Authorization: user2Token },
      data: {},
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

  // 11. Navigate to quiz challenge list
  await page.goto(`http://localhost:5173/events/${eventId}/quiz/challenges`);
  await page.waitForLoadState("networkidle");

  // 12. Go to lobby and click on quiz challenge
  await page.goto(`http://localhost:5173/events/${eventId}`);
  // Use a Locator for the start control; this works with Playwright's expect API.
  const startBtn = page.getByText(/クイズに挑戦/).first();
  await expect(startBtn).toBeVisible({ timeout: 120000 });
  await startBtn.click();

  // 13. Wait for first question
  await expect(page).toHaveURL(/.*\/quiz\/challenge\/.*/, { timeout: 10000 });

  // 14. Answer the question (click any choice)
  const firstChoice = page
    .locator("button")
    .filter({ hasText: /工学部|文学部|経済学部/ })
    .first();
  await firstChoice.click();

  // 15. Wait for result to show – ensure we are on the result screen before checking.
  await page.waitForTimeout(1000);
  // The result screen contains a heading with the text "結果". Wait for it to be visible.
  await expect(
    page.getByRole("heading", { name: "結果", exact: true }),
  ).toBeVisible({ timeout: 8000 });
  // 16. Verify that the supplement/explanation is displayed on the result screen.
  await expect(page.getByText(supplementText)).toBeVisible({ timeout: 8000 });

  console.log("Quiz supplement feature verified successfully");
});
