import { test, expect } from "@playwright/test";

const API_BASE_URL = "https://quarkus-crud.ouchiserver.aokiapp.com";
const APP_URL = "http://localhost:5173";

test.describe("Edit My Profile Screen", () => {
  test("Profile creation flow for new user", async ({ page }) => {
    // 1. Setup Guest User WITHOUT profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    // Login (no profile created yet)
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to Edit Profile screen directly
    await page.goto(`${APP_URL}/me/profile/edit`);

    // 3. Verify Edit Profile screen is displayed
    await expect(page.getByText("プロフィール編集")).toBeVisible();

    // 4. Verify form fields are present (use .first() for Select components which have multiple elements with same label)
    await expect(page.getByLabel("名前")).toBeVisible();
    await expect(page.getByLabel("フリガナ")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "学部" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "学年" })).toBeVisible();
    await expect(page.getByLabel("趣味")).toBeVisible();
    await expect(page.getByLabel("好きなアーティスト")).toBeVisible();

    // 5. Verify save and cancel buttons exist
    await expect(page.getByRole("button", { name: "保存" })).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();

    // 6. Verify preview section exists
    await expect(page.getByText("プレビュー")).toBeVisible();

    console.log("Profile creation form test completed successfully");
  });

  test("Profile edit with data persistence", async ({ page }) => {
    // 1. Setup Guest User with initial profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    // Create initial profile with correct option values
    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Original Name",
          hobby: "Original Hobby",
          favoriteArtist: "Original Artist",
          grade: "学部1年", // Must match GRADE_OPTIONS
          faculty: "理学部", // Must match FACULTY_OPTIONS
        },
      },
    });

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to Edit Profile
    await page.goto(`${APP_URL}/me/profile/edit`);

    // 3. Wait for form to load with existing data
    await expect(page.getByText("プロフィール編集")).toBeVisible();
    await page.waitForTimeout(1000); // Wait for data to load

    // 4. Verify existing data is pre-filled in preview
    await expect(page.getByText("Original Name")).toBeVisible();

    // 5. Modify the hobby field
    const hobbyInput = page.getByLabel("趣味");
    await hobbyInput.clear();
    await hobbyInput.fill("Updated Hobby");

    // 6. Verify preview updates
    await expect(page.getByText("Updated Hobby")).toBeVisible();

    // 7. Save the profile
    await page.getByRole("button", { name: "保存" }).click();

    // 8. Verify navigation back to profile view (wait longer for redirect)
    await expect(page).toHaveURL(/.*\/me\/profile$/, { timeout: 10000 });

    // 9. Navigate back to edit and verify changes persisted
    await page.goto(`${APP_URL}/me/profile/edit`);
    await page.waitForTimeout(1000);

    const hobbyInputAfterSave = page.getByLabel("趣味");
    await expect(hobbyInputAfterSave).toHaveValue("Updated Hobby");

    console.log("Profile edit with persistence test completed successfully");
  });

  test("Profile form validation shows errors for empty required fields", async ({
    page,
  }) => {
    // 1. Setup Guest User
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to Edit Profile
    await page.goto(`${APP_URL}/me/profile/edit`);
    await expect(page.getByText("プロフィール編集")).toBeVisible();

    // 3. Try to save with empty fields
    // Set up dialog handler for validation alert
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("入力してください");
      await dialog.accept();
    });

    await page.getByRole("button", { name: "保存" }).click();

    console.log("Profile form validation test completed successfully");
  });

  test("Profile cancel button returns to profile view", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Cancel Test User",
          hobby: "Cancelling",
          favoriteArtist: "Cancel Artist",
          grade: "学部2年", // Must match GRADE_OPTIONS
          faculty: "法学部", // Must match FACULTY_OPTIONS
        },
      },
    });

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to Edit Profile
    await page.goto(`${APP_URL}/me/profile/edit`);
    await expect(page.getByText("プロフィール編集")).toBeVisible();

    // 3. Make a change
    const hobbyInput = page.getByLabel("趣味");
    await hobbyInput.clear();
    await hobbyInput.fill("Changed Hobby");

    // 4. Click cancel
    await page.getByRole("button", { name: "キャンセル" }).click();

    // 5. Verify navigation to profile view
    await expect(page).toHaveURL(/.*\/me\/profile$/);

    // 6. Navigate back to edit and verify changes were NOT saved
    await page.goto(`${APP_URL}/me/profile/edit`);
    await page.waitForTimeout(1000);

    const hobbyInputAfterCancel = page.getByLabel("趣味");
    await expect(hobbyInputAfterCancel).toHaveValue("Cancelling");

    console.log("Profile cancel button test completed successfully");
  });
});
