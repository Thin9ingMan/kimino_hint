import { test, expect } from "@playwright/test";

test("Verify Event Persistence (Create -> Home -> Re-enter)", async ({
  page,
}) => {
  // 1. Setup Guest and Profile
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
          displayName: "Persistence Tester",
          hobby: "Persistence",
          favoriteArtist: "PM2",
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

  // 2. Create Event via UI
  await page.goto("http://localhost:5173/events/new");
  await page.fill('input[placeholder*="例: "]', "Persistent Event"); // Name input
  await page.click('button:has-text("イベントを作成")');

  // Verify redirected to Lobby
  await expect(page).toHaveURL(/.*\/events\/\d+/);
  await expect(
    page.getByText("Persistent Event", { exact: false }),
  ).toBeVisible(); // Might be in title or body

  // Capture Event ID from URL
  const eventUrl = page.url();
  const eventId = eventUrl.split("/").pop();
  console.log("Created Event ID:", eventId);

  // 3. Navigate Home (simulate closing/leaving)
  await page.click("text=イベント一覧へ"); // Lobby has a button to go back to list
  // Or goto home directly
  // await page.goto('http://localhost:5173/home');

  // Verify we are at Events Hub or Home
  await expect(page).toHaveURL(/.*\/events$/);

  // 4. Verify Event is Listed in "Created Events"
  // Needs reload to be sure if using client-side cache, but SPA should handle it.
  // We added a "Created Events" list in EventsHubScreen
  await expect(page.getByText("作成したイベント")).toBeVisible();

  // Find the specific event card
  const eventLink = page
    .getByRole("link", { name: "Persistent Event" })
    .first();
  await expect(eventLink).toBeVisible();

  // 5. Re-enter Event
  await eventLink.click();

  // Verify back in Lobby
  await expect(page).toHaveURL(new RegExp(`.*/events/${eventId}`));
  await expect(
    page.getByText("Persistent Event", { exact: false }).first(),
  ).toBeVisible();

  console.log("Event persistence verified successfully");
});
