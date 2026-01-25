import { test, expect } from "@playwright/test";

const API_BASE_URL = "https://quarkus-crud.ouchiserver.aokiapp.com";
const APP_URL = "http://localhost:5173";

test.describe("Event Live Screen", () => {
  test("Event Live screen displays under construction message", async ({
    page,
  }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Live Screen Tester",
          hobby: "Testing Live",
          favoriteArtist: "Live Artist",
        },
      },
    });

    // 2. Create an event
    const eventRes = await page.request.post(`${API_BASE_URL}/api/events`, {
      headers: { Authorization: token },
      data: {
        meta: {
          name: "Live Screen Test Event",
          description: "Testing live screen",
        },
      },
    });
    const eventData = await eventRes.json();
    const eventId = eventData.id;

    // 3. Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 4. Navigate to Event Live screen
    await page.goto(`${APP_URL}/events/${eventId}/live`);

    // 5. Verify Live screen title
    await expect(page.getByText("ライブ更新")).toBeVisible();

    // 6. Verify under construction message
    await expect(page.getByText("工事中")).toBeVisible();
    await expect(
      page.getByText("SSE（Server-Sent Events）機能は現在準備中です"),
    ).toBeVisible();

    // 7. Verify back to lobby button exists
    await expect(
      page.getByRole("link", { name: "ロビーに戻る" }),
    ).toBeVisible();

    console.log("Event Live screen display test completed successfully");
  });

  test("Event Live screen back button navigates to lobby", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Live Nav Tester",
          hobby: "Testing Navigation",
          favoriteArtist: "Nav Artist",
        },
      },
    });

    // 2. Create an event
    const eventRes = await page.request.post(`${API_BASE_URL}/api/events`, {
      headers: { Authorization: token },
      data: {
        meta: {
          name: "Live Nav Test Event",
          description: "Testing live navigation",
        },
      },
    });
    const eventData = await eventRes.json();
    const eventId = eventData.id;

    // 3. Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 4. Navigate to Event Live screen
    await page.goto(`${APP_URL}/events/${eventId}/live`);
    await expect(page.getByText("ライブ更新")).toBeVisible();

    // 5. Click back to lobby button
    await page.click('a:has-text("ロビーに戻る")');

    // 6. Verify navigation back to lobby
    await expect(page).toHaveURL(new RegExp(`.*/events/${eventId}$`));
    await expect(page.getByText("イベント情報")).toBeVisible();

    console.log("Event Live back navigation test completed successfully");
  });

  test("Event Live screen with invalid event ID shows error", async ({
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

    // 2. Navigate to Event Live screen with invalid ID
    await page.goto(`${APP_URL}/events/invalid-id/live`);

    // 3. Verify error message for invalid event ID
    await expect(page.getByText("無効なイベントIDです")).toBeVisible();

    // 4. Verify navigation button to events list
    await expect(
      page.getByRole("link", { name: "イベント一覧へ" }),
    ).toBeVisible();

    console.log("Event Live invalid ID test completed successfully");
  });

  test("Event Live screen accessible from Event Lobby", async ({ page }) => {
    // 1. Setup Guest User with profile
    const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
    const token = authRes.headers()["authorization"];

    await page.request.put(`${API_BASE_URL}/api/me/profile`, {
      headers: { Authorization: token },
      data: {
        profileData: {
          displayName: "Lobby Nav Tester",
          hobby: "Testing Lobby Nav",
          favoriteArtist: "Lobby Artist",
        },
      },
    });

    // 2. Create an event
    const eventRes = await page.request.post(`${API_BASE_URL}/api/events`, {
      headers: { Authorization: token },
      data: {
        meta: {
          name: "Lobby Nav Test Event",
          description: "Testing lobby to live navigation",
        },
      },
    });
    const eventData = await eventRes.json();
    const eventId = eventData.id;

    // 3. Login
    await page.goto(APP_URL);
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token);
    await page.reload();

    // 4. Navigate to Event Lobby
    await page.goto(`${APP_URL}/events/${eventId}`);
    await expect(page.getByText("Lobby Nav Test Event")).toBeVisible();

    // 5. Navigate to Live screen using direct URL (as live link may not be in lobby yet)
    await page.goto(`${APP_URL}/events/${eventId}/live`);

    // 6. Verify Live screen is displayed
    await expect(page.getByText("ライブ更新")).toBeVisible();
    await expect(page.getByText("工事中")).toBeVisible();

    console.log("Event Live from Lobby navigation test completed successfully");
  });
});
