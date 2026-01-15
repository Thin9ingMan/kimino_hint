/**
 * Quiz types for the quiz feature.
 * Quizzes are stored in EventUserData.userData as part of the event metadata.
 */

/**
 * A single quiz choice.
 */
export interface QuizChoice {
  /** Unique identifier for the choice */
  id: string;
  /** The text displayed to the user */
  text: string;
  /** Whether this is a correct answer */
  isCorrect: boolean;
  /** Optional metadata for future extension (e.g., image URL, weight) */
  metadata?: Record<string, any>;
}

/**
 * A single quiz question.
 */
export interface QuizQuestion {
  /** Unique identifier for the question */
  id: string;
  /** The question text */
  question: string;
  /** List of choices */
  choices: QuizChoice[];
  /** Optional explanation shown after answering */
  explanation?: string;
  /** Optional metadata for categorization or AI generation context */
  metadata?: Record<string, any>;
}

/**
 * A complete quiz for one participant.
 */
export interface Quiz {
  /** Array of quiz questions */
  questions: QuizQuestion[];
  /** When this quiz was created/last updated */
  updatedAt?: string;
}

/**
 * Quiz answer from a participant.
 */
export interface QuizAnswer {
  /** ID of the question this answers */
  questionId: string;
  /** ID of the choice that was selected */
  selectedChoiceId: string;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** When this answer was submitted */
  answeredAt: string;
}

/**
 * Quiz result for one participant answering another participant's quiz.
 */
export interface QuizResult {
  /** ID of the quiz owner (whose quiz was answered) */
  quizOwnerId: number;
  /** ID of the participant who answered */
  participantId: number;
  /** Array of answers */
  answers: QuizAnswer[];
  /** Total score (number of correct answers) */
  score: number;
  /** Total number of questions */
  totalQuestions: number;
  /** When the quiz was completed */
  completedAt: string;
}

/**
 * Structure stored in EventUserData.userData
 */
export interface QuizUserData {
  /** The quiz created by this user for others to answer */
  myQuiz?: Quiz;
  /** Results from answering other participants' quizzes */
  results?: QuizResult[];
  /** Total score across all quizzes attempted */
  totalScore?: number;
  /** Badges earned */
  badges?: string[];
}
