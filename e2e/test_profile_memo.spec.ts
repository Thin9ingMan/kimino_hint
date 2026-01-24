import { test, expect } from '@playwright/test';

const API_BASE_URL = 'https://quarkus-crud.ouchiserver.aokiapp.com';
const APP_URL = 'http://localhost:5173';

async function createUserWithProfile(page: any, displayName: string, hobby: string, favoriteArtist: string) {
  const authRes = await page.request.post(`${API_BASE_URL}/api/auth/guest`);
  const token = authRes.headers()['authorization'];
  
  await page.request.put(`${API_BASE_URL}/api/me/profile`, {
    headers: { 'Authorization': token },
    data: {
      updateRequest: {
        displayName,
        hobby,
        favoriteArtist
      }
    }
  });

  const meRes = await page.request.get(`${API_BASE_URL}/api/me`, {
    headers: { 'Authorization': token }
  });
  const userData = await meRes.json();

  return { token, userId: userData.id };
}

test('Profile memo field should persist and be visible only to the viewer', async ({ page }) => {
  // 1. Create User A (will be viewed by User B)
  const userA = await createUserWithProfile(page, "User A", "Reading", "Artist A");

  // 2. Create User B (will write memo about User A)
  const userB = await createUserWithProfile(page, "User B", "Writing", "Artist B");

  // 3. Login as User B
  await page.goto(APP_URL);
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, userB.token);
  await page.reload();

  // 4. Navigate to User A's profile
  await page.goto(`${APP_URL}/profiles/${userA.userId}`);
  
  // Wait for profile page to load (look for userId display)
  await expect(page.getByText(`userId: ${userA.userId}`)).toBeVisible({ timeout: 10000 });

  // 5. Verify memo field exists and is visible on OTHER user's profile
  const memoField = page.locator('textarea[placeholder*="記入"]');
  await expect(memoField).toBeVisible();

  // 6. Write a memo about User A
  const memoText = 'Met at tech conference 2024. Interested in React.';
  await memoField.fill(memoText);
  
  // Wait for debounce and save to complete (500ms debounce + save time)
  await page.waitForTimeout(1500);

  // 7. Navigate away and come back
  await page.goto(`${APP_URL}/home`);
  await expect(page.getByText('キミのヒント')).toBeVisible();
  
  await page.goto(`${APP_URL}/profiles/${userA.userId}`);
  await expect(page.getByText(`userId: ${userA.userId}`)).toBeVisible();

  // 8. Verify memo content persists after navigation
  const memoFieldAfterNav = page.locator('textarea[placeholder*="記入"]');
  await expect(memoFieldAfterNav).toBeVisible();
  await expect(memoFieldAfterNav).toHaveValue(memoText);

  // 9. Reload the page
  await page.reload();
  await expect(page.getByText(`userId: ${userA.userId}`)).toBeVisible();

  // 10. Verify memo content persists after reload
  const memoFieldAfterReload = page.locator('textarea[placeholder*="記入"]');
  await expect(memoFieldAfterReload).toBeVisible();
  await expect(memoFieldAfterReload).toHaveValue(memoText);

  // 11. Edit the memo
  const updatedMemoText = 'Met at tech conference 2024. Interested in React and TypeScript.';
  await memoFieldAfterReload.fill(updatedMemoText);
  // Wait for debounce and save
  await page.waitForTimeout(1500);

  // 12. Reload and verify updated content persists
  await page.reload();
  await expect(page.getByText(`userId: ${userA.userId}`)).toBeVisible();
  const memoFieldFinal = page.locator('textarea[placeholder*="記入"]');
  await expect(memoFieldFinal).toHaveValue(updatedMemoText);

  // 13. Verify memo does NOT appear on own profile (User B's profile)
  await page.goto(`${APP_URL}/me/profile`);
  // Wait for own profile to load
  await page.waitForTimeout(1000);
  
  // Should NOT find memo field on own profile
  const ownProfileMemoField = page.locator('textarea[placeholder*="記入"]');
  await expect(ownProfileMemoField).not.toBeVisible();

  console.log('Profile memo test passed: memo persists and is visible only to viewer');
});
