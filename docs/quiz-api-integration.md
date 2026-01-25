# クイズ機能 API統合ガイド

## 使用するAPIエンドポイント

### 1. プロフィール関連

#### プロフィール取得

```
GET /api/me
GET /api/profiles/me
GET /api/profiles/{userId}
```

レスポンス例:

```json
{
  "id": 1,
  "userId": 1,
  "profileData": {
    "displayName": "山田 花",
    "furigana": "やまだ はな",
    "hobby": "読書",
    "favoriteArtist": "YOASOBI",
    "grade": "2年生",
    "faculty": "工学部",
    "facultyDetail": "情報工学科"
  },
  "createdAt": "2026-01-14T10:00:00Z",
  "updatedAt": "2026-01-14T11:00:00Z"
}
```

### 2. LLM API - 偽の名前生成

#### エンドポイント

```
POST /api/llm/fake-names
```

リクエストボディ:

```json
{
  "inputName": "山田 花",
  "variance": "互いにまったく似ていない名前"
}
```

または:

```json
{
  "inputName": "山田 花",
  "variance": "ほぼ違いがない名前"
}
```

レスポンス例:

```json
{
  "output": ["田中 太郎", "鈴木 花子", "佐藤 健"]
}
```

#### variance オプション

- `"互いにまったく似ていない名前"` - 完全に異なる名前を生成
- `"ほぼ違いがない名前"` - とても似ている名前を生成（問題5用）

### 3. EventUserData API

#### EventUserDataの取得

```
GET /api/events/{eventId}/users/{userId}
```

レスポンス例:

```json
{
  "id": 10,
  "eventId": 5,
  "userId": 1,
  "userData": {
    "fakeAnswers": {
      "username": ["田中 太郎", "鈴木 花子", "佐藤 健"],
      "hobby": ["サッカー", "料理", "音楽鑑賞"],
      "artist": ["ヨルシカ", "米津玄師", "あいみょん"],
      "verySimilarUsername": ["山田 華", "山本 花", "山口 花"]
    },
    "updatedAt": "2026-01-14T11:30:00Z"
  },
  "revisionMeta": null,
  "createdAt": "2026-01-14T11:00:00Z",
  "updatedAt": "2026-01-14T11:30:00Z"
}
```

#### EventUserDataの更新

```
PUT /api/events/{eventId}/users/{userId}
```

リクエストボディ:

```json
{
  "userData": {
    "fakeAnswers": {
      "username": ["田中 太郎", "鈴木 花子", "佐藤 健"],
      "hobby": ["サッカー", "料理", "音楽鑑賞"],
      "artist": ["ヨルシカ", "米津玄師", "あいみょん"],
      "verySimilarUsername": ["山田 華", "山本 花", "山口 花"]
    },
    "updatedAt": "2026-01-14T11:30:00Z"
  }
}
```

レスポンス: 更新されたEventUserData

### 4. イベント参加者の取得

#### イベント参加者一覧

```
GET /api/events/{eventId}/attendees
```

レスポンス例:

```json
[
  {
    "id": 1,
    "eventId": 5,
    "attendeeUserId": 1,
    "joinedAt": "2026-01-14T10:00:00Z",
    "meta": {
      "displayName": "山田 花"
    }
  },
  {
    "id": 2,
    "eventId": 5,
    "attendeeUserId": 2,
    "joinedAt": "2026-01-14T10:30:00Z",
    "meta": {
      "displayName": "田中 太郎"
    }
  }
]
```

### 5. ユーザー情報の取得

#### ユーザー詳細

```
GET /api/users/{userId}
```

レスポンス例:

```json
{
  "id": 1,
  "username": "guest_abc123",
  "isGuest": true,
  "profileSummary": {
    "displayName": "山田 花",
    "avatarUrl": null
  },
  "createdAt": "2026-01-14T09:00:00Z"
}
```

## クイズ生成の流れ

### ステップ1: プロフィールとfakeAnswersを取得

```typescript
const profile = await apis.profiles.getUserProfile({ userId: targetUserId });
const userData = await apis.events.getEventUserData({
  eventId,
  userId: targetUserId,
});
const fakeAnswers = userData.userData.fakeAnswers;
```

### ステップ2: クライアント側でクイズ生成

```typescript
import { generateQuizFromProfileAndFakes } from "../utils/quizFromFakes";

const quiz = generateQuizFromProfileAndFakes(profile, fakeAnswers);
```

生成されるクイズ構造:

```typescript
{
  questions: [
    {
      question: "名前は何でしょう？",
      choices: ["山田 花", "田中 太郎", "鈴木 花子", "佐藤 健"],
      correctIndex: 2  // "山田 花"の位置（ランダム化済み）
    },
    // ... 6問
  ],
  updatedAt: "2026-01-14T11:35:00Z"
}
```

## エラーハンドリング

### 404 Not Found

```json
{
  "error": "User data not found",
  "message": "No user data exists for this user in this event"
}
```

対応:

- EventUserDataが未作成
- ユーザーにクイズ作成を促す

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

対応:

- ゲスト認証をやり直す
- AuthProvider.ensureGuestAuth()を呼ぶ

### 400 Bad Request

```json
{
  "error": "Invalid request",
  "message": "userData must be an object"
}
```

対応:

- リクエストボディの形式を確認
- バリデーションエラーを表示

### LLM API タイムアウト

```json
{
  "error": "Timeout",
  "message": "LLM service did not respond in time"
}
```

対応:

- ユーザーに手動入力を促す
- 再試行ボタンを表示

## データフロー図

```
┌─────────────────┐
│  Profile Edit   │
│  (Me Screen)    │
└────────┬────────┘
         │ Save profile
         ▼
┌─────────────────┐
│   Profile API   │
│  profileData    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Quiz Edit      │
│  Screen         │
└────────┬────────┘
         │ Generate fake names
         ▼
┌─────────────────┐
│    LLM API      │
│  fake names     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Manual Edit    │
│  fake answers   │
└────────┬────────┘
         │ Save fakeAnswers
         ▼
┌─────────────────┐
│ EventUserData   │
│    API          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Quiz Challenge  │
│   (Other User)  │
└────────┬────────┘
         │ Fetch profile + fakeAnswers
         ▼
┌─────────────────┐
│ Generate Quiz   │
│  (Client-side)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Quiz Questions  │
│  Answer & Score │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Quiz Result    │
│   Display       │
└─────────────────┘
```

## パフォーマンス最適化

### キャッシュ戦略

- プロフィールデータ: React Queryで5分間キャッシュ
- EventUserData: 変更時にinvalidate
- LLM生成結果: キャッシュしない（毎回新鮮な結果）

### 並列リクエスト

```typescript
// 2種類の名前を並列生成
const [differentNames, similarNames] = await Promise.all([
  apis.llm.generateFakeNames({
    fakeNamesRequest: {
      inputName: displayName,
      variance: "互いにまったく似ていない名前",
    },
  }),
  apis.llm.generateFakeNames({
    fakeNamesRequest: {
      inputName: displayName,
      variance: "ほぼ違いがない名前",
    },
  }),
]);
```

### クイズ生成最適化

- クライアント側で動的生成（サーバー負荷削減）
- Fisher-Yatesアルゴリズムで効率的にシャッフル
- メモ化でリレンダリング時の再計算を防ぐ

## セキュリティ考慮事項

### 入力検証

- 空文字列を除外
- 重複チェック
- 最大文字数制限（未実装、今後追加推奨）

### 認証

- 全APIリクエストにJWTトークン付与
- AuthProviderで自動管理

### データアクセス制限

- EventUserDataは同じイベント参加者のみ閲覧可能
- サーバー側でイベント参加確認

## トラブルシューティング

### クイズが表示されない

1. fakeAnswersが保存されているか確認:
   ```
   GET /api/events/{eventId}/users/{userId}
   ```
2. profileDataに必要なフィールドがあるか確認
3. ブラウザコンソールでエラーログ確認

### LLM生成が失敗する

1. ネットワーク接続確認
2. APIタイムアウト設定確認（デフォルト30秒）
3. 手動入力にフォールバック

### スコアが保存されない

1. セッションストレージの確認:
   ```javascript
   sessionStorage.getItem("quiz_${eventId}_${targetUserId}_score");
   ```
2. クイズ開始時にクリアされているか確認
3. 別タブで開いていないか確認（セッションストレージは独立）
