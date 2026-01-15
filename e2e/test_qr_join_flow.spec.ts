import { test, expect } from '@playwright/test';

test('QR code should navigate directly to event lobby after auto-join', async ({ page, context }) => {
  // Setup: Create first user and event
  const authRes1 = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const token1 = authRes1.headers()['authorization'];
  
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
    headers: { 'Authorization': token1 },
    data: {
      updateRequest: {
        displayName: "Event Creator",
        hobby: "Creating Events",
        favoriteArtist: "QR Code"
      }
    }
  });

  // Login as first user
  await page.goto('http://localhost:5173/');
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, token1);
  await page.reload();

  // Create event
  await page.goto('http://localhost:5173/events/new');
  await page.fill('input[placeholder*="例: "]', 'QR Join Test Event');
  await page.click('button:has-text("イベントを作成")');
  
  // Verify we're in the lobby
  await expect(page).toHaveURL(/.*\/events\/\d+/);
  
  // Extract the event URL from QR code
  // The QR code URL should be visible in the text
  const shareUrlText = await page.locator('text=共有URL:').locator('..').locator('text=/https?:\/\/.*/').textContent();
  expect(shareUrlText).toBeTruthy();
  
  console.log('QR URL:', shareUrlText);
  
  // Extract invitation code by extracting from the page
  const invitationCodeElement = await page.locator('text=招待コード').locator('..').locator('text=/[A-Z0-9-]+/').first();
  const invitationCode = await invitationCodeElement.textContent();
  
  expect(invitationCode).toBeTruthy();
  console.log('Invitation Code:', invitationCode);
  
  // Now simulate second user scanning the QR code
  // Create a new page context for second user
  const page2 = await context.newPage();
  
  // Setup second user
  const authRes2 = await page2.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const token2 = authRes2.headers()['authorization'];
  
  await page2.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
    headers: { 'Authorization': token2 },
    data: {
      updateRequest: {
        displayName: "QR Scanner",
        hobby: "Scanning QR Codes",
        favoriteArtist: "Camera App"
      }
    }
  });

  // Login as second user
  await page2.goto('http://localhost:5173/');
  await page2.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, token2);
  await page2.reload();

  // Navigate to the QR URL (simulating QR code scan)
  await page2.goto(shareUrlText!);
  
  // Expected behavior: Should auto-join and navigate to event lobby
  // Wait for navigation to complete
  await page2.waitForURL(/.*\/events\/\d+/, { timeout: 10000 });
  
  // Verify we're in the event lobby (not the join page)
  expect(page2.url()).toMatch(/\/events\/\d+$/);
  expect(page2.url()).not.toContain('/join');
  
  // Verify the event information is displayed
  await expect(page2.getByText('イベント情報')).toBeVisible({ timeout: 10000 });
  await expect(page2.getByText('QR Join Test Event')).toBeVisible();
  
  // Verify we can see attendees (should include both users)
  await expect(page2.getByText('参加者')).toBeVisible();
  
  console.log('✓ QR code successfully navigated to event lobby without manual code entry');
  
  await page2.close();
});
