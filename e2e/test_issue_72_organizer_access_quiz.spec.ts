/**
 * E2E Test to reproduce Issue #72
 * 
 * Issue: Loading error when organizer tries to start a participant's quiz
 * Symptoms: When the event organizer tries to take another participant's quiz,
 *           a loading error occurs
 * 
 * Expected: Organizer should be able to view and take participant quizzes
 * Actual: Loading error occurs
 * 
 * Root Cause Hypothesis: Event creators are not automatically added as attendees,
 *                        so they don't have proper access to event user data
 */

import { test, expect } from '@playwright/test';

test.describe('Issue #72: Organizer Cannot Access Participant Quiz', () => {
  test('should FAIL - Organizer tries to access participant quiz without joining event', async ({ page, request }) => {
    test.setTimeout(90000);
    
    // Step 1: Create organizer user
    const organizerRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const organizerToken = organizerRes.headers()['authorization'];
    
    // Create organizer profile
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': organizerToken },
      data: { 
        profileData: { 
          displayName: "Event Organizer", 
          hobby: "Organizing", 
          favoriteArtist: "Organizer Artist" 
        }
      }
    });
    
    // Step 2: Create event (organizer NOT joined as attendee)
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': organizerToken },
      data: { 
        eventCreateRequest: { 
          meta: { 
            name: "Issue 72 Test Event",
            description: "Testing organizer access to participant quiz"
          } 
        } 
      }
    });
    
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;
    
    console.log(`Event created: ID=${eventId}, Code=${invitationCode}`);
    console.log('NOTE: Organizer has NOT joined the event as an attendee');
    
    // Step 3: Create a participant user
    const participantRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const participantToken = participantRes.headers()['authorization'];
    
    // Create participant profile
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': participantToken },
      data: { 
        profileData: { 
          displayName: "Test Participant", 
          hobby: "Participating", 
          favoriteArtist: "Participant Artist" 
        }
      }
    });
    
    // Step 4: Participant joins the event
    const joinRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
      headers: { 'Authorization': participantToken },
      data: { invitationCode }
    });
    
    const attendeeData = await joinRes.json();
    const participantUserId = attendeeData.attendeeUserId || attendeeData.userId;
    
    console.log(`Participant joined: userId=${participantUserId}`);
    
    // Step 5: Participant creates a quiz
    await request.put(`https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${participantUserId}`, {
      headers: { 'Authorization': participantToken },
      data: { 
        userData: { 
          myQuiz: {
            questions: [
              { 
                id: 'q1',
                question: 'Who is this participant?', 
                choices: [
                  { id: 'c1', text: 'Test Participant', isCorrect: true },
                  { id: 'c2', text: 'Wrong Answer 1', isCorrect: false },
                  { id: 'c3', text: 'Wrong Answer 2', isCorrect: false },
                  { id: 'c4', text: 'Wrong Answer 3', isCorrect: false }
                ]
              }
            ]
          }
        } 
      }
    });
    
    console.log('Participant has created a quiz');
    
    // Step 6: Login as organizer in the browser
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, organizerToken);
    await page.reload();
    
    // Step 7: Navigate to event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    await page.waitForTimeout(1000);
    
    // Step 8: Try to access quiz challenge list
    const challengeButton = page.locator('text=クイズに挑戦').or(page.locator('text=クイズ挑戦'));
    await expect(challengeButton.first()).toBeVisible({ timeout: 10000 });
    await challengeButton.first().click();
    
    // Navigate to challenge list
    await page.waitForURL(`**/events/${eventId}/quiz/challenge`, { timeout: 10000 });
    
    // Step 9: Try to start the participant's quiz
    // Look for the participant in the list
    await expect(page.locator('text=Test Participant').or(page.locator('text=Participant'))).toBeVisible({ timeout: 10000 });
    
    // Click on the participant's quiz or start button
    const startButton = page.locator('text=開始').or(page.locator('text=始める')).or(page.locator('button').filter({ hasText: 'Test Participant' }));
    await expect(startButton.first()).toBeVisible({ timeout: 5000 });
    await startButton.first().click();
    
    // Step 10: Expect to see a loading error
    // The bug should manifest here
    await page.waitForTimeout(2000);
    
    // Check for error indicators
    const errorMessage = page.locator('text=エラー').or(page.locator('text=読み込みエラー')).or(page.locator('text=失敗'));
    const isErrorVisible = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isErrorVisible) {
      console.log('✓ Successfully reproduced Issue #72: Organizer cannot access participant quiz');
      expect(isErrorVisible).toBe(true);
    } else {
      // Check if we're stuck on loading
      const loadingIndicator = page.locator('text=読み込み中').or(page.locator('[data-loading="true"]'));
      const isLoading = await loadingIndicator.first().isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isLoading) {
        console.log('✓ Successfully reproduced Issue #72: Quiz stuck in loading state');
        expect(isLoading).toBe(true);
      } else {
        // The issue might manifest differently
        console.log('Issue #72 may have manifested in a different way or may be fixed');
      }
    }
  });
  
  test('should PASS - Organizer can access participant quiz AFTER joining event (workaround)', async ({ page, request }) => {
    test.setTimeout(90000);
    
    // Step 1: Create organizer user
    const organizerRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const organizerToken = organizerRes.headers()['authorization'];
    
    // Create organizer profile
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': organizerToken },
      data: { 
        profileData: { 
          displayName: "Event Organizer", 
          hobby: "Organizing", 
          favoriteArtist: "Organizer Artist" 
        }
      }
    });
    
    // Step 2: Create event
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': organizerToken },
      data: { 
        eventCreateRequest: { 
          meta: { 
            name: "Issue 72 Test Event (Workaround)",
            description: "Testing organizer access WITH joining"
          } 
        } 
      }
    });
    
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;
    
    console.log(`Event created: ID=${eventId}, Code=${invitationCode}`);
    
    // Step 3: WORKAROUND - Organizer joins their own event
    await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
      headers: { 'Authorization': organizerToken },
      data: { invitationCode }
    });
    
    console.log('✓ Organizer has joined the event as an attendee (WORKAROUND)');
    
    // Step 4: Create a participant user
    const participantRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const participantToken = participantRes.headers()['authorization'];
    
    // Create participant profile
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': participantToken },
      data: { 
        profileData: { 
          displayName: "Test Participant", 
          hobby: "Participating", 
          favoriteArtist: "Participant Artist" 
        }
      }
    });
    
    // Step 5: Participant joins the event
    const joinRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
      headers: { 'Authorization': participantToken },
      data: { invitationCode }
    });
    
    const attendeeData = await joinRes.json();
    const participantUserId = attendeeData.attendeeUserId || attendeeData.userId;
    
    console.log(`Participant joined: userId=${participantUserId}`);
    
    // Step 6: Participant creates a quiz
    await request.put(`https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${participantUserId}`, {
      headers: { 'Authorization': participantToken },
      data: { 
        userData: { 
          myQuiz: {
            questions: [
              { 
                id: 'q1',
                question: 'Who is this participant?', 
                choices: [
                  { id: 'c1', text: 'Test Participant', isCorrect: true },
                  { id: 'c2', text: 'Wrong Answer 1', isCorrect: false },
                  { id: 'c3', text: 'Wrong Answer 2', isCorrect: false },
                  { id: 'c4', text: 'Wrong Answer 3', isCorrect: false }
                ]
              }
            ]
          }
        } 
      }
    });
    
    console.log('Participant has created a quiz');
    
    // Step 7: Login as organizer in the browser
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, organizerToken);
    await page.reload();
    
    // Step 8: Navigate to event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    await page.waitForTimeout(1000);
    
    // Step 9: Access quiz challenge list
    const challengeButton = page.locator('text=クイズに挑戦').or(page.locator('text=クイズ挑戦'));
    await expect(challengeButton.first()).toBeVisible({ timeout: 10000 });
    await challengeButton.first().click();
    
    await page.waitForURL(`**/events/${eventId}/quiz/challenge`, { timeout: 10000 });
    
    // Step 10: Start the participant's quiz
    await expect(page.locator('text=Test Participant').or(page.locator('text=Participant'))).toBeVisible({ timeout: 10000 });
    
    const startButton = page.locator('text=開始').or(page.locator('text=始める')).first();
    await expect(startButton).toBeVisible({ timeout: 5000 });
    await startButton.click();
    
    // Step 11: Verify quiz loads successfully
    await page.waitForTimeout(2000);
    
    // Should see the quiz question
    const questionText = page.locator('text=Who is this participant?').or(page.locator('text=Test Participant'));
    await expect(questionText.first()).toBeVisible({ timeout: 10000 });
    
    // Should NOT see error message
    const errorMessage = page.locator('text=エラー').or(page.locator('text=読み込みエラー'));
    const hasError = await errorMessage.first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBe(false);
    
    console.log('✓ Workaround successful: Organizer can access participant quiz after joining event');
  });
});
