import { test, expect } from '@playwright/test';

test.describe('4 User Quiz Scenario', () => {
    test.setTimeout(120000); // Allow extra time for 4-user setup


    test('4 Users (A, B, C, D) can join and play', async ({ page, request }) => {


        // --- 1. Setup: Create 4 Users via API ---
        const users = [];
        for (const name of ['A', 'B', 'C', 'D']) {
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

        const [userA, userB, userC, userD] = users;

        // --- 2. User A Creates Event ---
        const createEventRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events', {
            headers: { 'Authorization': userA.token },
            data: { meta: { name: "4 User Party" } }
        });
        const eventData = await createEventRes.json();
        const eventId = eventData.id;
        const invitationCode = eventData.invitationCode;
        console.log(`Event ${eventId} created with code ${invitationCode}`);

        // --- 3. All Users Join & Create Quizzes (API) ---
        // We use API to speed up setup. User D will use UI later.
        
        for (const user of users) {
             // Join (ensure everyone is explicitly joined)
             // Try to join, but ignore "already joined" errors (409)
             let myUserId;
             const joinRes = await request.post('https://quarkus-crud.ouchiserver.aokiapp.com/api/events/join-by-code', {
                headers: { 'Authorization': user.token },
                data: { invitationCode }
            });

            if (joinRes.ok()) {
                const attendee = await joinRes.json();
                myUserId = attendee.attendeeUserId || attendee.userId;
                console.log(`User ${user.name} joined as ID=${myUserId}`);
            } else if (joinRes.status() === 409) {
                // Already joined (creator case)
                console.log(`User ${user.name} already joined (likely creator)`);
                // Get user ID from /me endpoint
                const meRes = await request.get('https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile', {
                    headers: { 'Authorization': user.token }
                });
                const meData = await meRes.json();
                myUserId = meData.userId;
                console.log(`User ${user.name} ID from profile: ${myUserId}`);
            } else {
                console.error(`User ${user.name} failed to join: ${joinRes.status()} ${await joinRes.text()}`);
                throw new Error(`User ${user.name} failed to join`);
            }

            const quizRes = await request.put(`https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${myUserId}`, {

                headers: { 'Authorization': user.token },
                data: { 
                    userData: { 
                        myQuiz: {
                            questions: [
                                { 
                                    question: `Who is User ${user.name}?`, 
                                    choices: [`User ${user.name}`, 'X', 'Y', 'Z'], 
                                    correctIndex: 0
                                }
                            ]
                        }
                    } 

                }
            });
            if (!quizRes.ok()) throw new Error(`Quiz creation failed for ${user.name}: ${quizRes.status()} ${await quizRes.text()}`);

        }

        // --- 4. User D Interaction (UI) ---
        // Login as User D
        await page.goto('http://localhost:5173/');
        await page.evaluate((t) => {
            localStorage.setItem('jwtToken', t.replace('Bearer ', ''));
        }, userD.token);
        // Direct nav to event (skipping join screen as we already joined via API)
        await page.goto(`http://localhost:5173/events/${eventId}`);
        
        // Verify Lobby has 4 participants
        // Wait for loading to finish
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // Verify all 4 users are displayed in the attendee list
        await expect(page.getByText('User A')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('User B')).toBeVisible();
        await expect(page.getByText('User C')).toBeVisible();
        await expect(page.getByText('User D')).toBeVisible();



        
        // Go to Quiz Sequence (starts first quiz automatically)
        await page.click('text=クイズに挑戦');
        
        // Wait for navigation to first quiz (User A's quiz since User A joined first)
        // The quiz sequence screen automatically navigates to the first quiz question
        await page.waitForURL(`**/quiz/challenge/**`, { timeout: 10000 });
        await page.waitForTimeout(1000);


        await expect(page.getByText('Who is User A?')).toBeVisible();
        await page.click('button:has-text("User A")'); 
        await expect(page.getByText('正解！')).toBeVisible();
        await page.click('button:has-text("結果を見る")');
        await expect(page.getByText('結果')).toBeVisible();

        // Get profile reward
        await page.click('text=プロフィールを取得');
        await expect(page.getByText('プロフィール取得')).toBeVisible();
        
        // Continue to next quiz
        await page.click('text=次のクイズへ');
        await page.waitForURL(`**/quiz/challenge/**`, { timeout: 10000 });
        
        // Now should be on User B's quiz (sequential flow)
        await expect(page.getByText('Who is User B?')).toBeVisible();
        await page.click('button:has-text("User B")');
        await expect(page.getByText('正解！')).toBeVisible();

    });
});
