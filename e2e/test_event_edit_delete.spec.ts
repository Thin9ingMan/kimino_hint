import { test, expect } from '@playwright/test';

test('Edit Event Name and Description from Lobby', async ({ page }) => {
  // 1. Setup Guest and Profile
  const authRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const token = authRes.headers()['authorization'];
  
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: {
        profileData: {
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
  const saveButton = page.getByRole('button', { name: '保存' });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Wait for modal to close
  await page.waitForTimeout(1000);

  // 6. Verify changes are reflected
  await expect(page.getByText('Updated Event Name', { exact: false }).first()).toBeVisible();
  
  // Check description is visible in the event info section (not in modal)
  let eventInfoSection = page.locator('div').filter({ hasText: 'イベント情報' }).first();
  await expect(eventInfoSection.getByText('Updated description')).toBeVisible();

  // Screenshot 4: Updated event lobby
  await page.screenshot({ path: '/tmp/event_lobby_updated.png', fullPage: true });

  // 7. Reload page to verify persistence
  await page.reload();
  await expect(page.getByText('Updated Event Name', { exact: false }).first()).toBeVisible();
  
  // Re-locate event info section after reload to avoid stale element
  eventInfoSection = page.locator('div').filter({ hasText: 'イベント情報' }).first();
  await expect(eventInfoSection.getByText('Updated description')).toBeVisible();

  console.log('Event editing verified successfully');
  console.log('Screenshots saved to /tmp/');
});

test('Delete Event from Events Hub', async ({ page }) => {
  // 1. Setup Guest and Profile
  const authRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const token = authRes.headers()['authorization'];
  
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: {
        profileData: {
          displayName: "Delete Tester",
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
  await page.fill('input[placeholder*="例: "]', 'Event to Delete');
  await page.fill('textarea[placeholder*="イベントの詳細"]', 'This event will be deleted');
  await page.click('button:has-text("イベントを作成")');
  
  // Verify event created
  await expect(page).toHaveURL(/.*\/events\/\d+/);
  await expect(page.getByText('Event to Delete')).toBeVisible();

  // 3. Go back to Events Hub
  await page.goto('http://localhost:5173/events');
  await expect(page.getByText('作成したイベント')).toBeVisible();
  
  // Screenshot 1: Events hub with delete button
  await page.screenshot({ path: '/tmp/events_hub_with_delete_button.png', fullPage: true });
  
  // 4. Find the event and delete button
  const eventCard = page.locator('div').filter({ hasText: 'Event to Delete' }).first();
  await expect(eventCard).toBeVisible();
  
  // Look for delete button (trash icon)
  const deleteButton = page.getByRole('button', { name: /イベントを削除/ }).first();
  await expect(deleteButton).toBeVisible();
  
  // 5. Click delete button
  await deleteButton.click();
  
  // Screenshot 2: Delete confirmation modal
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/delete_confirmation_modal.png', fullPage: true });
  
  // 6. Confirm deletion
  const confirmButton = page.getByRole('button', { name: /削除する/ });
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();
  
  // Wait for deletion to complete and reload to ensure fresh data
  await page.waitForTimeout(2000);
  await page.reload();
  await page.waitForTimeout(1000);
  
  // 7. Verify event is no longer in the "created events" list
  // We need to check specifically in the "作成したイベント" section
  // The event might still be in "参加したイベント" but should not be in "作成したイベント"
  
  // First, let's wait for the page to load completely
  await page.waitForSelector('text=作成したイベント', { timeout: 5000 }).catch(() => null);
  
  // Check if the "no events" message is shown
  const noEventsMessage = page.locator('text=まだ作成したイベントはありません');
  const hasNoEvents = await noEventsMessage.isVisible().catch(() => false);
  
  if (hasNoEvents) {
    console.log('No created events found - deletion successful');
  } else {
    // Find the "Created Events" section specifically
    const createdEventsSection = page.locator('h5:has-text("作成したイベント")').locator('..');
    
    // Look for event cards in this section
    const cardsInCreatedSection = createdEventsSection.locator('div[class*="mantine-Card"]');
    const count = await cardsInCreatedSection.count();
    
    console.log(`Found ${count} cards in created events section`);
    
    // Verify the deleted event is not in this section
    for (let i = 0; i < count; i++) {
      const card = cardsInCreatedSection.nth(i);
      const text = await card.textContent();
      if (text?.includes('Event to Delete')) {
        throw new Error('Deleted event still appears in created events section');
      }
    }
  }

  // Screenshot 3: Events hub after deletion
  await page.screenshot({ path: '/tmp/events_hub_after_deletion.png', fullPage: true });

  console.log('Event deletion verified successfully');
  console.log('Screenshots saved to /tmp/');
});
