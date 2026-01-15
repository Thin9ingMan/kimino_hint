import { test, expect } from '@playwright/test';

test.describe('Organizer Quiz Save Issue', () => {
  test('Organizer (event creator) cannot save quiz without joining event', async ({ page, request }) => {
    test.setTimeout(60000);

    // --- Setup: Create organizer user and profile ---
    const organizerRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const organizerToken = organizerRes.headers()['authorization'];
    
    // Set organizer profile
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': organizerToken },
      data: { 
        profileData: { 
          displayName: "Test Organizer", 
          hobby: "Organizing Events", 
          favoriteArtist: "Event Masters" 
        }
      }
    });

    // --- Create Event (as organizer) ---
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': organizerToken },
      data: { 
        eventCreateRequest: { 
          meta: { 
            name: "Organizer Quiz Test Event",
            description: "Testing organizer quiz save functionality"
          }
        }
      }
    });
    
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;
    
    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}`);
    console.log('Event data:', JSON.stringify(eventData, null, 2));

    // NOTE: Organizer does NOT explicitly join the event here
    // This mimics the actual user behavior where they just create an event
    // and try to create a quiz without joining

    // --- Login as organizer in browser ---
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, organizerToken);
    await page.reload();

    // --- Navigate to event lobby ---
    await page.goto(`http://localhost:5173/events/${eventId}`);
    
    // Wait for event info to load
    await expect(page.getByText('イベント情報')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Organizer Quiz Test Event')).toBeVisible();

    // --- Try to create a quiz ---
    // Click "Edit My Quiz" button
    await page.click('text=自分のクイズを編集');
    
    // Should navigate to quiz intro screen
    await expect(page).toHaveURL(new RegExp(`.*\\/events\\/${eventId}\\/quiz$`));
    
    // Click "Create Quiz" button
    await page.click('text=クイズを作成');
    
    // Should navigate to quiz edit screen
    await expect(page).toHaveURL(new RegExp(`.*\\/events\\/${eventId}\\/quiz\\/edit$`));

    // Wait for the form to load
    await expect(page.getByText('クイズエディタ')).toBeVisible();

    // Check if profile data is loaded correctly
    const nameQuestion = page.getByText('私の「名前」はどれ？');
    const hobbyQuestion = page.getByText('私の「趣味」はどれ？');
    const artistQuestion = page.getByText('私の「好きなアーティスト」はどれ？');
    
    await expect(nameQuestion).toBeVisible();
    await expect(hobbyQuestion).toBeVisible();
    await expect(artistQuestion).toBeVisible();

    // Use auto-generation buttons to fill in the quiz choices
    // Click auto-generate for hobbies
    await page.click('button:has-text("固定項目を自動埋め")');
    
    // Wait for generation to complete
    await page.waitForTimeout(3000);

    // --- Try to save the quiz ---
    const saveButton = page.getByRole('button', { name: '保存して完了' });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // --- Expected behavior: This should FAIL for organizers who haven't joined ---
    // The save operation should fail because the organizer's user ID 
    // might not match any attendee in the event
    
    // Check for error messages or failure to navigate
    // We expect one of these scenarios:
    // 1. An error alert appears
    // 2. The page stays on the edit screen (doesn't navigate away)
    // 3. A network error occurs

    // Wait to see if we stay on edit screen or get an error
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const hasError = await page.getByRole('alert').isVisible().catch(() => false);
    
    console.log('Current URL after save attempt:', currentUrl);
    console.log('Has error alert:', hasError);
    
    // Log any error messages that appear
    if (hasError) {
      const errorText = await page.getByRole('alert').innerText();
      console.log('Error message:', errorText);
    }

    // Check if we're still on the edit screen (indicating save failed)
    const stillOnEditScreen = currentUrl.includes('/quiz/edit');
    
    // This test should demonstrate the bug
    // If save succeeds (navigates to lobby), the bug is NOT reproduced
    // If save fails (stays on edit or shows error), the bug IS reproduced
    
    if (stillOnEditScreen || hasError) {
      console.log('BUG REPRODUCED: Organizer cannot save quiz!');
      console.log('The organizer stayed on edit screen or got an error when trying to save.');
    } else {
      console.log('BUG NOT REPRODUCED: Save appeared to succeed.');
      console.log('This might mean the backend automatically adds organizers as attendees.');
    }

    // For now, we expect this test to expose the issue
    // The assertion will depend on whether save succeeds or fails
    // Let's check both scenarios and document what happens
    
    // Take a screenshot for debugging
    await page.screenshot({ path: '/tmp/organizer-quiz-save-attempt.png', fullPage: true });
    
    // Document the result
    console.log('Test completed. Check the screenshot and logs to see the actual behavior.');
  });

  test('Organizer CAN save quiz after explicitly joining event', async ({ page, request }) => {
    test.setTimeout(60000);

    // --- Setup: Create organizer user and profile ---
    const organizerRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const organizerToken = organizerRes.headers()['authorization'];
    
    // Set organizer profile
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': organizerToken },
      data: { 
        profileData: { 
          displayName: "Test Organizer 2", 
          hobby: "Event Planning", 
          favoriteArtist: "Planners United" 
        }
      }
    });

    // --- Create Event (as organizer) ---
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': organizerToken },
      data: { 
        eventCreateRequest: { 
          meta: { 
            name: "Organizer Join Test Event",
            description: "Testing organizer quiz save after joining"
          }
        }
      }
    });
    
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;
    
    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}`);

    // --- IMPORTANT: Organizer explicitly joins their own event ---
    const joinRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
      headers: { 'Authorization': organizerToken },
      data: { invitationCode }
    });

    if (!joinRes.ok()) {
      console.error('Failed to join event:', joinRes.status(), await joinRes.text());
      throw new Error('Organizer failed to join event');
    }

    const attendeeData = await joinRes.json();
    console.log('Organizer joined as attendee:', JSON.stringify(attendeeData, null, 2));

    // --- Login as organizer in browser ---
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, organizerToken);
    await page.reload();

    // --- Navigate to event lobby ---
    await page.goto(`http://localhost:5173/events/${eventId}`);
    
    // Wait for event info to load
    await expect(page.getByText('イベント情報')).toBeVisible({ timeout: 10000 });

    // --- Create a quiz ---
    await page.click('text=自分のクイズを編集');
    await expect(page).toHaveURL(new RegExp(`.*\\/events\\/${eventId}\\/quiz$`));
    
    await page.click('text=クイズを作成');
    await expect(page).toHaveURL(new RegExp(`.*\\/events\\/${eventId}\\/quiz\\/edit$`));

    // Fill in quiz
    await expect(page.getByText('クイズエディタ')).toBeVisible();
    await page.click('button:has-text("固定項目を自動埋め")');
    await page.waitForTimeout(3000);

    // --- Save the quiz ---
    await page.click('button:has-text("保存して完了")');

    // --- Verify successful save ---
    // Should navigate back to event lobby
    await expect(page).toHaveURL(new RegExp(`.*\\/events\\/${eventId}$`), { timeout: 10000 });
    await expect(page.getByText('イベント情報')).toBeVisible();
    
    console.log('SUCCESS: Organizer successfully saved quiz after joining event!');
  });
});
