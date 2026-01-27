# エラーハンドリング機構のリファクタリング計画

## 1. 目的

現在のエラーハンドリング機構を改善し、より堅牢で、ユーザーにとって文脈に合った親切なエラー復帰パスを提供することを目的とします。

## 2. 基本戦略

React Router v6.4以降で推奨されている`errorElement`プロパティを全面的に採用し、エラー処理を各画面コンポーネントからルーター層に集約します。

1.  **`errorElement`の活用:** 各`<Route>`に`errorElement`プロパティを設定し、データ取得(loader)やレンダリング中のエラーをそこで一元的に捕捉します。
2.  **カスタムエラーの導入:** エラー発生時の復帰先URLなど、文脈に応じた情報を持たせるための`AppError`クラスを定義しました。ローダーでエラーを捕捉した際は、この`AppError`をthrowします。
3.  **汎用エラーページの作成:** `useRouteError`フックを使い、スローされたエラー情報を表示するための汎用的なエラーページコンポーネント (`GeneralErrorPage`, `EventsErrorPage`, `ProfileErrorPage`) を作成しました。これらのコンポーネントは`AppError`に含まれる`recoveryUrl`を解釈し、適切な「戻る」ボタンを動的に生成します。
4.  **スクリーンコンポーネントの責務分離:** 各画面コンポーネントからは、エラーハンドリングに関する記述（`ErrorBoundary`関連のコード）を完全に削除し、責務をデータ表示のみに単純化します。

## 3. 完了した作業

以下の作業は完了済みです。

- **`app/shared/api/errors.ts`**: `AppError`クラスの追加。
- **`app/shared/ui/RouteError.tsx`**: `BaseErrorPage`, `GeneralErrorPage`, `EventsErrorPage`, `ProfileErrorPage`の作成。
- **`app/router.tsx`**: 全ての主要なルートに対する`errorElement`の設定。
- **以下のスクリーンのクリーンアップ**:
  - `app/feat/profiles/screens/ProfileDetailScreen.tsx`
  - `app/feat/events/screens/EventLobbyScreen.tsx`
  - `app/feat/home/screens/HomeScreen.tsx`
  - `app/feat/me/screens/MyProfileScreen.tsx`
  - `app/feat/me/screens/EditMyProfileScreen.tsx`
  - `app/feat/profiles/screens/ProfileListScreen.tsx`
  - `app/feat/qr/screens/QrJoinScreen.tsx`
  - `app/feat/quiz/screens/QuizChallengeListScreen.tsx`
  - `app/feat/quiz/screens/QuizResultScreen.tsx`
  - `app/feat/quiz/screens/QuizRewardsScreen.tsx`
  - `app/feat/quiz/screens/QuizQuestionScreen.tsx`

## 4. 残りの作業 (To-Do)

以下のスクリーンファイルには、過去のバージョンのエラーハンドリングコードが残っており、クリーンアップが必要です。

- `app/feat/quiz/screens/QuizEditScreen.tsx`
- `app/feat/quiz/screens/QuizIntroScreen.tsx`
- `app/feat/quiz/screens/QuizSequenceScreen.tsx`
- `app/feat/events/screens/JoinEventScreen.tsx`
- `app/feat/events/screens/CreateEventScreen.tsx`
- `app/feat/events/screens/EventLiveScreen.tsx`

## 5. 具体的な実装ガイド

`app/feat/quiz/screens/QuizIntroScreen.tsx` を例に、具体的なリファクタリング手順を以下に示します。

### Step 1: `loader`を修正

`loader`内で`try...catch`ブロックを追加し、エラー発生時には`AppError`をスローするように変更します。`recoveryUrl`には、その画面の文脈に適した復帰先（この場合はイベントロビー）を指定します。

```tsx:app/feat/quiz/screens/QuizIntroScreen.tsx
// 変更前
export async function loader({ params }: { params: { eventId?: string } }) {
  const eventId = Number(params.eventId);
  if (Number.isNaN(eventId)) {
    throw new Error("eventId が不正です");
  }
  // ... API呼び出し ...
  // エラーはそのままthrowされたり、nullを返したりしていた
  return { eventId, me, eventUserData };
}

// 変更後
import { apis, fetchCurrentUser, AppError } from "@/shared/api"; // AppErrorをインポート

export async function loader({ params }: { params: { eventId?: string } }) {
  const eventId = Number(params.eventId);
  if (Number.isNaN(eventId)) {
    throw new AppError("eventId が不正です", { recoveryUrl: "/events" });
  }

  try {
    const me = await fetchCurrentUser();
    let eventUserData: any = null;
    try {
      eventUserData = await apis.events.getEventUserData({
        eventId,
        userId: me.id,
      });
    } catch {
      eventUserData = null;
    }
    return { eventId, me, eventUserData };
  } catch (error) {
    throw new AppError("クイズ情報の読み込みに失敗しました", {
      cause: error,
      recoveryUrl: `/events/${eventId}`,
    });
  }
}
```

### Step 2: コンポーネントをクリーンアップ

ファイル末尾に追加した`ErrorBoundary`関連のコード (`QuizIntroErrorFallback`, `QuizIntroErrorBoundary`, `QuizIntroScreen.ErrorBoundary = ...`) を全て削除し、関連する`import`文も整理します。

```tsx:app/feat/quiz/screens/QuizIntroScreen.tsx
// 変更前 (ファイルの末尾)
function QuizIntroErrorFallback({ error, retry }) {
  // ...
}
function QuizIntroErrorBoundary({ children }) {
  // ...
}
QuizIntroScreen.loader = loader;
QuizIntroScreen.ErrorBoundary = QuizIntroErrorBoundary;


// 変更後 (ファイルの末尾)
QuizIntroScreen.loader = loader;
```

この手順を「4. 残りの作業」にリストアップされている全てのファイルに適用していきます。
