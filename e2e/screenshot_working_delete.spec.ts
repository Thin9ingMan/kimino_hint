import { test } from '@playwright/test';

test('Screenshot working delete', async ({ page }) => {
  const authRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const token = authRes.headers()['authorization'];
  
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: {
        updateRequest: {
          displayName: "Screenshot User",
          hobby: "Testing",
          favoriteArtist: "E2E"
        }
      }
    });

  await page.goto('http://localhost:5173/');
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, token);
  await page.reload();

  // Create two events
  await page.goto('http://localhost:5173/events/new');
  await page.fill('input[placeholder*="例: "]', 'Event 1');
  await page.click('button:has-text("イベントを作成")');
  await page.waitForTimeout(1000);
  
  await page.goto('http://localhost:5173/events/new');
  await page.fill('input[placeholder*="例: "]', 'Event 2');
  await page.click('button:has-text("イベントを作成")');
  await page.waitForTimeout(1000);
  
  await page.goto('http://localhost:5173/events');
  await page.waitForTimeout(1000);
  
  // Screenshot before delete
  await page.screenshot({ path: '/tmp/before_delete.png', fullPage: true });
  
  // Delete first event
  const deleteButtons = page.getByRole('button', { name: /イベントを削除/ });
  await deleteButtons.first().click();
  await page.waitForTimeout(500);
  
  // Screenshot modal
  await page.screenshot({ path: '/tmp/delete_modal_working.png', fullPage: true });
  
  await page.getByRole('button', { name: /削除する/ }).click();
  await page.waitForTimeout(2000);
  
  // Screenshot after delete
  await page.screenshot({ path: '/tmp/after_delete.png', fullPage: true });
});
