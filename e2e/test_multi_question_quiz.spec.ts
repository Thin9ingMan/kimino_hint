import { test, expect } from '@playwright/test';

/**
 * Test for the bug: "一問目以降のクイズが解けない"
 * This test reproduces the issue where after answering the first question,
 * subsequent questions immediately show as "incorrect" without user selection.
 */
test.describe('Multi-Question Quiz Flow', () => {
  test('User can answer multiple questions sequentially without state persistence bug', async ({ page, request }) => {
    test.setTimeout(90000);

    // --- Setup: Create 2 Users and Event with Multi-Question Quiz ---
    
    // User A: Quiz Creator
    const userA_res = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const tokenA = userA_res.headers()['authorization'];
    
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': tokenA },
      data: { 
        profileData: { 
          displayName: "Quiz Creator", 
          hobby: "Testing", 
          favoriteArtist: "Test Artist" 
        }
      }
    });

    // Create Event
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': tokenA },
      data: { 
        eventCreateRequest: { 
          meta: { 
            name: "Multi Question Test Event",
            description: "Testing sequential quiz questions" 
          } 
        } 
      }
    });
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;
    const creatorUserId = eventData.initiatorId;

    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}, CreatorID=${creatorUserId}`);

    // User A joins the event
    await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
      headers: { 'Authorization': tokenA },
      data: { invitationCode }
    });

    // Create a quiz with 3 questions for User A
    const multiQuestionQuiz = {
      questions: [
        {
          id: "q1",
          question: "私の名前はどれ？",
          choices: [
            { id: "q1_c1", text: "Quiz Creator", isCorrect: true },
            { id: "q1_c2", text: "Wrong Name 1", isCorrect: false },
            { id: "q1_c3", text: "Wrong Name 2", isCorrect: false },
            { id: "q1_c4", text: "Wrong Name 3", isCorrect: false }
          ],
          explanation: "正解は「Quiz Creator」です。"
        },
        {
          id: "q2",
          question: "私の趣味はどれ？",
          choices: [
            { id: "q2_c1", text: "Testing", isCorrect: true },
            { id: "q2_c2", text: "Wrong Hobby 1", isCorrect: false },
            { id: "q2_c3", text: "Wrong Hobby 2", isCorrect: false },
            { id: "q2_c4", text: "Wrong Hobby 3", isCorrect: false }
          ],
          explanation: "正解は「Testing」です。"
        },
        {
          id: "q3",
          question: "私の好きなアーティストはどれ？",
          choices: [
            { id: "q3_c1", text: "Test Artist", isCorrect: true },
            { id: "q3_c2", text: "Wrong Artist 1", isCorrect: false },
            { id: "q3_c3", text: "Wrong Artist 2", isCorrect: false },
            { id: "q3_c4", text: "Wrong Artist 3", isCorrect: false }
          ],
          explanation: "正解は「Test Artist」です。"
        }
      ]
    };

    const quizRes = await request.put(`https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${creatorUserId}`, {
      headers: { 'Authorization': tokenA },
      data: { 
        userData: { 
          myQuiz: multiQuestionQuiz
        } 
      }
    });

    if (!quizRes.ok()) {
      throw new Error(`Quiz creation failed: ${quizRes.status()} ${await quizRes.text()}`);
    }

    console.log('Multi-question quiz created successfully');

    // --- User B: Quiz Taker ---
    const userB_res = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const tokenB = userB_res.headers()['authorization'];
    
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': tokenB },
      data: { 
        profileData: { 
          displayName: "Quiz Taker", 
          hobby: "Taking Tests", 
          favoriteArtist: "Taker Artist" 
        }
      }
    });

    // User B joins the event
    await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
      headers: { 'Authorization': tokenB },
      data: { invitationCode }
    });

    // --- User B UI Flow ---
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, tokenB);

    // Navigate to event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    await page.waitForTimeout(1000);

    // Click "クイズに挑戦"
    await page.click('text=クイズに挑戦');
    await page.waitForTimeout(1000);

    // Verify Quiz Creator is listed
    await expect(page.getByText('Quiz Creator')).toBeVisible({ timeout: 10000 });

    // Start the quiz
    await page.locator('.mantine-Paper-root', { hasText: 'Quiz Creator' }).getByText('開始').click();
    await page.waitForTimeout(1000);

    // --- Question 1: Answer correctly ---
    console.log('Answering Question 1...');
    await expect(page.getByText('私の名前はどれ？')).toBeVisible({ timeout: 10000 });
    
    // Initially, no result should be shown
    await expect(page.getByText('正解！')).not.toBeVisible();
    await expect(page.getByText('不正解')).not.toBeVisible();
    
    // Click the correct answer
    await page.click('button:has-text("Quiz Creator")');
    
    // Verify correct result is shown
    await expect(page.getByText('正解！')).toBeVisible({ timeout: 5000 });
    
    // Click "Next Question"
    await page.click('button:has-text("次の問題へ")');
    await page.waitForTimeout(1000);

    // --- Question 2: THIS IS WHERE THE BUG OCCURS ---
    console.log('Answering Question 2...');
    await expect(page.getByText('私の趣味はどれ？')).toBeVisible({ timeout: 10000 });
    
    // BUG: The result should NOT be shown immediately without user selecting an answer
    // If the bug exists, "不正解" will be visible immediately
    const isResultShownImmediately = await page.getByText('不正解').isVisible({ timeout: 1000 }).catch(() => false);
    
    if (isResultShownImmediately) {
      console.error('BUG REPRODUCED: "不正解" is shown immediately on Question 2 without user selection!');
      throw new Error('Bug reproduced: Result shown immediately on second question');
    }
    
    // Verify no result is shown yet
    await expect(page.getByText('正解！')).not.toBeVisible();
    await expect(page.getByText('不正解')).not.toBeVisible();
    
    // Click the correct answer
    await page.click('button:has-text("Testing")');
    
    // Verify correct result is shown
    await expect(page.getByText('正解！')).toBeVisible({ timeout: 5000 });
    
    // Click "Next Question"
    await page.click('button:has-text("次の問題へ")');
    await page.waitForTimeout(1000);

    // --- Question 3: Verify it still works ---
    console.log('Answering Question 3...');
    await expect(page.getByText('私の好きなアーティストはどれ？')).toBeVisible({ timeout: 10000 });
    
    // Verify no result is shown yet
    await expect(page.getByText('正解！')).not.toBeVisible();
    await expect(page.getByText('不正解')).not.toBeVisible();
    
    // Click the correct answer
    await page.click('button:has-text("Test Artist")');
    
    // Verify correct result is shown
    await expect(page.getByText('正解！')).toBeVisible({ timeout: 5000 });
    
    // Click "結果を見る" (last question)
    await page.click('button:has-text("結果を見る")');
    await page.waitForTimeout(1000);

    // --- Verify Result Screen ---
    await expect(page.getByText('結果')).toBeVisible({ timeout: 10000 });
    
    // Verify score is 3/3
    await expect(page.locator('text=/3.*3/').or(page.getByText('3 / 3'))).toBeVisible({ timeout: 5000 });

    console.log('Multi-question quiz flow completed successfully - Bug NOT reproduced (test passed)');
  });
});
