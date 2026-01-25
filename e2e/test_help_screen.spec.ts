import { test, expect } from "@playwright/test";

const API_BASE_URL = "https://quarkus-crud.ouchiserver.aokiapp.com";
const APP_URL = "http://localhost:5173";

test.describe("Help Screen", () => {
  test("Help screen displays usage information and navigation links", async ({
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

    // 2. Navigate to Help screen
    await page.goto(`${APP_URL}/help`);

    // 3. Verify Help screen title and content
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("このアプリでできること")).toBeVisible();
    await expect(page.getByText("基本の流れ")).toBeVisible();

    // 4. Verify basic flow steps are listed
    await expect(
      page.getByText("まず「自分のプロフィール」を作成"),
    ).toBeVisible();
    await expect(
      page.getByText("イベントに参加（招待コード入力）"),
    ).toBeVisible();
    await expect(page.getByText("クイズに回答")).toBeVisible();
    await expect(
      page.getByText("QR を読み取ってプロフィール交換"),
    ).toBeVisible();

    // 5. Verify developer page list toggle button exists
    const devListButton = page.getByText("ページリスト（開発用）を表示");
    await expect(devListButton).toBeVisible();

    // 6. Click to show developer page list
    await devListButton.click();
    await expect(page.getByText("ページリストを隠す")).toBeVisible();
    await expect(page.getByText("通常ページ")).toBeVisible();

    console.log("Help screen test completed successfully");
  });

  test("Help screen can be accessed from Home", async ({ page }) => {
    // 1. Setup Guest User
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Verify Home screen is displayed
    await expect(page.getByText("キミのヒント")).toBeVisible();

    // 3. Click the Help button
    const helpButton = page.getByRole("link", { name: /使い方を見る/ });
    await expect(helpButton).toBeVisible();
    await helpButton.click();

    // 4. Verify navigation to Help screen
    await expect(page).toHaveURL(/.*\/help$/);
    await expect(page.getByText("このアプリでできること")).toBeVisible();

    console.log("Navigation from Home to Help screen verified successfully");
  });
});
