import { test, expect } from '@playwright/test';

test('Navigate from Home to Create Event', async ({ page }) => {
  // 1. Setup Guest
  const authRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const token = authRes.headers()['authorization'];
  
  // Set Profile (Required for Home buttons to be active)
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: {
        updateRequest: {
          displayName: "E2E User",
          hobby: "Testing",
          favoriteArtist: "PW"
        }
      }
    });

  // Login
  await page.goto('http://localhost:5173/');
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, token);
  
  // Reload to apply auth
  await page.reload();
  await expect(page.getByText('キミのヒント')).toBeVisible();

  // 2. Click "Events" button on Home
  // It was previously "クイズへ" but now updated to "イベントへ"
  const eventButton = page.getByRole('link', { name: /イベントへ|クイズへ/ });
  await expect(eventButton).toBeEnabled();
  await eventButton.click();

  // 3. Verify we are on Events Hub
  await expect(page).toHaveURL(/.*\/events$/);
  await expect(page.getByText('イベントを作成')).toBeVisible();

  // 4. Click Create Event
  await page.click('text=イベントを作成');

  // 5. Verify Create Event Screen
  await expect(page).toHaveURL(/.*\/events\/new/);
  await expect(page.getByRole('heading', { name: '新規イベント作成' })).toBeVisible();
  
  // Check form elements exist
  await expect(page.getByLabel('イベント名')).toBeVisible();
  await expect(page.getByRole('button', { name: 'イベントを作成' })).toBeVisible();

  console.log('Navigation from Home to Create Event verified successfully');
});
