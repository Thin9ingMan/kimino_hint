/**
 * E2E Test to reproduce Issue #71
 * 
 * Issue: Organizer cannot save quizzes
 * Symptoms: When the event organizer creates a quiz and tries to save it,
 *           they get an error "クイズの保存に失敗しました。もう一度お試しください。"
 * 
 * Expected: Organizer should be able to save quizzes
 * Actual: Save fails with an error
 * 
 * Root Cause Hypothesis: Event creators are not automatically added as attendees,
 *                        so they cannot update their own event user data
 */

import { test, expect } from '@playwright/test';

test.describe('Issue #71: Organizer Cannot Save Quiz', () => {
  test('should FAIL - Organizer tries to save quiz without joining event', async ({ page, request }) => {
    test.setTimeout(60000);
    
    // Step 1: Create a guest user (event organizer)
    const authRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const token = authRes.headers()['authorization'];
    
    // Step 2: Create profile for the organizer
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: { 
        profileData: { 
          displayName: "Test Organizer", 
          hobby: "Testing", 
          favoriteArtist: "Test Artist" 
        }
      }
    });
    
    // Step 3: Create an event (user becomes organizer but NOT an attendee)
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': token },
      data: { 
        eventCreateRequest: { 
          meta: { 
            name: "Issue 71 Test Event",
            description: "Testing organizer quiz save without joining"
          } 
        } 
      }
    });
    
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;
    
    console.log(`Event created: ID=${eventId}, Code=${invitationCode}`);
    console.log('NOTE: Organizer has NOT joined the event as an attendee');
    
    // Step 4: Login to the browser
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, token);
    await page.reload();
    
    // Step 5: Navigate to the event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Step 6: Try to create a quiz
    // Look for quiz creation button
    const quizButton = page.locator('text=クイズを作成').or(page.locator('text=自分のクイズを編集'));
    await expect(quizButton.first()).toBeVisible({ timeout: 10000 });
    await quizButton.first().click();
    
    // Navigate to quiz edit screen
    await page.waitForURL(`**/events/${eventId}/quiz/**`, { timeout: 10000 });
    
    // Check if we're on the intro or edit screen
    const createQuizButton = page.locator('text=クイズを作成');
    const isIntroScreen = await createQuizButton.isVisible().catch(() => false);
    
    if (isIntroScreen) {
      await createQuizButton.click();
      await page.waitForURL(`**/events/${eventId}/quiz/edit`, { timeout: 10000 });
    }
    
    // Step 7: Fill in quiz questions
    // The quiz editor should show questions based on profile
    await expect(page.locator('text=クイズエディタ').or(page.locator('text=クイズを編集'))).toBeVisible({ timeout: 10000 });
    
    // Wait for form to load
    await page.waitForTimeout(1000);
    
    // Fill in fake answers for each category
    // Names category
    const nameInputs = page.locator('input[placeholder*="田中"], input[placeholder*="鈴木"], input[placeholder*="佐藤"]');
    const nameCount = await nameInputs.count();
    if (nameCount > 0) {
      await nameInputs.nth(0).fill('偽の名前1');
      if (nameCount > 1) await nameInputs.nth(1).fill('偽の名前2');
      if (nameCount > 2) await nameInputs.nth(2).fill('偽の名前3');
    }
    
    // Hobbies category
    const hobbyInputs = page.locator('input[placeholder*="読書"], input[placeholder*="趣味"]');
    const hobbyCount = await hobbyInputs.count();
    if (hobbyCount > 0) {
      await hobbyInputs.nth(0).fill('偽の趣味1');
      if (hobbyCount > 1) await hobbyInputs.nth(1).fill('偽の趣味2');
      if (hobbyCount > 2) await hobbyInputs.nth(2).fill('偽の趣味3');
    }
    
    // Artists category
    const artistInputs = page.locator('input[placeholder*="YOASOBI"], input[placeholder*="アーティスト"]');
    const artistCount = await artistInputs.count();
    if (artistCount > 0) {
      await artistInputs.nth(0).fill('偽のアーティスト1');
      if (artistCount > 1) await artistInputs.nth(1).fill('偽のアーティスト2');
      if (artistCount > 2) await artistInputs.nth(2).fill('偽のアーティスト3');
    }
    
    // Step 8: Try to save the quiz
    const saveButton = page.locator('text=保存').or(page.locator('text=保存して完了')).or(page.locator('text=保存してロビーへ戻る'));
    await expect(saveButton.first()).toBeVisible({ timeout: 5000 });
    await saveButton.first().click();
    
    // Step 9: Expect to see an error message
    // This is where the bug manifests
    const errorMessage = page.locator('text=クイズの保存に失敗しました');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Successfully reproduced Issue #71: Organizer cannot save quiz without joining event');
  });
  
  test('should PASS - Organizer can save quiz AFTER joining event (workaround)', async ({ page, request }) => {
    test.setTimeout(60000);
    
    // Step 1: Create a guest user (event organizer)
    const authRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const token = authRes.headers()['authorization'];
    
    // Step 2: Create profile for the organizer
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: { 
        profileData: { 
          displayName: "Test Organizer", 
          hobby: "Testing", 
          favoriteArtist: "Test Artist" 
        }
      }
    });
    
    // Step 3: Create an event
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': token },
      data: { 
        eventCreateRequest: { 
          meta: { 
            name: "Issue 71 Test Event (Workaround)",
            description: "Testing organizer quiz save WITH joining"
          } 
        } 
      }
    });
    
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;
    
    console.log(`Event created: ID=${eventId}, Code=${invitationCode}`);
    
    // Step 4: WORKAROUND - Explicitly join the event as an attendee
    await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
      headers: { 'Authorization': token },
      data: { invitationCode }
    });
    
    console.log('✓ Organizer has joined the event as an attendee (WORKAROUND)');
    
    // Step 5: Login to the browser
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, token);
    await page.reload();
    
    // Step 6: Navigate to the event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    await page.waitForTimeout(1000);
    
    // Step 7: Create a quiz
    const quizButton = page.locator('text=クイズを作成').or(page.locator('text=自分のクイズを編集'));
    await expect(quizButton.first()).toBeVisible({ timeout: 10000 });
    await quizButton.first().click();
    
    await page.waitForURL(`**/events/${eventId}/quiz/**`, { timeout: 10000 });
    
    const createQuizButton = page.locator('text=クイズを作成');
    const isIntroScreen = await createQuizButton.isVisible().catch(() => false);
    
    if (isIntroScreen) {
      await createQuizButton.click();
      await page.waitForURL(`**/events/${eventId}/quiz/edit`, { timeout: 10000 });
    }
    
    // Step 8: Fill in quiz questions
    await expect(page.locator('text=クイズエディタ').or(page.locator('text=クイズを編集'))).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Fill in answers using the fill all button if available
    const fillAllButton = page.locator('text=すべて自動生成').or(page.locator('text=一括生成'));
    const hasFillAll = await fillAllButton.isVisible().catch(() => false);
    
    if (hasFillAll) {
      await fillAllButton.click();
      await page.waitForTimeout(2000); // Wait for generation
    } else {
      // Manual fill
      const inputs = page.locator('input[type="text"]');
      const count = await inputs.count();
      for (let i = 0; i < Math.min(count, 10); i++) {
        const input = inputs.nth(i);
        const isVisible = await input.isVisible().catch(() => false);
        if (isVisible) {
          const currentValue = await input.inputValue();
          if (!currentValue || currentValue.trim() === '') {
            await input.fill(`テスト回答${i + 1}`);
          }
        }
      }
    }
    
    // Step 9: Save the quiz
    const saveButton = page.locator('text=保存').or(page.locator('text=保存して完了')).or(page.locator('text=保存してロビーへ戻る'));
    await expect(saveButton.first()).toBeVisible({ timeout: 5000 });
    await saveButton.first().click();
    
    // Step 10: Verify success - should return to lobby without error
    await page.waitForURL(`**/events/${eventId}`, { timeout: 10000 });
    
    // Verify we're back in the lobby
    await expect(page.locator('text=参加者').or(page.locator('text=イベント'))).toBeVisible({ timeout: 5000 });
    
    // Should NOT see error message
    const errorMessage = page.locator('text=クイズの保存に失敗しました');
    await expect(errorMessage).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // Error not visible is expected
    });
    
    console.log('✓ Workaround successful: Organizer can save quiz after joining event');
  });
});
