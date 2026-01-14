import type { Quiz, QuizQuestion } from "../types";
import type { UserProfile } from "@yuki-js/quarkus-crud-js-fetch-client";

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
 * Generate a quiz from a user's profile data
 * This creates questions based on the profile information
 */
export function generateQuizFromProfile(profile: UserProfile): Quiz {
  const profileData = profile.profileData || {};
  const questions: QuizQuestion[] = [];

  // Question 1: Name/Display Name
  if (profileData.displayName) {
    const correctAnswer = profileData.displayName as string;
    const fakeNames = ["田中 太郎", "鈴木 花子", "佐藤 健", "高橋 美咲"];
    // Ensure we have exactly 3 fake names different from the correct answer
    const filtered = fakeNames.filter(name => name !== correctAnswer);
    const allChoices = [correctAnswer, ...filtered.slice(0, 3)];
    
    // Ensure we have exactly 4 choices
    while (allChoices.length < 4) {
      allChoices.push(`ユーザー${Math.floor(Math.random() * 100)}`);
    }
    
    const shuffled = shuffleArray(allChoices.slice(0, 4)) as [string, string, string, string];
    const correctIndex = shuffled.indexOf(correctAnswer);

    questions.push({
      question: "この人の名前は何でしょう？",
      choices: shuffled,
      correctIndex,
    });
  }

  // Question 2: Hobby
  if (profileData.hobby) {
    const correctAnswer = profileData.hobby as string;
    const fakeHobbies = ["読書", "サッカー", "料理", "音楽鑑賞"];
    const filtered = fakeHobbies.filter(hobby => hobby !== correctAnswer);
    const allChoices = [correctAnswer, ...filtered.slice(0, 3)];
    
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

  // Question 3: Favorite Artist
  if (profileData.favoriteArtist) {
    const correctAnswer = profileData.favoriteArtist as string;
    const fakeArtists = ["YOASOBI", "ヨルシカ", "米津玄師", "あいみょん"];
    const filtered = fakeArtists.filter(artist => artist !== correctAnswer);
    const allChoices = [correctAnswer, ...filtered.slice(0, 3)];
    
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

  // Question 4: Grade
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

  // Question 5: Faculty
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

  return {
    questions,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate quiz score
 */
export function calculateScore(
  answers: { selectedIndex: number }[],
  quiz: Quiz
): number {
  let score = 0;
  answers.forEach((answer, index) => {
    if (
      quiz.questions[index] &&
      answer.selectedIndex === quiz.questions[index].correctIndex
    ) {
      score++;
    }
  });
  return score;
}
