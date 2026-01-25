# クイズ機能実装ガイド

## 概要

このドキュメントは、キミのヒントアプリケーションのクイズ機能の実装について説明します。

## アーキテクチャ

### データモデル

クイズデータは `EventUserData` の `userData` フィールドに保存されます。

```typescript
interface QuizUserData {
  myQuiz?: Quiz; // ユーザーが作成したクイズ
  results?: QuizResult[]; // 他のクイズに挑戦した結果
  totalScore?: number; // 累計スコア
  badges?: string[]; // 獲得バッジ
}

interface Quiz {
  questions: QuizQuestion[];
  updatedAt?: string;
}

interface QuizQuestion {
  question: string; // 問題文
  choices: [string, string, string, string]; // 4つの選択肢（既にランダム化済み）
  correctIndex: number; // 正解の位置 (0-3)
}
```

### 画面フロー

1. **イベントロビー** (`/events/:eventId`)
   - 「自分のクイズを編集」ボタン → クイズ編集画面へ
   - 「クイズに挑戦」ボタン → クイズ挑戦一覧へ

2. **クイズ編集画面** (`/events/:eventId/quiz`)
   - プロフィールから自動生成されたクイズを表示
   - 問題文と選択肢を編集可能
   - 保存後、EventUserData に保存

3. **クイズ挑戦一覧** (`/events/:eventId/quiz/challenges`)
   - イベント参加者一覧を表示（自分以外）
   - 各参加者のクイズに挑戦可能

4. **クイズ問題画面** (`/events/:eventId/quiz/challenge/:targetUserId/:questionNo`)
   - 4択問題を表示
   - 回答後、即座に正誤を表示
   - 次の問題へ進む

5. **クイズ結果画面** (`/events/:eventId/quiz/challenge/:targetUserId/result`)
   - スコアと正解率を表示
   - 他のクイズに挑戦、またはロビーへ戻る

## 実装ファイル

### 型定義

- `app/feat/quiz/types.ts` - クイズ関連の型定義

### ユーティリティ

- `app/feat/quiz/utils/quizGenerator.ts` - プロフィールからクイズを自動生成

### フック

- `app/feat/quiz/hooks/useQuizData.ts` - クイズデータ取得フック

### 画面コンポーネント

- `app/feat/quiz/screens/QuizIntroScreen.tsx` - クイズ編集画面
- `app/feat/quiz/screens/QuizChallengeListScreen.tsx` - クイズ挑戦一覧
- `app/feat/quiz/screens/QuizQuestionScreen.tsx` - クイズ問題画面
- `app/feat/quiz/screens/QuizResultScreen.tsx` - クイズ結果画面

## API使用

### クイズデータの取得

```typescript
const userData = await apis.events.getEventUserData({
  eventId,
  userId,
});
const quiz = userData.userData.myQuiz as Quiz;
```

### クイズデータの保存

```typescript
await apis.events.updateEventUserData({
  eventId,
  userId,
  eventUserDataUpdateRequest: {
    userData: {
      myQuiz: quiz,
    },
  },
});
```

## セッションストレージの使用

クイズの回答とスコアは、一時的にセッションストレージに保存されます：

- `quiz_${eventId}_${targetUserId}_answers` - 回答データ
- `quiz_${eventId}_${targetUserId}_score` - スコア

これにより、ページ遷移しても進行状況を保持できます。

## 今後の拡張

1. **結果の永続化**: 現在はセッションストレージのみ。EventUserData に結果を保存する機能の追加
2. **バッジシステム**: 成績に応じたバッジ付与
3. **ランキング**: イベント内でのスコアランキング表示
4. **タイマー**: クイズ回答の制限時間（要件では不要とされているが、オプション機能として）

## レガシーコンポーネントについて

以下のレガシーコンポーネントは新しい実装に置き換えられました：

- `src/components/question.jsx` → `app/feat/quiz/screens/QuizQuestionScreen.tsx`
- `src/components/Answer.jsx` → 機能を QuizQuestionScreen に統合
- `src/components/Result.jsx` → `app/feat/quiz/screens/QuizResultScreen.tsx`

これらのレガシーファイルは段階的に削除する予定です。
