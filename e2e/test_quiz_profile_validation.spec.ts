import { test, expect } from '@playwright/test';

test.describe('Quiz Profile Validation', () => {
    
  test('Button disabled when attendees missing profile or quiz', async ({ page, request }) => {
    test.setTimeout(60000);
    
    // --- Setup: Create Event & Users via API ---

    // User A: Event Creator (Complete setup)
    const userA_res = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const tokenA = userA_res.headers()['authorization'];
    
    // Set Profile A
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
        headers: { 'Authorization': tokenA },
        data: { profileData: { displayName: "User A (Host)", hobby: "Testing", favoriteArtist: "TestArtist" } }
    });

    // Create Event (User A)
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
        headers: { 'Authorization': tokenA },
        data: { 
            meta: { name: "Validation Test Event", description: "Testing validation" }
        }
    });
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;

    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}`);

    // Join User A
    await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
        headers: { 'Authorization': tokenA },
        data: { invitationCode }
    });

    // Create Quiz for User A
    await request.put(`https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${eventData.initiatorId}`, {
        headers: { 'Authorization': tokenA },
        data: { 
            userData: { 
                myQuiz: {
                    questions: [
                        { 
                            id: 'q1',
                            question: 'Who am I?', 
                            choices: [
                                { id: 'c1', text: 'User A', isCorrect: true },
                                { id: 'c2', text: 'User B', isCorrect: false },
                                { id: 'c3', text: 'User C', isCorrect: false },
                                { id: 'c4', text: 'User D', isCorrect: false }
                            ]
                        }
                    ],
                    updatedAt: new Date().toISOString()
                }
            } 
        }
    });

    // --- User B: Joiner WITHOUT profile (should block quiz) ---
    const userB_res = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const tokenB = userB_res.headers()['authorization'];
    
    // Join but NO profile, NO quiz
    await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
        headers: { 'Authorization': tokenB },
        data: { invitationCode }
    });

    // --- Navigate as User A to lobby and check validation ---
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
        localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, tokenA);
    await page.reload();
    
    // Navigate to event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    
    // Wait for page to load
    await page.waitForSelector('h4:has-text("イベント情報")', { timeout: 10000 });
    
    // Check for warning banner
    await expect(page.locator('text=クイズを開始できません')).toBeVisible();
    await expect(page.locator('text=全員がプロフィールとクイズを作成してからクイズに挑戦できます')).toBeVisible();
    
    // Check that quiz challenge button is disabled
    const quizButton = page.locator('button:has-text("クイズに挑戦")');
    await expect(quizButton).toBeVisible();
    await expect(quizButton).toBeDisabled();
    
    console.log('✓ Quiz button correctly disabled when User B has no profile/quiz');

    // --- Now add profile for User B (still no quiz) ---
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
        headers: { 'Authorization': tokenB },
        data: { profileData: { displayName: "User B (Joiner)", hobby: "Joining", favoriteArtist: "JoinArtist" } }
    });
    
    // Reload to see updated state
    await page.reload();
    await page.waitForSelector('h4:has-text("イベント情報")', { timeout: 10000 });
    
    // Should still show warning (User B has no quiz)
    await expect(page.locator('text=クイズを開始できません')).toBeVisible();
    await expect(page.locator('text=クイズ未作成')).toBeVisible();
    await expect(quizButton).toBeDisabled();
    
    console.log('✓ Quiz button still disabled when User B has profile but no quiz');

    // --- Add quiz for User B ---
    const userBDataRes = await request.get(`https://quarkus-crud.ouchiserver.aokiapp.com/api/me`, {
        headers: { 'Authorization': tokenB }
    });
    const userBData = await userBDataRes.json();
    const userBId = userBData.id;

    await request.put(`https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${userBId}`, {
        headers: { 'Authorization': tokenB },
        data: { 
            userData: { 
                myQuiz: {
                    questions: [
                        { 
                            id: 'q1',
                            question: 'What do I like?', 
                            choices: [
                                { id: 'c1', text: 'Joining', isCorrect: true },
                                { id: 'c2', text: 'Leaving', isCorrect: false },
                                { id: 'c3', text: 'Coding', isCorrect: false },
                                { id: 'c4', text: 'Testing', isCorrect: false }
                            ]
                        }
                    ]
                }
            } 
        }
    });
    
    // Reload to see updated state
    await page.reload();
    await page.waitForSelector('h4:has-text("イベント情報")', { timeout: 10000 });
    
    // Now warning should be gone and button enabled (becomes a link)
    await expect(page.locator('text=クイズを開始できません')).not.toBeVisible();
    
    // Button should now be a clickable link (not disabled)
    const quizLink = page.locator('text=クイズに挑戦').first();
    await expect(quizLink).toBeVisible();
    // Check that it's a link and not disabled
    const isDisabled = await quizLink.evaluate((el) => {
        return el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
    });
    expect(isDisabled).toBe(false);
    
    console.log('✓ Quiz button enabled when all users have profile and quiz');
  });
});
