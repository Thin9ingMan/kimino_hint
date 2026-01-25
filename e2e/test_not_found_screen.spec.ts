import { test, expect } from "@playwright/test";

const API_BASE_URL = "https://quarkus-crud.ouchiserver.aokiapp.com";
const APP_URL = "http://localhost:5173";

test.describe("Not Found Screen", () => {
  test("404 page displays for non-existent routes", async ({ page }) => {
    // 1. Setup Guest User
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to a non-existent route
    await page.goto(`${APP_URL}/this-page-does-not-exist`);

    // 3. Verify 404 page is displayed
    await expect(page.getByText("404 Not Found")).toBeVisible();
    await expect(
      page.getByText("ページが見つかりませんでした"),
    ).toBeVisible();

    // 4. Verify the attempted path is shown
    await expect(page.getByText("/this-page-does-not-exist")).toBeVisible();

    // 5. Verify navigation buttons exist
    await expect(page.getByRole("link", { name: "ホームへ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "使い方" })).toBeVisible();

    console.log("404 page display test completed successfully");
  });

  test("404 page Home button navigates correctly", async ({ page }) => {
    // 1. Setup Guest User
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to a non-existent route
    await page.goto(`${APP_URL}/random-invalid-path-123`);

    // 3. Verify 404 page is displayed
    await expect(page.getByText("404 Not Found")).toBeVisible();

    // 4. Click Home button
    await page.click('a:has-text("ホームへ")');

    // 5. Verify navigation to Home
    await expect(page).toHaveURL(/.*\/home$/);
    await expect(page.getByText("キミのヒント")).toBeVisible();

    console.log("404 Home navigation test completed successfully");
  });

  test("404 page Help button navigates correctly", async ({ page }) => {
    // 1. Setup Guest User
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to a non-existent route
    await page.goto(`${APP_URL}/another-invalid-path`);

    // 3. Verify 404 page is displayed
    await expect(page.getByText("404 Not Found")).toBeVisible();

    // 4. Click Help button
    await page.click('a:has-text("使い方")');

    // 5. Verify navigation to Help
    await expect(page).toHaveURL(/.*\/help$/);
    await expect(page.getByText("このアプリでできること")).toBeVisible();

    console.log("404 Help navigation test completed successfully");
  });

  test("404 page for deeply nested non-existent route", async ({ page }) => {
    // 1. Setup Guest User
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to a deeply nested non-existent route
    const deepPath = "/some/deeply/nested/invalid/path";
    await page.goto(`${APP_URL}${deepPath}`);

    // 3. Verify 404 page is displayed
    await expect(page.getByText("404 Not Found")).toBeVisible();
    await expect(page.getByText(deepPath)).toBeVisible();

    console.log("404 page for deeply nested route test completed successfully");
  });
});
