/**
 * Quiz types for the quiz feature.
 * Quizzes are stored in EventUserData.userData as part of the event metadata.
 */

/**
 * A single quiz question with 4 choices.
 * The correct answer position is randomized on the server side.
 */
export interface QuizQuestion {
  /** The question text */
  question: string;
  /** 4 answer choices (order is already randomized) */
  choices: [string, string, string, string];
  /** Index of the correct answer in the choices array (0-3) */
  correctIndex: number;
}

/**
 * A complete quiz for one participant.
 * Each participant creates their own quiz for others to answer.
 */
export interface Quiz {
  /** Array of quiz questions */
  questions: QuizQuestion[];
  /** When this quiz was created/last updated */
  updatedAt?: string;
}

/**
 * Quiz answer from a participant
 */
export interface QuizAnswer {
  /** Which question this answers (0-based index) */
  questionIndex: number;
  /** Which choice was selected (0-3) */
  selectedIndex: number;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** When this answer was submitted */
  answeredAt: string;
}

/**
 * Quiz result for one participant answering another participant's quiz
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
