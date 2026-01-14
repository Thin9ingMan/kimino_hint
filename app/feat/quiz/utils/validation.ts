/**
 * Validation utilities for quiz data
 */

import type { Quiz, QuizQuestion } from "../types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a single quiz question
 */
export function validateQuizQuestion(question: QuizQuestion): ValidationResult {
  const errors: string[] = [];

  // Validate question text
  if (!question.question || question.question.trim().length === 0) {
    errors.push("問題文が空です");
  }

  if (question.question && question.question.length > 200) {
    errors.push("問題文が長すぎます（最大200文字）");
  }

  // Validate choices
  if (!question.choices || !Array.isArray(question.choices)) {
    errors.push("選択肢が不正です");
  } else if (question.choices.length !== 4) {
    errors.push("選択肢は4つ必要です");
  } else {
    // Check for empty choices
    question.choices.forEach((choice, index) => {
      if (!choice || choice.trim().length === 0) {
        errors.push(`選択肢${index + 1}が空です`);
      }
      if (choice && choice.length > 100) {
        errors.push(`選択肢${index + 1}が長すぎます（最大100文字）`);
      }
    });

    // Check for duplicate choices
    const uniqueChoices = new Set(question.choices.map(c => c.trim()));
    if (uniqueChoices.size !== question.choices.length) {
      errors.push("選択肢に重複があります");
    }
  }

  // Validate correct index
  if (typeof question.correctIndex !== 'number') {
    errors.push("正解インデックスが不正です");
  } else if (question.correctIndex < 0 || question.correctIndex > 3) {
    errors.push("正解インデックスが範囲外です（0-3）");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an entire quiz
 */
export function validateQuiz(quiz: Quiz): ValidationResult {
  const errors: string[] = [];

  // Validate questions array
  if (!quiz.questions || !Array.isArray(quiz.questions)) {
    errors.push("問題リストが不正です");
    return { valid: false, errors };
  }

  if (quiz.questions.length === 0) {
    errors.push("問題が1つもありません");
  }

  if (quiz.questions.length > 10) {
    errors.push("問題が多すぎます（最大10問）");
  }

  // Validate each question
  quiz.questions.forEach((question, index) => {
    const result = validateQuizQuestion(question);
    if (!result.valid) {
      errors.push(`問題${index + 1}: ${result.errors.join(", ")}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate fake answers data
 */
export function validateFakeAnswers(fakeAnswers: any): ValidationResult {
  const errors: string[] = [];

  if (!fakeAnswers || typeof fakeAnswers !== 'object') {
    errors.push("間違い選択肢データが不正です");
    return { valid: false, errors };
  }

  // Validate username array
  if (!Array.isArray(fakeAnswers.username)) {
    errors.push("名前の間違い選択肢が配列ではありません");
  } else if (fakeAnswers.username.length < 3) {
    errors.push("名前の間違い選択肢は3つ必要です");
  } else {
    fakeAnswers.username.forEach((name: any, index: number) => {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push(`名前の選択肢${index + 1}が不正です`);
      }
    });
  }

  // Validate hobby array (optional)
  if (fakeAnswers.hobby) {
    if (!Array.isArray(fakeAnswers.hobby)) {
      errors.push("趣味の間違い選択肢が配列ではありません");
    } else if (fakeAnswers.hobby.length < 3) {
      errors.push("趣味の間違い選択肢は3つ必要です");
    }
  }

  // Validate artist array (optional)
  if (fakeAnswers.artist) {
    if (!Array.isArray(fakeAnswers.artist)) {
      errors.push("アーティストの間違い選択肢が配列ではありません");
    } else if (fakeAnswers.artist.length < 3) {
      errors.push("アーティストの間違い選択肢は3つ必要です");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize quiz before saving
 */
export function prepareQuizForSave(quiz: Quiz): { quiz: Quiz | null; errors: string[] } {
  const validation = validateQuiz(quiz);
  
  if (!validation.valid) {
    return { quiz: null, errors: validation.errors };
  }

  // Sanitize all text fields
  const sanitizedQuiz: Quiz = {
    ...quiz,
    questions: quiz.questions.map(q => ({
      ...q,
      question: sanitizeInput(q.question),
      choices: q.choices.map(c => sanitizeInput(c)) as [string, string, string, string],
    })),
  };

  return { quiz: sanitizedQuiz, errors: [] };
}

/**
 * Check if a quiz answer is correct
 */
export function isAnswerCorrect(
  question: QuizQuestion,
  selectedIndex: number
): boolean {
  return selectedIndex === question.correctIndex;
}

/**
 * Calculate quiz score
 */
export function calculateScore(
  questions: QuizQuestion[],
  answers: number[]
): {
  score: number;
  total: number;
  percentage: number;
  correct: boolean[];
} {
  const correct = questions.map((q, i) => isAnswerCorrect(q, answers[i]));
  const score = correct.filter(Boolean).length;
  const total = questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return { score, total, percentage, correct };
}

/**
 * Get performance rating based on percentage
 */
export function getPerformanceRating(percentage: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (percentage === 100) {
    return {
      label: "完璧です！",
      color: "green",
      emoji: "🎉",
    };
  } else if (percentage >= 80) {
    return {
      label: "素晴らしい！",
      color: "teal",
      emoji: "🌟",
    };
  } else if (percentage >= 60) {
    return {
      label: "良くできました！",
      color: "blue",
      emoji: "👏",
    };
  } else if (percentage >= 40) {
    return {
      label: "もう少し！",
      color: "yellow",
      emoji: "💪",
    };
  } else {
    return {
      label: "次回頑張りましょう！",
      color: "orange",
      emoji: "📚",
    };
  }
}
