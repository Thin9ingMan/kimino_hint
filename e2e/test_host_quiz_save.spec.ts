import { test, expect } from '@playwright/test';

/**
 * Test to reproduce the issue where event host cannot save quiz
 * Issue: 主催者がクイズを保存できない
 * 
 * Expected: Host should be able to save quiz after creating event
 * Actual: Host gets error "クイズの保存に失敗しました。もう一度お試しください。"
 */
test.describe('Host Quiz Save Issue', () => {
  
  test('Host can save quiz after creating event (without manually joining)', async ({ page, request }) => {
    test.setTimeout(60000);

    // 1. Create guest user (host)
    const authRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const token = authRes.headers()['authorization'];
    
    // 2. Set up profile (required for quiz generation)
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: { 
        updateRequest: {
          profileData: {
            displayName: "Host User",
            hobby: "Testing",
            favoriteArtist: "TestArtist",
            faculty: "工学部",
            grade: "1年生"
          }
        }
      }
    });

    // 3. Create event via API
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': token },
      data: {
        eventCreateRequest: {
          meta: {
            name: "Host Quiz Save Test Event",
            description: "Testing host quiz save"
          }
        }
      }
    });
    const eventData = await createEventRes.json();
    const eventId = eventData.id;

    console.log(`Event Created: ID=${eventId}`);

    // NOTE: We do NOT manually join the event here - this is the bug

    // 4. Login in browser
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, token);
    
    // 5. Navigate to event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    await expect(page.getByText('Host Quiz Save Test Event')).toBeVisible();

    // 6. Click to edit/create quiz
    await page.click('text=自分のクイズを編集');
    
    // Wait for quiz intro screen
    await expect(page.getByText('クイズを作成')).toBeVisible();
    
    // Click create quiz button
    await page.click('text=クイズを作成');
    
    // Wait for quiz edit screen
    await expect(page).toHaveURL(/.*\/quiz\/edit/);

    // 7. Wait for quiz form to load
    await page.waitForTimeout(2000);

    // 8. Use auto-generate button to fill all fixed questions
    const autoFillButton = page.getByText('固定項目を自動埋め');
    if (await autoFillButton.isVisible()) {
      await autoFillButton.click();
      // Wait for generation to complete
      await page.waitForTimeout(3000);
    }

    // 9. Save quiz - this should work without error
    await page.click('text=保存して完了');
    
    // 10. Verify we returned to lobby (no error)
    // If there was an error, we'd still be on the edit page with error message
    await page.waitForURL(`**/events/${eventId}`, { timeout: 10000 });
    
    // Verify we're back at the lobby
    await expect(page.getByText('イベント情報')).toBeVisible();
    
    // Verify no error message is showing
    const errorMessage = page.getByText('クイズの保存に失敗しました');
    await expect(errorMessage).not.toBeVisible();

    console.log('✅ Host successfully saved quiz without manually joining event');
  });

  test('Verify the workaround: Host can save quiz after manually joining', async ({ page, request }) => {
    test.setTimeout(60000);

    // 1. Create guest user (host)
    const authRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const token = authRes.headers()['authorization'];
    
    // 2. Set up profile
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: { 
        updateRequest: {
          profileData: {
            displayName: "Host User Workaround",
            hobby: "Testing",
            favoriteArtist: "TestArtist"
          }
        }
      }
    });

    // 3. Create event via API
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': token },
      data: {
        eventCreateRequest: {
          meta: {
            name: "Workaround Test Event",
            description: "Testing workaround"
          }
        }
      }
    });
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;

    // 4. WORKAROUND: Manually join own event
    await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
      headers: { 'Authorization': token },
      data: { invitationCode }
    });

    console.log('✅ Host manually joined their own event (workaround)');

    // 5. Login in browser
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, token);
    
    // 6. Navigate to event and create quiz
    await page.goto(`http://localhost:5173/events/${eventId}`);
    await page.click('text=自分のクイズを編集');
    await page.click('text=クイズを作成');
    await expect(page).toHaveURL(/.*\/quiz\/edit/);

    // 7. Wait and try auto-fill
    await page.waitForTimeout(2000);
    const autoFillButton = page.getByText('固定項目を自動埋め');
    if (await autoFillButton.isVisible()) {
      await autoFillButton.click();
      await page.waitForTimeout(3000);
    }

    // 8. Save quiz - should work with workaround
    await page.click('text=保存して完了');
    
    // 9. Verify success
    await page.waitForURL(`**/events/${eventId}`, { timeout: 10000 });
    await expect(page.getByText('イベント情報')).toBeVisible();

    console.log('✅ Workaround verified: Host can save quiz after manually joining');
  });
});
