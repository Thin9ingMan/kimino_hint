import { test, expect } from '@playwright/test';

test('Quiz Creation Flow', async ({ page }) => {
  // 1. Setup: Create a new event via API (to save UI steps/time)
  // We need a guest token first
  const authRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');

  const authData = await authRes.json();
  const token = authRes.headers()['authorization'];
  
  // Create profile
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {

    headers: { 'Authorization': token },
    data: {
      profileData: {
        displayName: "Test User",
        hobby: "Coding",
        favoriteArtist: "AI"
      }
    }
  });

  // Create Event
  const eventRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {

    headers: { 'Authorization': token },
    data: {
      meta: {
        name: "E2E Test Event",
        description: "Testing Quiz Flow",
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
  await page.reload();

  
  // 3. Go to Event Lobby
  await page.goto(`http://localhost:5173/events/${eventId}`);
  await expect(page.getByText('E2E Test Event')).toBeVisible();

  // 4. Click "Edit My Quiz" (or "Create Quiz")
  await page.click('text=自分のクイズを編集'); // Button text might be "クイズを作成" or "クイズを編集"
  // Wait for navigation
  await page.waitForURL(`**/events/${eventId}/quiz`);
  
  // In QuizIntro, click Create/Edit
  await page.click('text=クイズを作成'); // or クイズを編集
  await page.waitForURL(`**/events/${eventId}/quiz/edit`);

  // 5. Fill Quiz Form
  // Check if profile data is loaded (Correct Answer: Test User)
  await expect(page.getByText('正解: Test User')).toBeVisible();

  // Click Auto Generate for Names (using our random fallback logic if LLM fails, or LLM)
  // Since real LLM API might be slow or fail, we can manual fill or try button.
  // Let's manually fill to ensure test robustness, but verify button exists
  await expect(page.getByText('名前を自動生成')).toBeVisible();

  await page.fill('input[placeholder="例: 田中 太郎"]', 'Fake Name 1');
  await page.fill('input[placeholder="例: 鈴木 花子"]', 'Fake Name 2');
  await page.fill('input[placeholder="例: 佐藤 健"]', 'Fake Name 3');

  // Hobbies
  await expect(page.getByText('正解: Coding')).toBeVisible();
  // Try auto-gen button for hobbies (should be faster as it uses local array)
  await page.click('text=趣味の選択肢を自動生成');
  // Verify inputs are filled
  // Note: Mantine Input might behave differently, checking value
  const hobbyVal = await page.inputValue('input[placeholder="例: 読書"]');
  expect(hobbyVal).toBeTruthy();

  // Artists
  await expect(page.getByText('正解: AI')).toBeVisible();
  await page.click('text=アーティストの選択肢を自動生成');
  const artistVal = await page.inputValue('input[placeholder="例: YOASOBI"]');
  expect(artistVal).toBeTruthy();

  // 6. Save
  await page.click('text=保存してロビーへ戻る');
  
  // 7. Verify return to lobby
  await page.waitForURL(`**/events/${eventId}`);
  await expect(page.getByText('参加者')).toBeVisible();

  console.log('Quiz creation flow verified successfully');
});
