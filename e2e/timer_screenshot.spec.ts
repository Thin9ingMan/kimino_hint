import { test, expect } from "@playwright/test";
import * as fs from "fs";

test("Capture Quiz Timer Screenshots", async ({ page, request }) => {
  test.setTimeout(120000);

  // Create guest users and event
  const userA_res = await request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest"
  );
  const tokenA = userA_res.headers()["authorization"];

  // Set User A's profile
  await request.put(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
    {
      headers: { Authorization: tokenA },
      data: {
        profileData: {
          displayName: "Quiz Creator",
          hobby: "Testing",
          favoriteArtist: "Artist",
        },
      },
    }
  );

  // Create Event
  const createEventRes = await request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/events",
    {
      headers: { Authorization: tokenA },
      data: {
        meta: {
          name: "Screenshot Test Event",
          description: "For timer screenshots",
        },
      },
    }
  );
  const eventData = await createEventRes.json();
  const eventId = eventData.id;
  const initiatorId = eventData.initiatorId;

  // Create Quiz
  await request.put(
    `https://quarkus-crud.ouchiserver.aokiapp.com/api/events/${eventId}/users/${initiatorId}`,
    {
      headers: { Authorization: tokenA },
      data: {
        userData: {
          myQuiz: {
            questions: [
              {
                id: "q1",
                question: "What is the capital of France?",
                explanation: "Paris is the capital and most populous city of France.",
                choices: [
                  { id: "c1", text: "Paris", isCorrect: true },
                  { id: "c2", text: "Lyon", isCorrect: false },
                  { id: "c3", text: "Marseille", isCorrect: false },
                  { id: "c4", text: "Bordeaux", isCorrect: false },
                ],
              },
              {
                id: "q2",
                question: "What is 2 + 2?",
                explanation: "Basic arithmetic: 2 + 2 = 4",
                choices: [
                  { id: "c5", text: "3", isCorrect: false },
                  { id: "c6", text: "4", isCorrect: true },
                  { id: "c7", text: "5", isCorrect: false },
                  { id: "c8", text: "6", isCorrect: false },
                ],
              },
            ],
            updatedAt: new Date().toISOString(),
          },
        },
      },
    }
  );

  // Create User B and log in
  const userB_res = await request.post(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/auth/guest"
  );
  const tokenB = userB_res.headers()["authorization"];

  await request.put(
    "https://quarkus-crud.ouchiserver.aokiapp.com/api/me/profile",
    {
      headers: { Authorization: tokenB },
      data: {
        profileData: {
          displayName: "Quiz Taker",
          hobby: "Answering",
          favoriteArtist: "Music",
        },
      },
    }
  );

  // Navigate to quiz
  await page.goto("http://localhost:5173/");
  await page.evaluate((t) => {
    localStorage.setItem("jwtToken", t.replace("Bearer ", ""));
  }, tokenB);
  
  // Navigate to the quiz question
  console.log(`Navigating to quiz: /events/${eventId}/quiz/challenge/${initiatorId}/1`);
  await page.goto(
    `http://localhost:5173/events/${eventId}/quiz/challenge/${initiatorId}/1`,
    { waitUntil: "networkidle" }
  );

  // Wait for question to load
  await page.waitForSelector('[data-testid="quiz-timer"]', { timeout: 15000 });
  console.log("Timer element found!");

  // Take screenshot at start (should be blue, ~10 seconds)
  await page.waitForTimeout(500);
  const startScreenshot = await page.screenshot();
  fs.writeFileSync("/tmp/timer-start.png", startScreenshot);
  console.log("Screenshot 1: Timer at start saved to /tmp/timer-start.png");

  // Wait until timer shows ~5-6 seconds (orange color)
  let timerText = "";
  let attempts = 0;
  while (attempts < 10) {
    timerText = await page.locator('[data-testid="quiz-timer"]').textContent();
    const timeValue = parseInt(timerText || "0", 10);
    console.log(`Timer: ${timerText} seconds`);
    
    if (timeValue >= 4 && timeValue <= 6) {
      break;
    }
    await page.waitForTimeout(300);
    attempts++;
  }

  // Take screenshot when timer is in orange zone (5-6 seconds)
  await page.waitForTimeout(200);
  const countdownScreenshot = await page.screenshot();
  fs.writeFileSync("/tmp/timer-countdown.png", countdownScreenshot);
  console.log("Screenshot 2: Timer counting down saved to /tmp/timer-countdown.png");

  console.log("✓ Screenshots captured successfully!");
});
