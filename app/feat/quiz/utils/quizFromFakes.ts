import type { Quiz, QuizQuestion } from "../types";
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
 * Generate quiz questions from profile data and fake answers
 * This matches the legacy behavior where fake answers are pre-generated
 */
export function generateQuizFromProfileAndFakes(
  profile: UserProfile,
  fakeAnswers: FakeAnswers
): Quiz {
  const profileData = profile.profileData || {};
  const questions: QuizQuestion[] = [];

  // Question 1: Name (with completely different fake names)
  if (profileData.displayName && fakeAnswers.username) {
    const correctAnswer = profileData.displayName as string;
    const fakes = fakeAnswers.username.slice(0, 3);
    const allChoices = [correctAnswer, ...fakes];
    
    while (allChoices.length < 4) {
      allChoices.push(`ユーザー${Math.floor(Math.random() * 100)}`);
    }
    
    const shuffled = shuffleArray(allChoices.slice(0, 4)) as [string, string, string, string];
    const correctIndex = shuffled.indexOf(correctAnswer);

    questions.push({
      question: "名前は何でしょう？",
      choices: shuffled,
      correctIndex,
    });
  }

  // Question 2: Faculty (if exists in profile)
  if (profileData.faculty) {
    const correctAnswer = profileData.faculty as string;
    const fakeFaculties = ["工学部", "理学部", "文学部", "経済学部"];
    const filtered = fakeFaculties.filter((f) => f !== correctAnswer);
    const allChoices = [correctAnswer, ...filtered.slice(0, 3)];
    
    while (allChoices.length < 4) {
      allChoices.push(`学部${Math.floor(Math.random() * 100)}`);
    }
    
    const shuffled = shuffleArray(allChoices.slice(0, 4)) as [string, string, string, string];
    const correctIndex = shuffled.indexOf(correctAnswer);

    questions.push({
      question: "学部は何でしょう？",
      choices: shuffled,
      correctIndex,
    });
  }

  // Question 3: Grade (if exists in profile)
  if (profileData.grade) {
    const correctAnswer = profileData.grade as string;
    const fakeGrades = ["1年生", "2年生", "3年生", "4年生"];
    const filtered = fakeGrades.filter((g) => g !== correctAnswer);
    const allChoices = [correctAnswer, ...filtered.slice(0, 3)];
    
    while (allChoices.length < 4) {
      allChoices.push(`${Math.floor(Math.random() * 6) + 1}年生`);
    }
    
    const shuffled = shuffleArray(allChoices.slice(0, 4)) as [string, string, string, string];
    const correctIndex = shuffled.indexOf(correctAnswer);

    questions.push({
      question: "学年は何でしょう？",
      choices: shuffled,
      correctIndex,
    });
  }

  // Question 4: Hobby
  if (profileData.hobby && fakeAnswers.hobby) {
    const correctAnswer = profileData.hobby as string;
    const fakes = fakeAnswers.hobby.slice(0, 3);
    const allChoices = [correctAnswer, ...fakes];
    
    while (allChoices.length < 4) {
      allChoices.push(`趣味${Math.floor(Math.random() * 100)}`);
    }
    
    const shuffled = shuffleArray(allChoices.slice(0, 4)) as [string, string, string, string];
    const correctIndex = shuffled.indexOf(correctAnswer);

    questions.push({
      question: "趣味は何でしょう？",
      choices: shuffled,
      correctIndex,
    });
  }

  // Question 5: Name again (with very similar fake names)
  if (profileData.displayName && fakeAnswers.verySimilarUsername) {
    const correctAnswer = profileData.displayName as string;
    const fakes = fakeAnswers.verySimilarUsername.slice(0, 3);
    const allChoices = [correctAnswer, ...fakes];
    
    while (allChoices.length < 4) {
      allChoices.push(`${correctAnswer.substring(0, 1)}${Math.floor(Math.random() * 10)}`);
    }
    
    const shuffled = shuffleArray(allChoices.slice(0, 4)) as [string, string, string, string];
    const correctIndex = shuffled.indexOf(correctAnswer);

    questions.push({
      question: "改めて、名前は何でしょう？",
      choices: shuffled,
      correctIndex,
    });
  }

  // Question 6: Favorite Artist
  if (profileData.favoriteArtist && fakeAnswers.artist) {
    const correctAnswer = profileData.favoriteArtist as string;
    const fakes = fakeAnswers.artist.slice(0, 3);
    const allChoices = [correctAnswer, ...fakes];
    
    while (allChoices.length < 4) {
      allChoices.push(`アーティスト${Math.floor(Math.random() * 100)}`);
    }
    
    const shuffled = shuffleArray(allChoices.slice(0, 4)) as [string, string, string, string];
    const correctIndex = shuffled.indexOf(correctAnswer);

    questions.push({
      question: "好きなアーティストは誰でしょう？",
      choices: shuffled,
      correctIndex,
    });
  }

  return {
    questions,
    updatedAt: new Date().toISOString(),
  };
}
