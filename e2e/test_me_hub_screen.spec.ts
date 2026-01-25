import { test, expect } from "@playwright/test";

const API_BASE_URL = "https://quarkus-crud.ouchiserver.aokiapp.com";
const APP_URL = "http://localhost:5173";

test.describe("Me Hub Screen", () => {
  test("Me Hub displays navigation to profile sections", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Me Hub Tester",
          hobby: "Testing MeHub",
          favoriteArtist: "Test Artist",
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

    // 3. Verify Me Hub screen title
    await expect(page.getByText("マイページ")).toBeVisible();
    await expect(
      page.getByText("自分の情報やイベント関連へのショートカットです。"),
    ).toBeVisible();

    // 4. Verify navigation buttons exist
    await expect(
      page.getByRole("link", { name: "自分のプロフィール" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "プロフィールを編集" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "受け取ったプロフィール一覧" }),
    ).toBeVisible();

    console.log("Me Hub screen test completed successfully");
  });

  test("Me Hub navigation to My Profile works", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Navigation Tester",
          hobby: "Navigation",
          favoriteArtist: "Test",
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

    // 3. Click on My Profile button
    await page.getByRole("link", { name: "自分のプロフィール" }).click();

    // 4. Verify navigation to My Profile screen
    await expect(page).toHaveURL(/.*\/me\/profile$/);

    console.log("Me Hub navigation to My Profile verified successfully");
  });

  test("Me Hub navigation to Edit Profile works", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Edit Nav Tester",
          hobby: "Editing",
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

    // 2. Navigate to Me Hub
    await page.goto(`${APP_URL}/me`);

    // 3. Click on Edit Profile button
    await page.getByRole("link", { name: "プロフィールを編集" }).click();

    // 4. Verify navigation to Edit Profile screen
    await expect(page).toHaveURL(/.*\/me\/profile\/edit$/);
    await expect(page.getByText("プロフィール編集")).toBeVisible();

    console.log("Me Hub navigation to Edit Profile verified successfully");
  });

  test("Me Hub accessible from Home screen", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Home Nav Tester",
          hobby: "Home Navigation",
          favoriteArtist: "Home Artist",
        },
      },
    });

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Verify Home screen is displayed
    await expect(page.getByText("キミのヒント")).toBeVisible();

    // 3. Click on My Page button
    await page.getByRole("link", { name: "マイページ" }).click();

    // 4. Verify navigation to Me Hub
    await expect(page).toHaveURL(/.*\/me$/);
    await expect(page.getByText("マイページ")).toBeVisible();

    console.log("Navigation from Home to Me Hub verified successfully");
  });
});
