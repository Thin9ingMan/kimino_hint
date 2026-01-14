/**
 * クイズ機能で発生する可能性のあるエラーの型定義とハンドラー
 */

export class QuizError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'QuizError';
  }
}

export class ProfileNotFoundError extends QuizError {
  constructor(userId: number) {
    super(
      'プロフィールが見つかりません',
      'PROFILE_NOT_FOUND',
      { userId }
    );
  }
}

export class FakeAnswersNotFoundError extends QuizError {
  constructor(eventId: number, userId: number) {
    super(
      'クイズの間違い選択肢が作成されていません',
      'FAKE_ANSWERS_NOT_FOUND',
      { eventId, userId }
    );
  }
}

export class LLMGenerationError extends QuizError {
  constructor(originalError: Error) {
    super(
      'AIによる名前生成に失敗しました',
      'LLM_GENERATION_FAILED',
      { originalError: originalError.message }
    );
  }
}

export class QuizSaveError extends QuizError {
  constructor(originalError: Error) {
    super(
      'クイズの保存に失敗しました',
      'QUIZ_SAVE_FAILED',
      { originalError: originalError.message }
    );
  }
}

export class InvalidQuizDataError extends QuizError {
  constructor(reason: string) {
    super(
      `クイズデータが不正です: ${reason}`,
      'INVALID_QUIZ_DATA',
      { reason }
    );
  }
}

/**
 * エラーハンドリングのユーティリティ関数
 */
export function handleQuizError(error: unknown): QuizError {
  // Already a QuizError
  if (error instanceof QuizError) {
    return error;
  }

  // Network error
  if (error instanceof Error && error.message.includes('fetch')) {
    return new QuizError(
      'ネットワークエラーが発生しました',
      'NETWORK_ERROR',
      { originalError: error.message }
    );
  }

  // API error with response
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as any;
    const status = apiError.response?.status;

    switch (status) {
      case 401:
        return new QuizError(
          '認証エラーです。再度ログインしてください',
          'AUTH_ERROR',
          { status }
        );
      case 404:
        return new QuizError(
          'データが見つかりません',
          'NOT_FOUND',
          { status }
        );
      case 500:
        return new QuizError(
          'サーバーエラーが発生しました',
          'SERVER_ERROR',
          { status }
        );
      default:
        return new QuizError(
          'APIエラーが発生しました',
          'API_ERROR',
          { status, error: apiError }
        );
    }
  }

  // Unknown error
  return new QuizError(
    error instanceof Error ? error.message : '不明なエラーが発生しました',
    'UNKNOWN_ERROR',
    { error }
  );
}

/**
 * エラーメッセージを日本語に変換
 */
export function getErrorMessage(error: QuizError): string {
  switch (error.code) {
    case 'PROFILE_NOT_FOUND':
      return 'プロフィール情報が見つかりません。プロフィールを作成してください。';
    
    case 'FAKE_ANSWERS_NOT_FOUND':
      return 'このユーザーはまだクイズを作成していません。';
    
    case 'LLM_GENERATION_FAILED':
      return 'AIによる名前生成に失敗しました。手動で入力してください。';
    
    case 'QUIZ_SAVE_FAILED':
      return 'クイズの保存に失敗しました。もう一度お試しください。';
    
    case 'INVALID_QUIZ_DATA':
      return `クイズデータが不正です: ${error.details?.reason || ''}`;
    
    case 'NETWORK_ERROR':
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    
    case 'AUTH_ERROR':
      return '認証エラーです。ページを再読み込みしてください。';
    
    case 'NOT_FOUND':
      return 'データが見つかりません。';
    
    case 'SERVER_ERROR':
      return 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
    
    default:
      return error.message || '不明なエラーが発生しました。';
  }
}

/**
 * エラーに応じたアクションを決定
 */
export function getErrorAction(error: QuizError): {
  canRetry: boolean;
  redirectTo?: string;
  showDetails: boolean;
} {
  switch (error.code) {
    case 'PROFILE_NOT_FOUND':
      return {
        canRetry: false,
        redirectTo: '/me/profile/edit',
        showDetails: false,
      };
    
    case 'FAKE_ANSWERS_NOT_FOUND':
      return {
        canRetry: false,
        showDetails: false,
      };
    
    case 'LLM_GENERATION_FAILED':
      return {
        canRetry: true,
        showDetails: true,
      };
    
    case 'QUIZ_SAVE_FAILED':
      return {
        canRetry: true,
        showDetails: true,
      };
    
    case 'NETWORK_ERROR':
      return {
        canRetry: true,
        showDetails: false,
      };
    
    case 'AUTH_ERROR':
      return {
        canRetry: false,
        redirectTo: '/error/auth',
        showDetails: false,
      };
    
    default:
      return {
        canRetry: true,
        showDetails: import.meta.env.DEV,
      };
  }
}
