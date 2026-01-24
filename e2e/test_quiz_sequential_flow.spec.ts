import { test, expect } from '@playwright/test';

test.describe('Quiz Sequential Flow', () => {
    test.setTimeout(120000); // Allow extra time for multi-user setup

    test('Quizzes are presented sequentially in join order', async ({ page, request }) => {
        
        // --- 1. Setup: Create 3 Users via API ---
        const users = [];
        for (const name of ['Host', 'Participant1', 'Participant2']) {
            const authRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest');
            const token = authRes.headers()['authorization'];
            
            // Set Profile
            await request.put('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
                headers: { 'Authorization': token },
                data: { profileData: { 
                    displayName: `User ${name}`, 
                    hobby: `${name}'s Hobby`, 
                    favoriteArtist: `${name}'s Artist` 
                }}
            });
            users.push({ name, token });
        }

        const [userHost, userP1, userP2] = users;

        // --- 2. Host Creates Event ---
        const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
            headers: { 'Authorization': userHost.token },
            data: { meta: { name: "Sequential Quiz Event" } }
        });
        const eventData = await createEventRes.json();
        const eventId = eventData.id;
        const invitationCode = eventData.invitationCode;
        console.log(`Event ${eventId} created with code ${invitationCode}`);

        // --- 3. All Users Join in Order ---
        const userIds = [];
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            let myUserId;
            
            if (i === 0) {
                // Host is already joined (initiator)
                myUserId = eventData.initiatorId;
                console.log(`User ${user.name} is the host with ID=${myUserId}`);
            } else {
                // Other users join by code
                const joinRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
                    headers: { 'Authorization': user.token },
                    data: { invitationCode }
                });

                if (!joinRes.ok()) {
                    console.error(`User ${user.name} failed to join: ${joinRes.status()} ${await joinRes.text()}`);
                    throw new Error(`User ${user.name} failed to join`);
                }

                const attendee = await joinRes.json();
                myUserId = attendee.attendeeUserId || attendee.userId;
                console.log(`User ${user.name} joined as ID=${myUserId}`);
            }
            
            userIds.push(myUserId);

            // Create quiz for this user
            const quizRes = await request.put(`https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${myUserId}`, {
                headers: { 'Authorization': user.token },
                data: { 
                    userData: { 
                        myQuiz: {
                            questions: [
                                { 
                                    id: `q1-${user.name}`,
                                    question: `Who is User ${user.name}?`, 
                                    choices: [
                                        { id: `c1-${user.name}`, text: `User ${user.name}`, isCorrect: true },
                                        { id: `c2-${user.name}`, text: 'X', isCorrect: false },
                                        { id: `c3-${user.name}`, text: 'Y', isCorrect: false },
                                        { id: `c4-${user.name}`, text: 'Z', isCorrect: false }
                                    ]
                                }
                            ]
                        }
                    } 
                }
            });
            if (!quizRes.ok()) throw new Error(`Quiz creation failed for ${user.name}: ${quizRes.status()} ${await quizRes.text()}`);
        }

        // --- 4. Participant 2 Takes Quizzes in Sequential Flow (UI) ---
        // Login as Participant 2
        await page.goto('http://localhost:5173/');
        await page.evaluate((t) => {
            localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
        }, userP2.token);
        await page.goto(`http://localhost:5173/events/${eventId}`);
        
        // Wait for lobby to load
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // Click "クイズに挑戦" button
        await page.click('text=クイズに挑戦');
        
        // --- Expected: Sequential flow starts ---
        // Should start with Host's quiz (first participant)
        
        // Answer Host's quiz
        await expect(page.getByText('Who is User Host?')).toBeVisible();
        await page.click('button:has-text("User Host")');
        await expect(page.getByText('正解！')).toBeVisible();
        await page.click('button:has-text("結果を見る")');
        
        // Result screen should show
        await expect(page.getByText('結果')).toBeVisible();
        
        // Click "次のクイズへ" (should navigate to Participant 1's quiz)
        await expect(page.getByText('次のクイズへ')).toBeVisible();
        await page.click('text=次のクイズへ');
        
        // --- Second quiz: Participant 1 ---
        await expect(page.getByText('Who is User Participant1?')).toBeVisible();
        await page.click('button:has-text("User Participant1")');
        await expect(page.getByText('正解！')).toBeVisible();
        await page.click('button:has-text("結果を見る")');
        
        // Result screen
        await expect(page.getByText('結果')).toBeVisible();
        await page.click('text=次のクイズへ');
        
        // --- Third quiz: Own quiz (Participant 2) ---
        // Should see special screen instead of quiz
        await expect(page.getByText('あなたのクイズを出題しています')).toBeVisible();
        await expect(page.getByText('自身のクイズについてエピソードトークをしよう')).toBeVisible();
        await expect(page.getByText('次のクイズへ')).toBeVisible();
        
        // No quiz questions should be visible
        await expect(page.getByText('Who is User Participant2?')).not.toBeVisible();
        
        // Click next - should go to completion screen
        await page.click('text=次のクイズへ');
        
        // Wait for navigation
        await page.waitForTimeout(2000);
        
        // --- Completion screen ---
        await expect(page.getByText('すべてのクイズが完了しました')).toBeVisible();
        await expect(page.getByText('ロビーへ戻る')).toBeVisible();
        
        // Return to lobby
        await page.click('text=ロビーへ戻る');
        await expect(page).toHaveURL(`http://localhost:5173/events/${eventId}`);
        
        console.log('Sequential Quiz Flow verified successfully');
    });
});
