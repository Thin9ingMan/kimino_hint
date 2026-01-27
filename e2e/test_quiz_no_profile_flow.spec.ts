import { test, expect } from "@playwright/test";

test.describe("Quiz Without Profile Flow", () => {
  test("User without profile sees profile creation prompt with returnTo parameter", async ({
    page,
    request,
  }) => {
    test.setTimeout(60000);

    // --- Setup: Create Event via API with User A (Host) ---

    // User A: Event Creator (Complete setup)
    const userA_res = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const tokenA = userA_res.headers()["authorization"];

    // Set Profile A
    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: tokenA },
        data: {
          profileData: {
            displayName: "Host User",
            hobby: "Hosting",
            favoriteArtist: "HostArtist",
            faculty: "情報学部",
            grade: "3年",
          },
        },
      },
    );

    const createEventRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
      {
        headers: { Authorization: tokenA },
        data: {
          meta: {
            name: "Profile Test Event",
            description: "Testing profile flow",
          },
        },
      },
    );

    if (!createEventRes.ok()) {
      console.error(
        `Failed to create event: ${createEventRes.status()} ${await createEventRes.text()}`,
      );
      throw new Error("Failed to create event");
    }

    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;

    if (!eventId || !invitationCode) {
      throw new Error(
        `Event data missing: ID=${eventId}, Code=${invitationCode}`,
      );
    }

    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}`);

    // Join User A
    await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code",
      {
        headers: { Authorization: tokenA },
        data: { invitationCode },
      },
    );

    // --- User B: Guest WITHOUT profile ---
    const userB_res = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const tokenB = userB_res.headers()["authorization"];

    // User B joins the event (without profile)
    await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code",
      {
        headers: { Authorization: tokenB },
        data: { invitationCode },
      },
    );

    // --- Navigate as User B (no profile) directly to quiz edit page ---
    await page.goto("http://localhost:5173/");
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, tokenB);
    await page.reload();

    // Navigate directly to quiz edit screen
    await page.goto(`http://localhost:5173/events/${eventId}/quiz/edit`);

    // Wait for page to load
    await expect(page.locator("text=クイズ編集")).toBeVisible({
      timeout: 15000,
    });

    // Should see the "profile not created" alert (not an error)
    await expect(
      page.locator("text=プロフィールが作成されていません"),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator(
        "text=クイズを作成するには、まずプロフィールを作成する必要があります",
      ),
    ).toBeVisible({ timeout: 10000 });

    console.log("✓ Profile not created message is displayed correctly");

    // Should see the "Create Profile" button
    const createProfileButton = page.getByRole("button", {
      name: "プロフィールを作成",
    });
    await expect(createProfileButton).toBeVisible({ timeout: 10000 });

    // Should also see the "Return to Lobby" button
    const returnToLobbyButton = page.getByRole("button", {
      name: "ロビーへ戻る",
    });
    await expect(returnToLobbyButton).toBeVisible({ timeout: 10000 });

    console.log("✓ Create Profile and Return to Lobby buttons are visible");

    // Click the create profile button
    await createProfileButton.click();

    // Wait for navigation to profile edit page with returnTo parameter
    await page.waitForURL(/\/me\/profile\/edit\?returnTo=/, { timeout: 15000 });

    // Verify the returnTo parameter contains the quiz edit URL
    const currentUrl = page.url();
    expect(currentUrl).toContain(
      encodeURIComponent(`/events/${eventId}/quiz/edit`),
    );

    console.log("✓ Navigated to profile edit with correct returnTo parameter");
  });

  test("After profile creation, user is redirected to quiz edit page", async ({
    page,
    request,
  }) => {
    test.setTimeout(60000);

    // --- Setup: Create Event via API with User A (Host) ---
    const userA_res = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const tokenA = userA_res.headers()["authorization"];

    // Set Profile A
    await request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: tokenA },
        data: {
          profileData: {
            displayName: "Host User",
            hobby: "Hosting",
            favoriteArtist: "HostArtist",
            faculty: "情報学部",
            grade: "3年",
          },
        },
      },
    );

    // Create Event
    const createEventRes = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
      {
        headers: { Authorization: tokenA },
        data: {
          meta: {
            name: "Profile Test Event 2",
            description: "Testing returnTo flow",
          },
        },
      },
    );
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;

    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}`);

    // Join User A
    await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code",
      {
        headers: { Authorization: tokenA },
        data: { invitationCode },
      },
    );

    // --- User B: Create guest but DON'T create profile initially ---
    const userB_res = await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const tokenB = userB_res.headers()["authorization"];

    // User B joins the event (without profile)
    await request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code",
      {
        headers: { Authorization: tokenB },
        data: { invitationCode },
      },
    );

    // --- Navigate as User B directly to profile edit with returnTo parameter ---
    await page.goto("http://localhost:5173/");
    await page.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, tokenB);
    await page.reload();

    // Navigate directly to profile edit with returnTo parameter
    const returnTo = `/events/${eventId}/quiz/edit`;
    await page.goto(
      `http://localhost:5173/me/profile/edit?returnTo=${encodeURIComponent(returnTo)}`,
    );

    // Wait for page to load
    await page.waitForSelector("text=プロフィール編集", { timeout: 10000 });

    // Fill in the profile form
    await page.fill('input[placeholder="名前"]', "Guest User B");

    // Select faculty from dropdown
    await page.click('label:has-text("学部") + div input');
    await page.click('div[role="option"]:has-text("情報学部")');

    // Select grade from dropdown
    await page.click('label:has-text("学年") + div input');
    await page.click('div[role="option"]:has-text("2年")');

    // Fill other required fields
    await page.fill('input[placeholder="趣味"]', "Gaming");
    await page.fill('input[placeholder="好きなアーティスト"]', "Game Music");

    console.log("✓ Filled profile form");

    // Save profile
    await page.click('button[type="submit"]:has-text("保存")');

    // Should redirect back to quiz edit page
    await page.waitForURL(`**/events/${eventId}/quiz/edit`, { timeout: 20000 });

    // RELOAD to ensure React Query cache is cleared and fresh profile is picked up
    await page.reload();

    console.log("✓ Redirected back to quiz edit page after profile creation");

    // Now should see the quiz editor, not the profile prompt
    await expect(
      page.locator("text=プロフィールが作成されていません"),
    ).not.toBeVisible({ timeout: 15000 });

    // Should see the quiz editor title
    await expect(page.locator("text=クイズエディタ")).toBeVisible({
      timeout: 20000,
    });

    console.log("✓ Quiz editor is now accessible after profile creation");
  });
});
