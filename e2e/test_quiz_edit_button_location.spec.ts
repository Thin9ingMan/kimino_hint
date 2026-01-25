import { test, expect } from "@playwright/test";

/**
 * Test for quiz edit screen button location enhancement
 *
 * This test validates that:
 * 1. The "固定項目を自動埋め" button is NOT at the top of the screen
 * 2. The "↺誤答を生成" button IS in the bottom fixed pill
 * 3. The button is between "キャンセル" and "保存して完了" buttons
 * 4. The button maintains its functionality (fills in random answers)
 */
test.describe("Quiz Edit Screen - Button Location", () => {
  test("Button should be in bottom fixed pill with new name", async ({
    page,
    request,
  }) => {
    test.setTimeout(90000);

    // --- Setup: Create User and Event ---

    // Create User
    const user_res = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const token = user_res.headers()["authorization"];

    // Set Profile with required fields
    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: token },
        data: {
          profileData: {
            displayName: "Test User",
            hobby: "Testing",
            favoriteArtist: "Test Artist",
            faculty: "工学部",
            grade: "2年生",
          },
        },
      },
    );

    // Create Event
    const createEventRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
      {
        headers: { Authorization: token },
        data: {
          meta: {
            name: "Button Location Test Event",
            description: "Testing button location",
          },
        },
      },
    );
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;

    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}`);

    // Join the event
    await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code",
      {
        headers: { Authorization: token },
        data: { invitationCode },
      },
    );

    // --- UI Flow ---
    await page.goto("http://localhost:5173/");
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);

    // Navigate to quiz edit screen
    await page.goto(`http://localhost:5173/events/${eventId}/quiz/edit`);
    await page.waitForTimeout(2000);

    // Verify we're on the quiz edit screen. The heading text is "クイズ編集" in the current UI.
    await expect(page.getByText("クイズ編集")).toBeVisible({
      timeout: 10000,
    });

    // --- Test 1: Old button should NOT be at the top ---
    console.log("Test 1: Checking that old button is not at top...");

    // Get the header/top section (first ~200px of viewport)
    const topSection = page.locator("body").first();

    // The old "固定項目を自動埋め" button should NOT be visible at the top
    const oldButtonAtTop = topSection.locator(
      'button:has-text("固定項目を自動埋め")',
    );
    const isOldButtonAtTopVisible =
      (await oldButtonAtTop.count()) > 0 &&
      (await oldButtonAtTop.isVisible().catch(() => false));

    if (isOldButtonAtTopVisible) {
      const boundingBox = await oldButtonAtTop.boundingBox();
      console.error(
        `FAIL: Old button "固定項目を自動埋め" found at top of screen at position y=${boundingBox?.y}`,
      );
      throw new Error("Old button should not be at top of screen");
    }

    console.log("✓ Old button not found at top");

    // --- Test 2: New button should be in bottom fixed pill ---
    console.log("Test 2: Checking for new button in bottom pill...");

    // The bottom fixed pill is a Paper component with fixed position
    const bottomPill = page
      .locator('[style*="position: fixed"]')
      .filter({ hasText: "キャンセル" });

    // Verify bottom pill exists
    await expect(bottomPill).toBeVisible({ timeout: 5000 });
    console.log("✓ Bottom pill found");

    // The new button "↺誤答を生成" should be in the bottom pill
    const newButton = bottomPill.locator('button:has-text("誤答を生成")');
    await expect(newButton).toBeVisible({ timeout: 5000 });
    console.log('✓ New button "誤答を生成" found in bottom pill');

    // --- Test 3: Button should be between Cancel and Save buttons ---
    console.log("Test 3: Checking button order...");

    const cancelButton = bottomPill.locator('button:has-text("キャンセル")');
    const saveButton = bottomPill.locator('button:has-text("保存して完了")');

    await expect(cancelButton).toBeVisible();
    await expect(saveButton).toBeVisible();

    // Get all buttons in the bottom pill
    const allButtons = await bottomPill.locator("button").all();
    console.log(`Found ${allButtons.length} buttons in bottom pill`);

    // Verify we have exactly 3 buttons
    expect(allButtons.length).toBe(3);

    // Verify button order by getting their text content
    const buttonTexts = await Promise.all(
      allButtons.map((btn) => btn.textContent()),
    );
    console.log("Button order:", buttonTexts);

    // The order should be: キャンセル, 誤答を生成 (with ↺), 保存して完了
    expect(buttonTexts[0]).toContain("キャンセル");
    expect(buttonTexts[1]).toContain("誤答を生成");
    expect(buttonTexts[2]).toContain("保存して完了");

    console.log("✓ Buttons are in correct order: Cancel, Generate, Save");

    // --- Test 4: Button functionality - clicking fills in random answers ---
    console.log("Test 4: Testing button functionality...");

    // Get initial state of a wrong answer field (should be empty)
    const wrongAnswerInputs = page.locator(
      'input[placeholder*="間違いの選択肢"]',
    );
    const firstWrongAnswer = wrongAnswerInputs.first();
    const initialValue = await firstWrongAnswer.inputValue();

    console.log(`Initial value of first wrong answer: "${initialValue}"`);

    // Click the generate button
    await newButton.click();

    // Wait for generation to complete
    await page.waitForTimeout(3000);

    // Check if values were filled
    const newValue = await firstWrongAnswer.inputValue();
    console.log(`After clicking button, first wrong answer: "${newValue}"`);

    // The value should have changed (filled with generated content)
    expect(newValue).not.toBe(initialValue);
    expect(newValue.length).toBeGreaterThan(0);

    console.log("✓ Button functionality works - random answers generated");

    console.log("\n=== ALL TESTS PASSED ===");
    console.log("✓ Old button removed from top");
    console.log("✓ New button exists in bottom pill");
    console.log("✓ Button order is correct (Cancel → Generate → Save)");
    console.log("✓ Button functionality preserved");
  });
});
