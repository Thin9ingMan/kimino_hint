import { test, expect } from "@playwright/test";

test("Verify Event Lobby QR and Invitation Code", async ({ page }) => {
  // 1. Setup Guest
  const authRes = await page.request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
  );
  const token = authRes.headers()["authorization"];

  await page.request.put(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
    {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "QR Tester",
          hobby: "Scanning",
          favoriteArtist: "QR",
        },
      },
    },
  );

  // Login
  await page.goto("http://localhost:5173/");
  await page.evaluate((t) => {
    localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
  }, token);
  await page.reload();

  // 2. Create Event
  await page.goto("http://localhost:5173/events/new");
  await page.fill('input[placeholder*="例: "]', "QR Event");
  await page.click('button:has-text("イベントを作成")');

  // 3. Verify Invitation Panel in Lobby
  await expect(page).toHaveURL(/.*\/events\/\d+/);
  await page.waitForSelector("text=招待", { timeout: 15000 });

  // Check Invitation Code is visible (it matches mapped uppercase format usually, e.g. "QUIZ-...")
  // The API generates a random code, so we just check for presence of the panel elements.

  await expect(page.getByText("招待コード")).toBeVisible();

  // Check Copy Button
  await expect(page.getByRole("button", { name: /コピー/ })).toBeVisible();

  // Check QR Code
  // react-qr-code renders an SVG inside a box
  await expect(
    page
      .locator("svg")
      .filter({ has: page.locator("rect") })
      .first(),
  ).toBeVisible();
  await expect(page.getByText("参加用QRコード")).toBeVisible();

  console.log("QR Code and Invitation Panel verified successfully");
});
