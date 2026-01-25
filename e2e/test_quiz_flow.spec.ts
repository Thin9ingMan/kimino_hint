import { test, expect } from "@playwright/test";

test("Quiz Creation Flow", async ({ page }) => {
  // 1. Setup: Create a new event via API (to save UI steps/time)
  // We need a guest token first
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
          displayName: "Test User",
          hobby: "Coding",
          favoriteArtist: "AI",
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
          name: "E2E Test Event",
          description: "Testing Quiz Flow",
          maxParticipants: 10,
        },
      },
    },
  );
  const eventData = await eventRes.json();
  const eventId = eventData.id;

  // 2. Login in browser (set token in localStorage)
  await page.goto("http://localhost:5173/");
  await page.evaluate((t) => {
    localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
  }, token);
  await page.reload();

  // 3. Go to Event Lobby
  await page.goto(`http://localhost:5173/events/${eventId}`);
  await expect(page.getByText("E2E Test Event")).toBeVisible();

  // 4. Click "Edit My Quiz" (or "Create Quiz")
  await page.click("text=自分のクイズを編集"); // Button text might be "クイズを作成" or "クイズを編集"
  // Wait for navigation
  await page.waitForURL(`**/events/${eventId}/quiz`);

  // In QuizIntro, click Create/Edit
  await page.click("text=クイズを作成"); // or クイズを編集
  await page.waitForURL(`**/events/${eventId}/quiz/edit`);

  // 5. Fill Quiz Form
  // Check if profile data is loaded (Correct Answer: Test User)
  // The correct answer is displayed in the first input (cyan background)
  await expect(page.locator('input[value="Test User"]').first()).toBeVisible();

  // Check that the generate button exists
  await expect(page.getByText("誤答を生成")).toBeVisible();

  // Manually fill the wrong answer choices for all visible questions
  // There are multiple questions, so we need to fill all of them
  const wrongChoices = page.locator('input[placeholder="間違いの選択肢..."]');
  const count = await wrongChoices.count();

  // Fill all wrong answer inputs
  for (let i = 0; i < count; i++) {
    await wrongChoices.nth(i).fill(`Choice ${i + 1}`);
  }

  // Save the quiz
  await page.click("text=保存して完了");

  // 7. Verify return to lobby
  await page.waitForURL(`**/events/${eventId}`);
  await expect(page.getByText("参加者")).toBeVisible();

  console.log("Quiz creation flow verified successfully");
});
