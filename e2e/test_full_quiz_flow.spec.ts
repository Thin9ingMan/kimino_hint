import { test, expect } from '@playwright/test';
import { apis } from '../app/shared/api';

test.describe('Full User Journey', () => {
    
  test('User can Join, Create Quiz, and Answer', async ({ page, request }) => {
    test.setTimeout(60000);
    // --- 0. Setup: Create Event & 2 Users via API ---

    // User A: Event Creator
    const userA_res = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const tokenA = userA_res.headers()['authorization'];
    
    // Set Profile A
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
        headers: { 'Authorization': tokenA },
        data: { profileData: { displayName: "User A (Host)", hobby: "Hosting", favoriteArtist: "HostArtist" } }
    });


    // Create Event (User A)
    const eventParams = {
        meta: { name: "Full Flow Event", description: "Testing everything" },
        invitationCode: "FULL-FLOW-123" // Try requesting specific code
    };
    // Note: API might generate its own code. Let's create normally and capture it.

    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
        headers: { 'Authorization': tokenA },
        data: eventParams
    });
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;

    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}`);

    // User A is creator and automatically joined - no need to join again


    
    // Create Quiz for User A (So User B can answer it)
    await request.put(`https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${eventData.initiatorId}`, {
        headers: { 'Authorization': tokenA },
        data: { 
            userData: { 
                myQuiz: {
                    questions: [
                        { 
                            question: 'Who am I?', 
                            choices: ['User A', 'X', 'Y', 'Z'], 
                            correctIndex: 0 
                        }
                    ]
                }
            } 
        }
    });



    // --- 1. User B (The Tester) Flow ---
    
    // User B: Joiner
    const userB_res = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const tokenB = userB_res.headers()['authorization'];
    
    // Set Profile B
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
        headers: { 'Authorization': tokenB },
        data: { profileData: { displayName: "User B (Joiner)", hobby: "Joining", favoriteArtist: "JoinArtist" } }
    });


    // Login as User B
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
        localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, tokenB);
    await page.reload();

    // A. Join by Code
    await page.goto('http://localhost:5173/events/join');
    await page.getByLabel('招待コード').fill(invitationCode);
    // await page.fill('input[placeholder="QUIZ-2025-01"]', invitationCode);

    await page.click('button:has-text("参加する")');
    
    // Verify moved to Lobby
    await expect(page).toHaveURL(/.*\/events\/\d+/);
    // Wait for list to load
    await page.waitForTimeout(2000); 
    
    const hasName = await page.getByText('User B (Joiner)').isVisible();
    const hasFallback = await page.getByText('ユーザー', { exact: false }).isVisible();
    
    if (!hasName && !hasFallback) {
        console.log("Participants list seems empty or broken. Page text:", await page.innerText('body'));
    }
    
    // Expect at least one of them
    expect(hasName || hasFallback).toBeTruthy();
    
    // Warn if fallback
    if (hasFallback && !hasName) console.log("Warning: User B found but as fallback ID only.");


    // B. Create My Quiz
    await page.click('text=自分のクイズを編集');
    
    // Fill Quiz Form
    // Assuming pre-filled from profile mostly, but let's check inputs
    await expect(page.getByText('クイズを作成')).toBeVisible();
    
    // Click Create
    await page.click('a[href*="/quiz/edit"]'); // Try selecting by href if text is ambiguous or use the button
    // Actually the button was click 'button:has-text("クイズを作成")' 
    // but it wrapped in Link component. Playwright handles it.
    
    // Verify moved to Edit Screen
    await expect(page).toHaveURL(/.*\/quiz\/edit/);

    if (await page.getByText('プロフィール情報不足').isVisible()) {
        console.error("Test blocked: Profile information missing on Edit screen.");
    }
    
    // Wait for auto-generation (LLM) to populate at least one field
    // It triggers on mount, so we just wait for non-empty
    // Check the correct answer inputs - they should be pre-filled with profile data
    const correctAnswerInputs = page.getByPlaceholder('正解のテキスト...');
    await expect(correctAnswerInputs.first()).toBeVisible();
    await expect(correctAnswerInputs.first()).not.toBeEmpty({ timeout: 20000 });

    // Fill wrong answers manually - need to fill ALL empty wrong answer fields
    const wrongAnswerInputs = page.getByPlaceholder('間違いの選択肢...');
    const count = await wrongAnswerInputs.count();
    console.log(`Found ${count} wrong answer inputs to fill`);
    for (let i = 0; i < count; i++) {
        await wrongAnswerInputs.nth(i).fill(`Wrong ${i + 1}`);
    }

    // Click Save
    await page.click('text=保存して完了');



    
    
    // Verify returned to Lobby
    await expect(page.getByText('イベント情報')).toBeVisible({ timeout: 10000 });




    // C. Answer Quiz (User A's quiz)
    await page.click('text=クイズに挑戦');
    
    // List of challengers
    // User A should be listed
    await expect(page.getByText('User A (Host)')).toBeVisible();
    
    // Click the Start button for User A's quiz
    await page.locator('.mantine-Card-root', { hasText: 'User A (Host)' }).getByText('開始').click();
    
    // Answer Question
    await expect(page.getByText('Who am I?')).toBeVisible();
    await page.click('button:has-text("User A")'); // Correct answer
    
    // Result Screen
    await expect(page.getByText('正解！')).toBeVisible();
    
    await page.click('text=一覧へ戻る');
    await expect(page).toHaveURL(/.*\/quiz\/challenges/);

    console.log('Full User Journey verified successfully');

  });
});
