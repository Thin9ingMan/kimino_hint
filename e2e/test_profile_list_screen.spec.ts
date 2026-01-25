import { test, expect } from "@playwright/test";

const API_BASE_URL = "https://quarkus-crud.ouchiserver.aokiapp.com";
const APP_URL = "http://localhost:5173";

test.describe("Profile List Screen", () => {
  test("Empty state shows message and navigation to QR", async ({ page }) => {
    // 1. Setup Guest User with profile but NO friendships
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Profile List Tester",
          hobby: "Testing Profile List",
          favoriteArtist: "List Artist",
        },
      },
    });

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to Profile List
    await page.goto(`${APP_URL}/profiles`);

    // 3. Verify screen title
    await expect(page.getByText("受け取ったプロフィール")).toBeVisible();

    // 4. Verify empty state message
    await expect(
      page.getByText("受け取ったプロフィールがありません"),
    ).toBeVisible();
    await expect(
      page.getByText("QRコードを読み取るとプロフィールが交換され"),
    ).toBeVisible();

    // 5. Verify QR code link button exists
    await expect(page.getByRole("link", { name: "QRコードへ" })).toBeVisible();

    console.log("Profile list empty state test completed successfully");
  });

  test("Profile list shows received friendships", async ({ page }) => {
    // 1. Create User A (will send friendship)
    const userA_res = await page.request.post(
      `${API_BASE_URL}/api/auth/guest`,
    );
    const tokenA = userA_res.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: tokenA },
      data: {
        profileData: {
          displayName: "Sender User",
          hobby: "Sending",
          favoriteArtist: "Sender Artist",
        },
      },
    });

    // Get User A's ID
    const meResA = await page.request.get(`${API_BASE_URL}/api/me`, {
      headers: { Authorization: tokenA },
    });
    const userAData = await meResA.json();
    const userAId = userAData.id;

    // 2. Create User B (will receive friendship)
    const userB_res = await page.request.post(
      `${API_BASE_URL}/api/auth/guest`,
    );
    const tokenB = userB_res.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: tokenB },
      data: {
        profileData: {
          displayName: "Receiver User",
          hobby: "Receiving",
          favoriteArtist: "Receiver Artist",
        },
      },
    });

    // Get User B's ID
    const meResB = await page.request.get(`${API_BASE_URL}/api/me`, {
      headers: { Authorization: tokenB },
    });
    const userBData = await meResB.json();
    const userBId = userBData.id;

    // 3. User A sends friendship to User B
    await page.request.post(
      `${API_BASE_URL}/api/users/${userBId}/friendship`,
      {
        headers: { Authorization: tokenA },
        data: {
          meta: { source: "profile_list_test" },
        },
      },
    );

    // 4. Login as User B
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, tokenB);
    await page.reload();

    // 5. Navigate to Profile List
    await page.goto(`${APP_URL}/profiles`);

    // 6. Verify sender's profile appears in the list
    await expect(page.getByText("Sender User")).toBeVisible({ timeout: 10000 });

    // 7. Click on the sender's profile
    await page.getByText('Sender User').click();

    // 8. Verify navigation to profile detail
    await expect(page).toHaveURL(new RegExp(`.*/profiles/${userAId}$`));

    console.log("Profile list with friendships test completed successfully");
  });

  test("Profile list accessible from Home", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Home Nav Tester",
          hobby: "Navigation",
          favoriteArtist: "Nav Artist",
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

    // 3. Click on profiles button (labeled as "みんなのプロフィール")
    await page.getByRole("link", { name: "みんなのプロフィール" }).click();

    // 4. Verify navigation to Profile List
    await expect(page).toHaveURL(/.*\/profiles$/);
    await expect(page.getByText("受け取ったプロフィール")).toBeVisible();

    console.log("Navigation from Home to Profile List verified successfully");
  });

  test("Profile list back navigation to Me Hub", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Back Nav Tester",
          hobby: "Back Navigation",
          favoriteArtist: "Back Artist",
        },
      },
    });

    // Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 2. Navigate to Profile List
    await page.goto(`${APP_URL}/profiles`);
    await expect(page.getByText("受け取ったプロフィール")).toBeVisible();

    // 3. Click on back to Me Hub button
    await page.getByRole("link", { name: "マイページへ" }).click();

    // 4. Verify navigation to Me Hub
    await expect(page).toHaveURL(/.*\/me$/);
    await expect(page.getByText("マイページ")).toBeVisible();

    console.log("Profile list back navigation test completed successfully");
  });
});
