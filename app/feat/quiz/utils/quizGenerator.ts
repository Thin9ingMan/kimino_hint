import type { Quiz, QuizQuestion, QuizChoice } from "../types";
import type { UserProfile } from "@yuki-js/quarkus-crud-js-fetch-client";
import { shuffleArray } from "./shuffle";

/**
 * Generate a quiz from a user's profile data
 * This creates questions based on the profile information
 */
export function generateQuizFromProfile(profile: UserProfile): Quiz {
  const profileData = profile.profileData || {};
  const questions: QuizQuestion[] = [];

  const addQuestion = (title: string, correctValue: string, fakes: string[], fallback: string) => {
    const choiceTexts = [correctValue];
    const filtered = fakes.filter(f => f !== correctValue);
    choiceTexts.push(...filtered.slice(0, 3));
    
    while (choiceTexts.length < 4) {
      choiceTexts.push(`${fallback}${Math.floor(Math.random() * 100)}`);
    }

    const choices: QuizChoice[] = choiceTexts.map(text => ({
      id: crypto.randomUUID(),
      text: text,
      isCorrect: text === correctValue,
    }));
    
    const shuffledChoices = shuffleArray(choices);

    questions.push({
      id: crypto.randomUUID(),
      question: title,
      choices: shuffledChoices,
    });
  };

  // Question 1: Name
  if (profileData.displayName) {
    addQuestion(
      "この人の名前は何でしょう？",
      profileData.displayName as string,
      ["田中 太郎", "鈴木 花子", "佐藤 健", "高橋 美咲"],
      "ユーザー"
    );
  }

  // Question 2: Hobby
  if (profileData.hobby) {
    addQuestion(
      "趣味は何でしょう？",
      profileData.hobby as string,
      ["読書", "サッカー", "料理", "音楽鑑賞"],
      "趣味"
    );
  }

  // Question 3: Favorite Artist
  if (profileData.favoriteArtist) {
    addQuestion(
      "好きなアーティストは誰でしょう？",
      profileData.favoriteArtist as string,
      ["YOASOBI", "ヨルシカ", "米津玄師", "あいみょん"],
      "アーティスト"
    );
  }

  // Question 4: Grade
  if (profileData.grade) {
    addQuestion(
      "学年は何でしょう？",
      profileData.grade as string,
      ["1年生", "2年生", "3年生", "4年生"],
      "年生"
    );
  }

  // Question 5: Faculty
  if (profileData.faculty) {
    addQuestion(
      "学部は何でしょう？",
      profileData.faculty as string,
      ["工学部", "理学部", "文学部", "経済学部"],
      "学部"
    );
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
  answers: { questionId: string, selectedChoiceId: string }[],
  quiz: Quiz
): number {
  let score = 0;
  answers.forEach((answer) => {
    const question = quiz.questions.find(q => q.id === answer.questionId);
    if (question) {
      const selectedChoice = question.choices.find(c => c.id === answer.selectedChoiceId);
      if (selectedChoice?.isCorrect) {
        score++;
      }
    }
  });
  return score;
}
