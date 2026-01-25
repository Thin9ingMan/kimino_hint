import { test, expect } from "@playwright/test";

const API_BASE_URL = "https://quarkus-crud.ouchiserver.aokiapp.com";
const APP_URL = "http://localhost:5173";

test.describe("My Profile Screen", () => {
  test("My Profile displays profile card with share options", async ({
    page,
  }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Profile Card Tester",
          hobby: "Testing Profile Cards",
          favoriteArtist: "Card Artist",
          grade: "3年",
          faculty: "経済学部",
        },
      },
    });

    // Get user ID
    const meRes = await page.request.get(`${API_BASE_URL}/api/me`, {
      headers: { Authorization: token },
    });
    const userData = await meRes.json();
    const userId = userData.id;

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to My Profile
    await page.goto(`${APP_URL}/me/profile`);

    // 3. Verify My Profile screen title
    await expect(page.getByText("自分のプロフィール")).toBeVisible();

    // 4. Verify profile data is displayed
    await expect(page.getByText("Profile Card Tester")).toBeVisible();
    await expect(page.getByText(`userId: ${userId}`)).toBeVisible();
    await expect(page.getByText("Testing Profile Cards")).toBeVisible();
    await expect(page.getByText("Card Artist")).toBeVisible();

    // 5. Verify action buttons exist
    await expect(page.getByRole("button", { name: "編集する" })).toBeVisible();
    await expect(page.getByRole("button", { name: "共有する" })).toBeVisible();

    console.log("My Profile display test completed successfully");
  });

  test("My Profile share modal shows QR code", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "QR Share Tester",
          hobby: "Sharing QR",
          favoriteArtist: "QR Artist",
        },
      },
    });

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to My Profile
    await page.goto(`${APP_URL}/me/profile`);

    // 3. Click share button to open modal
    await page.click('button:has-text("共有する")');

    // 4. Verify modal is displayed
    await expect(page.getByText("プロフィール交換QR")).toBeVisible();
    await expect(
      page.getByText("このQRを相手に読み取ってもらうと"),
    ).toBeVisible();

    // 5. Verify QR code image exists
    await expect(
      page.locator('img[alt="プロフィール交換QR"]'),
    ).toBeVisible();

    // 6. Verify action buttons in modal
    await expect(
      page.getByRole("button", { name: "URLをコピー" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "公開プロフィールを開く" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "共有する" })).toBeVisible();
    await expect(page.getByRole("button", { name: "閉じる" })).toBeVisible();

    // 7. Close the modal
    await page.click('button:has-text("閉じる")');
    await expect(page.getByText("プロフィール交換QR")).not.toBeVisible();

    console.log("My Profile share modal test completed successfully");
  });

  test("My Profile edit button navigates to edit screen", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Edit Button Tester",
          hobby: "Testing Edit",
          favoriteArtist: "Edit Artist",
        },
      },
    });

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to My Profile
    await page.goto(`${APP_URL}/me/profile`);

    // 3. Click edit button
    await page.click('button:has-text("編集する")');

    // 4. Verify navigation to edit screen
    await expect(page).toHaveURL(/.*\/me\/profile\/edit$/);
    await expect(page.getByText("プロフィール編集")).toBeVisible();

    console.log("My Profile edit navigation test completed successfully");
  });

  test("My Profile empty state prompts profile creation", async ({ page }) => {
    // 1. Setup Guest User WITHOUT profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    // Login (no profile created)
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to My Profile - should redirect or show create prompt
    await page.goto(`${APP_URL}/me/profile`);

    // 3. Wait for either redirect to edit or display of create prompt
    // The component either shows a redirect alert or an empty state message
    const hasCreatePrompt = await page
      .getByText("プロフィールを作成する")
      .isVisible()
      .catch(() => false);
    const hasRedirectAlert = await page
      .getByText("プロフィールを作りましょう")
      .isVisible()
      .catch(() => false);
    const wasRedirected = page.url().includes("/me/profile/edit");

    expect(hasCreatePrompt || hasRedirectAlert || wasRedirected).toBeTruthy();

    console.log("My Profile empty state test completed successfully");
  });

  test("My Profile accessible from Me Hub", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Me Hub Nav Tester",
          hobby: "Hub Navigation",
          favoriteArtist: "Hub Artist",
        },
      },
    });

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to Me Hub
    await page.goto(`${APP_URL}/me`);

    // 3. Click on My Profile link
    await page.click('a:has-text("自分のプロフィール")');

    // 4. Verify navigation to My Profile
    await expect(page).toHaveURL(/.*\/me\/profile$/);
    await expect(page.getByText("Me Hub Nav Tester")).toBeVisible();

    console.log("My Profile from Me Hub navigation test completed successfully");
  });
});
