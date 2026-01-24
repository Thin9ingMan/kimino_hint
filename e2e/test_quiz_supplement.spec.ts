import { test, expect } from '@playwright/test';

test('Quiz Supplement Feature', async ({ page }) => {
  // 1. Setup: Create a new event via API
  const authRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const authData = await authRes.json();
  const token = authRes.headers()['authorization'];
  
  // Create profile
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
    headers: { 'Authorization': token },
    data: {
      userProfileUpdateRequest: {
        profileData: {
          displayName: "補足テストユーザー",
          furigana: "ホソクテストユーザー",
          hobby: "読書",
          favoriteArtist: "YOASOBI",
          faculty: "工学部",
          grade: "2年生"
        }
      }
    }
  });

  // Create Event
  const eventRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
    headers: { 'Authorization': token },
    data: {
      meta: {
        name: "補足機能テストイベント",
        description: "Testing Quiz Supplement Feature",
        maxParticipants: 10
      }
    }
  });
  const eventData = await eventRes.json();
  const eventId = eventData.id;

  // 2. Login in browser (set token in localStorage)
  await page.goto('http://localhost:5173/');
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, token);

  // 3. Navigate to Quiz Edit Screen
  await page.goto(`http://localhost:5173/events/${eventId}/quiz/edit`);
  
  // 4. Wait for page to load
  await expect(page.getByText('クイズ編集')).toBeVisible({ timeout: 10000 });

  // 5. Find a question card and add a supplement/explanation
  // Look for the "補足説明" or "解説" field
  const supplementLabel = page.getByText('補足説明').or(page.getByText('解説'));
  await expect(supplementLabel).toBeVisible({ timeout: 5000 });

  // Find the supplement textarea/input for the first question
  const supplementInput = page.locator('textarea').filter({ hasText: '' }).first();
  await expect(supplementInput).toBeVisible();

  // Add a supplement text
  const supplementText = "この質問は私の趣味に関するものです。読書が好きな理由は、新しい世界を知ることができるからです。";
  await supplementInput.fill(supplementText);

  // 6. Click auto-generate to fill choices
  await page.click('text=固定項目を自動埋め');
  // Wait for the auto-generation to complete by checking for filled choices
  await expect(page.locator('input[value]').first()).toBeVisible({ timeout: 5000 });

  // 7. Save the quiz
  await page.click('text=保存して完了');
  
  // 8. Wait for navigation back to event lobby
  await page.waitForURL(`**/events/${eventId}`, { timeout: 10000 });

  // 8.5. Navigate back to quiz edit to verify data persistence
  await page.goto(`http://localhost:5173/events/${eventId}/quiz/edit`);
  await expect(page.getByText('クイズ編集')).toBeVisible({ timeout: 10000 });

  // Verify the supplement text is still there after reload
  const reloadedSupplementInput = page.locator('textarea').filter({ hasText: supplementText }).first();
  await expect(reloadedSupplementInput).toBeVisible({ timeout: 5000 });
  await expect(reloadedSupplementInput).toHaveValue(supplementText);

  // Navigate back to event lobby for the next part of the test
  await page.goto(`http://localhost:5173/events/${eventId}`);
  await page.waitForLoadState('networkidle');

  // 9. Now create a second user to answer the quiz
  const user2AuthRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const user2Token = user2AuthRes.headers()['authorization'];
  
  // Create profile for user2
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
    headers: { 'Authorization': user2Token },
    data: {
      userProfileUpdateRequest: {
        profileData: {
          displayName: "回答者ユーザー",
          furigana: "カイトウシャユーザー",
          hobby: "映画鑑賞",
          favoriteArtist: "米津玄師",
          faculty: "文学部",
          grade: "3年生"
        }
      }
    }
  });

  // Join the event
  await page.request.post(`https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users`, {
    headers: { 'Authorization': user2Token },
    data: {}
  });

  // 10. Login as user2
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, user2Token);

  // 11. Navigate to quiz challenge list
  await page.goto(`http://localhost:5173/events/${eventId}/quiz/challenges`);
  await page.waitForLoadState('networkidle');

  // 12. Click on first user's quiz - find the card and click the Start button
  await page.locator('.mantine-Card-root', { hasText: '補足テストユーザー' }).getByText('開始').click();
  
  // 13. Wait for first question
  await page.waitForURL(`**/quiz/challenge/**/1`, { timeout: 10000 });
  
  // 14. Answer the question (click any choice)
  const firstChoice = page.locator('button').filter({ hasText: /工学部|文学部|経済学部/ }).first();
  await firstChoice.click();

  // 15. Wait for result to show
  await page.waitForTimeout(1000);

  // 16. Verify that the supplement/explanation is displayed
  await expect(page.getByText(supplementText)).toBeVisible({ timeout: 5000 });

  console.log('Quiz supplement feature verified successfully');
});
