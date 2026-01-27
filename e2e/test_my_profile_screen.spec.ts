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

    // 4. Verify profile data is displayed (use .first() for text that appears multiple times)
    await expect(page.getByRole("heading", { name: "Profile Card Tester" })).toBeVisible();
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

    // 3. Click share button to open modal (use the first one in the profile card actions)
    await page.getByRole("button", { name: "共有する" }).first().click();

    // 4. Verify modal is displayed
    await expect(page.getByText("プロフィール交換QR")).toBeVisible();
    await expect(
      page.getByText("このQRを相手に読み取ってもらうと"),
    ).toBeVisible();

    // 5. Verify QR code image exists
    await expect(
      page.locator('img[alt="プロフィール交換QR"]'),
    ).toBeVisible();

    // 6. Verify action buttons in modal (scope to the modal using getByLabel)
    const modal = page.getByLabel("プロフィール交換QR");
    await expect(
      modal.getByRole("button", { name: "URLをコピー" }),
    ).toBeVisible();
    await expect(
      modal.getByRole("link", { name: "公開プロフィールを開く" }),
    ).toBeVisible();
    await expect(modal.getByRole("button", { name: "共有する" })).toBeVisible();
    await expect(modal.getByRole("button", { name: "閉じる" })).toBeVisible();

    // 7. Close the modal
    await modal.getByRole("button", { name: "閉じる" }).click();
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
    await page.getByRole("button", { name: "編集する" }).click();

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

    // 2. Navigate to My Profile - on 404, the component shows a redirect alert then redirects
    await page.goto(`${APP_URL}/me/profile`);

    // 3. Wait for redirect to happen (the ErrorBoundary redirects to /me/profile/edit after 800ms)
    // Or the empty profile state shows "プロフィールを作成する" button
    await page.waitForTimeout(2000);

    // The user should either:
    // - Be redirected to /me/profile/edit (if 404)
    // - See the "プロフィールを作成する" button (if empty profile state)
    // - See the redirect alert "プロフィールを作りましょう"
    const wasRedirected = page.url().includes("/me/profile/edit");
    const hasCreateButton = await page
      .getByRole("button", { name: "プロフィールを作成する" })
      .isVisible()
      .catch(() => false);
    const hasRedirectAlert = await page
      .getByText("プロフィールを作りましょう")
      .isVisible()
      .catch(() => false);
    const hasNowCreateButton = await page
      .getByRole("button", { name: "今すぐ作成する" })
      .isVisible()
      .catch(() => false);

    expect(
      wasRedirected || hasCreateButton || hasRedirectAlert || hasNowCreateButton,
    ).toBeTruthy();

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
    await page.getByRole("link", { name: "自分のプロフィール" }).click();

    // 4. Verify navigation to My Profile
    await expect(page).toHaveURL(/.*\/me\/profile$/);
    // Verify user's name is displayed (use heading selector to be specific)
    await expect(page.getByRole("heading", { name: "Me Hub Nav Tester" })).toBeVisible();

    console.log("My Profile from Me Hub navigation test completed successfully");
  });
});
