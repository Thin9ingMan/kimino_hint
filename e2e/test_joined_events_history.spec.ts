import { test, expect } from '@playwright/test';

test('Joined Events History - Display and Re-enter', async ({ page }) => {
  // 1. Setup Guest User
  const authRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const token = authRes.headers()['authorization'];
  
  // Set Profile
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: {
        updateRequest: {
          displayName: "Joined Events Tester",
          hobby: "Event Joining",
          favoriteArtist: "History"
        }
      }
    });

  // Login to app
  await page.goto('http://localhost:5173/');
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, token);
  await page.reload();

  // 2. Create an Event (as another user would)
  const hostAuthRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const hostToken = hostAuthRes.headers()['authorization'];
  
  const eventRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
    headers: { 'Authorization': hostToken },
    data: {
      eventCreateRequest: {
        meta: {
          name: "Test Event for Joining",
          description: "This is a test event"
        }
      }
    }
  });
  
  const eventData = await eventRes.json();
  const eventId = eventData.id;
  const invitationCode = eventData.invitationCode;
  
  console.log('Created event:', eventId, 'with code:', invitationCode);

  // 3. Navigate to Join Event screen
  await page.goto('http://localhost:5173/events/join');
  await expect(page.getByLabel('招待コード')).toBeVisible();

  // 4. Enter invitation code and join
  await page.fill('input[placeholder*="ABC123"]', invitationCode);
  await page.click('button:has-text("参加する")');

  // 5. Verify we're in the event lobby
  await expect(page).toHaveURL(new RegExp(`.*/events/${eventId}`));
  await expect(page.getByText('Test Event for Joining', { exact: false })).toBeVisible();

  // 6. Navigate back to Events Hub
  const attendedEventsResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/me/attended-events')
  );
  await page.click('text=イベント一覧へ');
  await expect(page).toHaveURL(/.*\/events$/);
  const attendedEventsResponse = await attendedEventsResponsePromise;
  expect(attendedEventsResponse.status()).toBe(200);

  // 7. CRITICAL TEST: Verify "Joined Events" section exists
  await expect(page.getByText('参加したイベント')).toBeVisible();

  // 8. Verify the joined event appears in the list
  const joinedEventLink = page.locator('text=Test Event for Joining').first();
  await expect(joinedEventLink).toBeVisible();

  // 9. Click on the joined event to re-enter
  await joinedEventLink.click();

  // 10. Verify we're back in the event lobby
  await expect(page).toHaveURL(new RegExp(`.*/events/${eventId}`));
  await expect(page.getByText('Test Event for Joining', { exact: false })).toBeVisible();

  console.log('Joined events history test completed successfully');
});

test('Joined Events - Multiple Events', async ({ page }) => {
  // 1. Setup Guest User
  const authRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const token = authRes.headers()['authorization'];
  
  await page.request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': token },
      data: {
        updateRequest: {
          displayName: "Multi Event Tester",
          hobby: "Testing",
          favoriteArtist: "Multiple"
        }
      }
    });

  await page.goto('http://localhost:5173/');
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, token);
  await page.reload();

  // 2. Create multiple events and join them
  const hostAuthRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const hostToken = hostAuthRes.headers()['authorization'];
  
  const eventNames = ['Event Alpha', 'Event Beta', 'Event Gamma'];
  const joinedEvents = [];

  for (const name of eventNames) {
    const eventRes = await page.request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': hostToken },
      data: {
        eventCreateRequest: {
          meta: { name, description: `Description for ${name}` }
        }
      }
    });
    
    const eventData = await eventRes.json();
    joinedEvents.push(eventData);

    // Join via invitation code
    await page.goto('http://localhost:5173/events/join');
    await page.fill('input[placeholder*="ABC123"]', eventData.invitationCode);
    await page.click('button:has-text("参加する")');
    await expect(page).toHaveURL(new RegExp(`.*/events/${eventData.id}`));
  }

  // 3. Go to Events Hub
  await page.goto('http://localhost:5173/events');
  
  // 4. Verify all joined events are visible
  await expect(page.getByText('参加したイベント')).toBeVisible();
  
  for (const name of eventNames) {
    await expect(page.getByText(name, { exact: false })).toBeVisible();
  }

  console.log('Multiple joined events test completed');
});
