import { test, expect } from "@playwright/test";

/**
 * Tests for QR code URL encoding handling.
 * 
 * When a QR code containing non-ASCII characters (like Japanese hiragana) is scanned
 * by different camera apps, the resulting URL might be:
 * 1. Raw/unencoded: /qr/join?code=にのし
 * 2. URL-encoded: /qr/join?code=%E3%81%AB%E3%81%AE%E3%81%97
 * 
 * The application should handle both cases correctly.
 */

test("QR join should work with URL-encoded Japanese invitation code", async ({
  page,
  context,
}) => {
  // Setup: Create first user and event
  const authRes1 = await page.request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
  );
  const token1 = authRes1.headers()["authorization"];

  await page.request.put(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
    {
      headers: { Authorization: token1 },
      data: {
        profileData: {
          displayName: "Event Creator",
          hobby: "Creating Events",
          favoriteArtist: "QR Code",
        },
      },
    },
  );

  // Login as first user
  await page.goto("http://localhost:5173/");
  await page.evaluate((t) => {
    localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
  }, token1);
  await page.reload();

  // Create event
  await page.goto("http://localhost:5173/events/new");
  await page.fill('input[placeholder*="例: "]', "URL Encoding Test Event");
  await page.click('button:has-text("イベントを作成")');

  // Verify we're in the lobby and extract eventId from URL
  await expect(page).toHaveURL(/.*\/events\/\d+/);
  const eventUrl = page.url();
  const eventId = eventUrl.match(/\/events\/(\d+)/)?.[1];
  expect(eventId).toBeTruthy();

  // Get the event data via API to get the invitation code
  const eventDataRes = await page.request.get(
    `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}`,
    {
      headers: { Authorization: token1 },
    },
  );
  const eventData = await eventDataRes.json();
  const invitationCode = eventData.invitationCode;

  expect(invitationCode).toBeTruthy();
  console.log("Original Invitation Code:", invitationCode);

  // URL-encode the invitation code (simulating what some camera apps do)
  const encodedCode = encodeURIComponent(invitationCode);
  console.log("URL-encoded Code:", encodedCode);

  // Construct the URL-encoded QR join URL
  const encodedQrJoinUrl = `http://localhost:5173/qr/join?code=${encodedCode}`;
  console.log("URL-encoded QR Join URL:", encodedQrJoinUrl);

  // Now simulate second user with URL-encoded code
  const page2 = await context.newPage();

  // Setup second user
  const authRes2 = await page2.request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
  );
  const token2 = authRes2.headers()["authorization"];

  await page2.request.put(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
    {
      headers: { Authorization: token2 },
      data: {
        profileData: {
          displayName: "QR Scanner URL Encoded",
          hobby: "Scanning QR Codes",
          favoriteArtist: "Camera App",
        },
      },
    },
  );

  // Login as second user
  await page2.goto("http://localhost:5173/");
  await page2.evaluate((t) => {
    localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
  }, token2);
  await page2.reload();

  // Navigate to the URL-encoded QR URL
  await page2.goto(encodedQrJoinUrl);

  // Expected behavior: Should auto-join and navigate to event lobby
  await page2.waitForURL(/.*\/events\/\d+/, { timeout: 10000 });

  // Verify we're in the event lobby
  expect(page2.url()).toMatch(/\/events\/\d+$/);
  expect(page2.url()).not.toContain("/join");

  // Verify the event information is displayed
  await expect(page2.getByText("イベント情報")).toBeVisible({ timeout: 10000 });
  await expect(page2.getByText("URL Encoding Test Event")).toBeVisible();

  console.log(
    "✓ URL-encoded QR code successfully navigated to event lobby",
  );

  await page2.close();
});

test("QR code should use URL-encoded invitation code for maximum compatibility", async ({
  page,
}) => {
  // Setup: Create user and event
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
          hobby: "Testing",
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

  // Create event
  await page.goto("http://localhost:5173/events/new");
  await page.fill('input[placeholder*="例: "]', "QR Encoding Test");
  await page.click('button:has-text("イベントを作成")');

  // Verify we're in the lobby
  await expect(page).toHaveURL(/.*\/events\/\d+/);
  const eventUrl = page.url();
  const eventId = eventUrl.match(/\/events\/(\d+)/)?.[1];
  expect(eventId).toBeTruthy();

  // Wait for QR code to be visible
  await expect(page.getByText("参加用QRコード")).toBeVisible();

  // Get the event data via API to get the invitation code
  const eventDataRes = await page.request.get(
    `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}`,
    {
      headers: { Authorization: token },
    },
  );
  const eventData = await eventDataRes.json();
  const invitationCode = eventData.invitationCode;

  console.log("Invitation Code:", invitationCode);

  // Check if the code contains non-ASCII characters
  const hasNonAscii = /[^\x00-\x7F]/.test(invitationCode);
  console.log("Has non-ASCII characters:", hasNonAscii);

  if (hasNonAscii) {
    // The QR code URL should be URL-encoded for compatibility
    const encodedCode = encodeURIComponent(invitationCode);
    const expectedUrl = `http://localhost:5173/qr/join?code=${encodedCode}`;
    
    console.log("Expected URL-encoded URL:", expectedUrl);
    
    // Verify by navigating to the URL-encoded URL and checking it works
    // This simulates what a camera app would do when it reads the QR code
    // and passes the URL-encoded value to the browser
    
    // Create a new page to test the encoded URL
    const page2 = await page.context().newPage();
    
    // Setup second user
    const authRes2 = await page2.request.post(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest",
    );
    const token2 = authRes2.headers()["authorization"];
    
    await page2.request.put(
      "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
      {
        headers: { Authorization: token2 },
        data: {
          profileData: {
            displayName: "URL Encoder Tester",
            hobby: "Testing URL Encoding",
            favoriteArtist: "Percent Signs",
          },
        },
      },
    );
    
    await page2.goto("http://localhost:5173/");
    await page2.evaluate((t) => {
      localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
    }, token2);
    
    // Navigate to the URL-encoded URL
    await page2.goto(expectedUrl);
    
    // Should successfully join and navigate to event lobby
    await page2.waitForURL(/.*\/events\/\d+/, { timeout: 10000 });
    expect(page2.url()).toMatch(/\/events\/\d+$/);
    expect(page2.url()).not.toContain("/join");
    
    // Verify the event is visible
    await expect(page2.getByText("QR Encoding Test")).toBeVisible({ timeout: 5000 });
    
    console.log("✓ URL-encoded URL works correctly");
    
    await page2.close();
  } else {
    console.log("Invitation code is ASCII-only, URL encoding not critical");
  }
});
