import type { Quiz, QuizQuestion, QuizChoice } from "../types";
import type { UserProfile } from "@yuki-js/quarkus-crud-js-fetch-client";

interface FakeAnswers {
  username?: string[];
  hobby?: string[];
  artist?: string[];
  verySimilarUsername?: string[];
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Ensure we have exactly 4 unique choices as QuizChoice objects
 */
function ensureFourChoices(
  correctAnswer: string,
  fakeChoices: string[],
  fallbackPrefix: string
): QuizChoice[] {
  const choiceTexts = [correctAnswer];
  
  // Add fake choices, filtering out duplicates and empty strings
  for (const fake of fakeChoices) {
    if (fake && fake.trim() && fake !== correctAnswer && !choiceTexts.includes(fake)) {
      choiceTexts.push(fake);
      if (choiceTexts.length >= 4) break;
    }
  }
  
  // Fill remaining slots with generated choices
  let counter = 1;
  while (choiceTexts.length < 4) {
    const generated = `${fallbackPrefix}${counter}`;
    if (!choiceTexts.includes(generated)) {
      choiceTexts.push(generated);
    }
    counter++;
  }
  
  // Map to QuizChoice objects with unique IDs and direct correctness
  return choiceTexts.map(text => ({
    id: crypto.randomUUID(),
    text: text,
    isCorrect: text === correctAnswer,
  }));
}

/**
 * Generate quiz questions from profile data and fake answers
 * Updated to support the new robust ID-based format.
 */
export function generateQuizFromProfileAndFakes(
  profile: UserProfile,
  fakeAnswers: FakeAnswers
): Quiz {
  const profileData = profile.profileData || {};
  const questions: QuizQuestion[] = [];

  const addQuestion = (title: string, correctValue: string, fakes: string[], fallback: string) => {
    const choices = ensureFourChoices(correctValue, fakes, fallback);
    const shuffledChoices = shuffleArray(choices);
    
    questions.push({
      id: crypto.randomUUID(),
      question: title,
      choices: shuffledChoices,
    });
  };

  // Question 1: Name
  if (profileData.displayName && fakeAnswers.username) {
    addQuestion("名前は何でしょう？", profileData.displayName as string, fakeAnswers.username, "ユーザー");
  }

  // Question 2: Faculty
  if (profileData.faculty) {
    const fakeFaculties = ["工学部", "理学部", "文学部", "経済学部", "医学部", "法学部"];
    addQuestion("学部は何でしょう？", profileData.faculty as string, fakeFaculties.filter(f => f !== profileData.faculty), "その他学部");
  }

  // Question 3: Grade
  if (profileData.grade) {
    const fakeGrades = ["1年生", "2年生", "3年生", "4年生", "5年生", "6年生"];
    addQuestion("学年は何でしょう？", profileData.grade as string, fakeGrades.filter(g => g !== profileData.grade), "その他");
  }

  // Question 4: Hobby
  if (profileData.hobby && fakeAnswers.hobby) {
    addQuestion("趣味は何でしょう？", profileData.hobby as string, fakeAnswers.hobby, "趣味");
  }

  // Question 5: Name again
  if (profileData.displayName && fakeAnswers.verySimilarUsername) {
    addQuestion("改めて、名前は何でしょう？", profileData.displayName as string, fakeAnswers.verySimilarUsername, "名前");
  }

  // Question 6: Favorite Artist
  if (profileData.favoriteArtist && fakeAnswers.artist) {
    addQuestion("好きなアーティストは誰でしょう？", profileData.favoriteArtist as string, fakeAnswers.artist, "アーティスト");
  }

  return {
    questions,
    updatedAt: new Date().toISOString(),
  };
}
