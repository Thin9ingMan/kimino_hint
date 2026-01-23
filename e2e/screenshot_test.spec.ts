import { test } from '@playwright/test';

test('Take screenshot of quiz edit screen', async ({ page, request }) => {
  test.setTimeout(90000);

  // Create User
  const user_res = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
  const token = user_res.headers()['authorization'];
  
  // Set Profile
  await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
    headers: { 'Authorization': token },
    data: { 
      profileData: { 
        displayName: "Screenshot User", 
        hobby: "Testing", 
        favoriteArtist: "Test Artist",
        faculty: "工学部",
        grade: "2年生"
      }
    }
  });

  // Create Event
  const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
    headers: { 'Authorization': token },
    data: { 
      eventCreateRequest: { 
        meta: { 
          name: "Screenshot Event",
          description: "For screenshots" 
        } 
      } 
    }
  });
  const eventData = await createEventRes.json();
  const eventId = eventData.id;
  const invitationCode = eventData.invitationCode;

  // Join event
  await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
    headers: { 'Authorization': token },
    data: { invitationCode }
  });

  // Login
  await page.goto('http://localhost:5173/');
  await page.evaluate((t) => {
    localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
  }, token);

  // Navigate to quiz edit
  await page.goto(`http://localhost:5173/events/${eventId}/quiz/edit`);
  await page.waitForTimeout(2000);

  // Take full page screenshot
  await page.screenshot({ path: '/tmp/quiz_edit_screen_after.png', fullPage: true });
  console.log('Screenshot saved to /tmp/quiz_edit_screen_after.png');
  
  // Wait for bottom pill to be visible
  await page.waitForSelector('[style*="position: fixed"]', { timeout: 10000 });
  
  // Scroll to bottom to ensure the bottom pill is visible
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  
  // Take another screenshot focusing on the bottom
  await page.screenshot({ path: '/tmp/quiz_edit_bottom_pill.png', fullPage: false });
  console.log('Bottom pill screenshot saved to /tmp/quiz_edit_bottom_pill.png');
});
