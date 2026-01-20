import { test, expect } from '@playwright/test';

test('Edit Event Name and Description from Lobby', async ({ page }) => {
  // 1. Setup Guest and Profile
  const authRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const token = authRes.headers()['authorization'];
  
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: {
        updateRequest: {
          displayName: "Edit Tester",
          hobby: "Testing",
          favoriteArtist: "E2E"
        }
      }
    });

  // Login
  await page.goto('http://localhost:5173/');
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, token);
  await page.reload();

  // 2. Create Event
  await page.goto('http://localhost:5173/events/new');
  await page.fill('input[placeholder*="例: "]', 'Original Event Name');
  await page.fill('textarea[placeholder*="イベントの詳細"]', 'Original description');
  await page.click('button:has-text("イベントを作成")');
  
  // Verify redirected to Lobby
  await expect(page).toHaveURL(/.*\/events\/\d+/);
  await expect(page.getByText('Original Event Name', { exact: false })).toBeVisible();
  await expect(page.getByText('Original description', { exact: false })).toBeVisible();

  // Screenshot 1: Event lobby with edit button
  await page.screenshot({ path: '/tmp/event_lobby_with_edit_button.png', fullPage: true });

  // 3. Click Edit button (this should exist per the requirement)
  const editButton = page.getByRole('button', { name: /編集|イベント情報を編集/ });
  await expect(editButton).toBeVisible();
  await editButton.click();

  // Screenshot 2: Edit modal opened
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/event_edit_modal.png', fullPage: true });

  // 4. Edit the event name and description
  const nameInput = page.getByLabel(/イベント名|名前/);
  await expect(nameInput).toBeVisible();
  await nameInput.fill('Updated Event Name');
  
  const descInput = page.getByLabel(/説明|description/i);
  await expect(descInput).toBeVisible();
  await descInput.fill('Updated description');

  // Screenshot 3: Modal with edited values
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/event_edit_modal_filled.png', fullPage: true });

  // 5. Save changes
  const saveButton = page.getByRole('button', { name: /保存|更新/ });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Wait for modal to close
  await page.waitForTimeout(1000);

  // 6. Verify changes are reflected
  await expect(page.getByText('Updated Event Name', { exact: false }).first()).toBeVisible();
  
  // Check description is visible in the event info section (not in modal)
  const eventInfoSection = page.locator('div').filter({ hasText: 'イベント情報' }).first();
  await expect(eventInfoSection.getByText('Updated description')).toBeVisible();

  // Screenshot 4: Updated event lobby
  await page.screenshot({ path: '/tmp/event_lobby_updated.png', fullPage: true });

  // 7. Reload page to verify persistence
  await page.reload();
  await expect(page.getByText('Updated Event Name', { exact: false }).first()).toBeVisible();
  await expect(eventInfoSection.getByText('Updated description')).toBeVisible();

  console.log('Event editing verified successfully');
  console.log('Screenshots saved to /tmp/');
});
