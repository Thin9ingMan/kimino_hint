import { test, expect } from '@playwright/test';

test('Profile memo field should persist and be visible only to the viewer', async ({ page }) => {
  // 1. Create User A (will be viewed by User B)
  const authResA = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const tokenA = authResA.headers()['authorization'];
  
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
    headers: { 'Authorization': tokenA },
    data: {
      updateRequest: {
        displayName: "User A",
        hobby: "Reading",
        favoriteArtist: "Artist A"
      }
    }
  });

  // Get User A's ID
  const meResA = await page.request.get('https://quarkus-crud.ouchiserver.aokiapp.com/api/me', {
    headers: { 'Authorization': tokenA }
  });
  const userAData = await meResA.json();
  const userAId = userAData.id;

  // 2. Create User B (will write memo about User A)
  const authResB = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const tokenB = authResB.headers()['authorization'];
  
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
    headers: { 'Authorization': tokenB },
    data: {
      updateRequest: {
        displayName: "User B",
        hobby: "Writing",
        favoriteArtist: "Artist B"
      }
    }
  });

  // 3. Login as User B
  await page.goto('http://localhost:5173/');
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, tokenB);
  await page.reload();

  // 4. Navigate to User A's profile
  await page.goto(`http://localhost:5173/profiles/${userAId}`);
  
  // Wait for profile page to load (look for userId display)
  await expect(page.getByText(`userId: ${userAId}`)).toBeVisible({ timeout: 10000 });

  // 5. Verify memo field exists and is visible on OTHER user's profile
  const memoField = page.locator('textarea[placeholder*="記入"]');
  await expect(memoField).toBeVisible();

  // 6. Write a memo about User A
  const memoText = 'Met at tech conference 2024. Interested in React.';
  await memoField.fill(memoText);
  
  // Wait a bit for any auto-save or debounce
  await page.waitForTimeout(500);

  // 7. Navigate away and come back
  await page.goto('http://localhost:5173/home');
  await expect(page.getByText('キミのヒント')).toBeVisible();
  
  await page.goto(`http://localhost:5173/profiles/${userAId}`);
  await expect(page.getByText(`userId: ${userAId}`)).toBeVisible();

  // 8. Verify memo content persists after navigation
  await expect(memoField).toBeVisible();
  await expect(memoField).toHaveValue(memoText);

  // 9. Reload the page
  await page.reload();
  await expect(page.getByText(`userId: ${userAId}`)).toBeVisible();

  // 10. Verify memo content persists after reload
  await expect(memoField).toBeVisible();
  await expect(memoField).toHaveValue(memoText);

  // 11. Edit the memo
  const updatedMemoText = 'Met at tech conference 2024. Interested in React and TypeScript.';
  await memoField.fill(updatedMemoText);
  await page.waitForTimeout(500);

  // 12. Reload and verify updated content persists
  await page.reload();
  await expect(page.getByText(`userId: ${userAId}`)).toBeVisible();
  await expect(memoField).toHaveValue(updatedMemoText);

  // 13. Verify memo does NOT appear on own profile (User B's profile)
  await page.goto('http://localhost:5173/me/profile');
  // Wait for own profile to load
  await page.waitForTimeout(1000);
  
  // Should NOT find memo field on own profile
  const ownProfileMemoField = page.locator('textarea[placeholder*="記入"]');
  await expect(ownProfileMemoField).not.toBeVisible();

  console.log('Profile memo test passed: memo persists and is visible only to viewer');
});
