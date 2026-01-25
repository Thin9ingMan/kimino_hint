import { test, expect } from '@playwright/test';

/**
 * Test for choice randomization bug: "正解選択肢が常に先頭に表示される"
 * 
 * This test verifies that when a quiz is created and saved, the choices are
 * shuffled so that the correct answer does not always appear first.
 * 
 * Steps:
 * 1. Create a user with a complete profile
 * 2. Create an event and join it
 * 3. Navigate to quiz edit screen
 * 4. Create a quiz with known choices
 * 5. Save the quiz
 * 6. Take another user and attempt the quiz
 * 7. Verify that at least some questions have the correct answer NOT in the first position
 */
test.describe('Choice Randomization Verification', () => {
  test('Quiz choices are randomized when saved', async ({ page, request }) => {
    test.setTimeout(120000);

    // --- Setup: Create User A (Quiz Creator) ---
    const userA_res = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const tokenA = userA_res.headers()['authorization'];
    
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': tokenA },
      data: { 
        profileData: { 
          displayName: "田中 太郎",
          faculty: "工学部",
          grade: "2年生",
          hobby: "読書",
          favoriteArtist: "米津玄師"
        }
      }
    });

    // Create Event
    const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
      headers: { 'Authorization': tokenA },
      data: { 
        meta: { 
          name: "Choice Randomization Test",
          description: "Testing choice order randomization" 
        } 
      }
    });
    const eventData = await createEventRes.json();
    const eventId = eventData.id;
    const invitationCode = eventData.invitationCode;
    const creatorUserId = eventData.initiatorId;

    console.log(`Event Created: ID=${eventId}, Code=${invitationCode}, CreatorID=${creatorUserId}`);

    // User A doesn't need to join - already joined as creator

    // --- User A: Create quiz ---
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, tokenA);

    // Navigate to event lobby
    await page.goto(`http://localhost:5173/events/${eventId}`);
    await page.waitForTimeout(1000);

    // Click "自分のクイズを編集"
    await page.click('text=自分のクイズを編集');
    await page.waitForTimeout(1000);

    // Click "クイズを作成" or "クイズを編集"
    await page.getByRole('link', { name: /クイズ(を作成|を編集)/ }).click();
    await page.waitForTimeout(2000);

    // Verify we're on the edit screen
    await expect(page).toHaveURL(new RegExp(`/events/${eventId}/quiz/edit`));
    await expect(page.getByText('クイズエディタ')).toBeVisible({ timeout: 10000 });

    // Click "誤答を生成" to auto-fill fake answers
    await page.click('text=誤答を生成');
    // Wait for LLM generation
    await page.waitForTimeout(5000); 

    // Save the quiz
    await page.click('text=保存して完了');
    await page.waitForURL(/.*\/events\/\d+$/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Verify return to lobby
    await expect(page).toHaveURL(new RegExp(`/events/${eventId}`));

    // --- Create User B (Quiz Taker) ---
    const userB_res = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
    const tokenB = userB_res.headers()['authorization'];
    
    await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
      headers: { 'Authorization': tokenB },
      data: { 
        profileData: { 
          displayName: "佐藤 花子",
          faculty: "理学部",
          grade: "1年生",
          hobby: "音楽",
          favoriteArtist: "YOASOBI"
        }
      }
    });

    // User B joins the event
    const joinRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
      headers: { 'Authorization': tokenB },
      data: { invitationCode }
    });
    const joinData = await joinRes.json();
    const userBId = joinData.attendeeUserId || joinData.userId;

    // User B needs to create a quiz too (required for quiz challenge to be enabled)
    await request.put(`https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${userBId}`, {
      headers: { 'Authorization': tokenB },
      data: { 
        userData: { 
          myQuiz: {
            questions: [
              { 
                question: "Who is User B?", 
                choices: ["佐藤 花子", "X", "Y", "Z"], 
                correctIndex: 0
              }
            ]
          }
        } 
      }
    });

    // User B needs a quiz too for allAttendeesReady to be true
    const userBDataRes = await request.get('https://quarkus-crud.ouchiserver.aokiapp.com/api/me', {
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
                id: "qb1",
                question: "User B Hobby?",
                choices: [
                  { id: "qb1_c1", text: "Taking Tests", isCorrect: true },
                  { id: "qb1_c2", text: "X", isCorrect: false },
                  { id: "qb1_c3", text: "Y", isCorrect: false },
                  { id: "qb1_c4", text: "Z", isCorrect: false }
                ]
              }
            ],
            updatedAt: new Date().toISOString()
          }
        } 
      }
    });

    // --- User B: Take the quiz ---
    await page.goto('http://localhost:5173/');
    await page.evaluate((t) => {
      localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
    }, tokenB);

    // Navigate to event lobby and wait for everyone to be ready
    await page.goto(`http://localhost:5173/events/${eventId}`);
    
    // Wait for everyone to be ready (reload loop)
    let ready = false;
    for (let i = 0; i < 5; i++) {
        await page.reload();
        await page.waitForTimeout(2000);
        if (!(await page.getByText('クイズを開始できません').isVisible().catch(() => false))) {
            ready = true;
            break;
        }
        console.log(`Lobby not ready (attempt ${i + 1}), retrying...`);
    }

    // Click "クイズに挑戦" - this will start the sequential quiz flow
    await page.click('text=クイズに挑戦');
    await page.waitForTimeout(1000);

    // The quiz sequence screen will auto-navigate to the first quiz
    // Since User A joined first, User B will see User A's quiz first
    // Wait for navigation to quiz question screen
    await page.waitForURL(/.*\/quiz\/challenge\/.*/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Now we should be on the first question
    // Count how many questions have the correct answer NOT in the first position
    let nonFirstCorrectCount = 0;
    const totalQuestions = 6; // Expected number of questions

    for (let i = 0; i < totalQuestions; i++) {
      console.log(`\n--- Checking Question ${i + 1} ---`);
      
      // Wait for question to load
      await page.waitForTimeout(1000);

      // Get all choice buttons
      const choiceButtons = page.locator('button').filter({ hasText: /^(?!.*次の問題へ)(?!.*結果を見る)/ });
      const choiceCount = await choiceButtons.count();
      
      // Find buttons that look like choices (have substantial text)
      const choices: string[] = [];
      for (let j = 0; j < choiceCount; j++) {
        const btn = choiceButtons.nth(j);
        const text = await btn.textContent();
        if (text && text.length > 1 && !text.includes('次の問題へ') && !text.includes('結果を見る')) {
          choices.push(text.trim());
        }
      }

      console.log(`Found ${choices.length} choices:`, choices);

      // Click the first choice
      if (choices.length > 0) {
        await page.locator('button').filter({ hasText: choices[0] }).first().click();
        await page.waitForTimeout(1500);

        // Check if it was correct or incorrect
        const correctText = page.getByText('正解！');
        const incorrectText = page.getByText('不正解');
        
        const isCorrect = await correctText.isVisible().catch(() => false);
        const isIncorrect = await incorrectText.isVisible().catch(() => false);

        console.log(`First choice result: ${isCorrect ? 'CORRECT' : (isIncorrect ? 'INCORRECT' : 'UNKNOWN')}`);

        if (isIncorrect) {
          nonFirstCorrectCount++;
          console.log(`✓ Question ${i + 1}: Correct answer is NOT first (randomization working!)`);
        } else if (isCorrect) {
          console.log(`✗ Question ${i + 1}: Correct answer IS first`);
        }

        // Take a screenshot for debugging
        await page.screenshot({ path: `test-results/quiz_question_${i + 1}.png` });

        // Go to next question
        const nextButton = page.locator('button').filter({ hasText: /次の問題へ|結果を見る/ }).first();
        await nextButton.click();
        await page.waitForTimeout(1500);
      }
    }

    console.log(`\n=== RESULTS ===`);
    console.log(`Total questions: ${totalQuestions}`);
    console.log(`Questions with correct answer NOT first: ${nonFirstCorrectCount}`);
    console.log(`Questions with correct answer first: ${totalQuestions - nonFirstCorrectCount}`);

    // Assert: At least SOME questions should have the correct answer NOT in the first position
    // With 6 questions and random shuffling, having ALL correct answers first would be extremely unlikely (1/4^6 = ~0.02%)
    // We expect at least 1-2 questions to have the correct answer not first
    expect(nonFirstCorrectCount).toBeGreaterThan(0);

    console.log('\n✓ Choice randomization test PASSED');
  });
});
