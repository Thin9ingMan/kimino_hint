# クイズ機能 完全ユーザージャーニー

## イベント開始からクイズ完了までの完全フロー

### 1. イベント作成・参加フロー

#### イベント作成者の場合
1. **ホーム画面** → `/home`
2. **イベントハブ** → `/events` 
3. **イベント作成** → `/events/new` (Legacy: MakeQuestion画面を使用)
4. イベント作成完了後、自動的にイベントロビーへ

#### イベント参加者の場合
1. **ホーム画面** → `/home`
2. **イベントハブ** → `/events`
3. **イベント参加**
   - 手動入力: `/events/join` → 招待コード入力
   - QRコード: `/qr/join?code=xxx` → 自動参加
4. 参加完了後、イベントロビーへリダイレクト

### 2. クイズ作成フロー（各参加者が実施）

#### ステップ1: ロビーからクイズ編集へ
**イベントロビー** (`/events/:eventId`)
- 「自分のクイズを編集」ボタンをクリック

↓

#### ステップ2: クイズイントロ画面
**クイズイントロ** (`/events/:eventId/quiz`)
- 自分のクイズの状態を表示
- まだ作成していない場合: 「クイズを作成」ボタン
- 既に作成済みの場合: 「クイズを編集」ボタン
- 「クイズ一覧を見る」ボタン → 他の参加者のクイズ挑戦へ

↓

#### ステップ3: 間違いの選択肢を生成
**クイズ編集画面** (`/events/:eventId/quiz/edit`)

この画面で以下の作業を実施：

1. **名前の間違い選択肢**
   - 正解: プロフィールの表示名
   - LLMで自動生成:
     - 「互いにまったく似ていない名前」× 3
     - 「ほぼ違いがない名前」× 3
   - 手動編集も可能

2. **趣味の間違い選択肢**
   - 正解: プロフィールの趣味
   - 手動入力 × 3

3. **好きなアーティストの間違い選択肢**
   - 正解: プロフィールのアーティスト
   - 手動入力 × 3

**操作:**
- 「名前を自動生成」ボタン → LLM APIを呼び出して自動生成
- 各フィールドは手動編集可能
- 「保存してロビーへ戻る」→ EventUserDataに保存

**保存されるデータ構造:**
```typescript
{
  fakeAnswers: {
    username: [string, string, string],
    hobby: [string, string, string],
    artist: [string, string, string],
    verySimilarUsername: [string, string, string]
  },
  updatedAt: string
}
```

### 3. クイズ挑戦フロー

#### ステップ1: 挑戦する相手を選ぶ
**クイズ挑戦一覧** (`/events/:eventId/quiz/challenges`)
- イベント参加者の一覧を表示（自分以外）
- 各参加者の「開始」ボタンをクリック

↓

#### ステップ2: クイズに回答
**クイズ問題画面** (`/events/:eventId/quiz/challenge/:targetUserId/:questionNo`)

**問題の構成:**
1. 名前は何でしょう？（似ていない名前）
2. 学部は何でしょう？（プロフィールから）
3. 学年は何でしょう？（プロフィールから）
4. 趣味は何でしょう？（fakeAnswers使用）
5. 改めて、名前は何でしょう？（とても似ている名前）
6. 好きなアーティストは誰でしょう？（fakeAnswers使用）

**操作:**
- 4択から1つ選択
- 回答後、即座に正誤が表示
- 「次の問題へ」または「結果を見る」ボタン

**スコア管理:**
- セッションストレージに一時保存
  - `quiz_${eventId}_${targetUserId}_score`
  - `quiz_${eventId}_${targetUserId}_answers`

↓

#### ステップ3: 結果確認
**クイズ結果画面** (`/events/:eventId/quiz/challenge/:targetUserId/result`)
- 正解率（円グラフ）
- スコア表示
- パフォーマンス評価
- 「他のクイズに挑戦」または「ロビーへ戻る」

## 技術的な実装詳細

### API使用

#### 間違い選択肢の生成
```typescript
POST /api/llm/fake-names
{
  inputName: "山田 花",
  variance: "互いにまったく似ていない名前"
}
```

#### クイズデータの保存
```typescript
PUT /api/events/{eventId}/users/{userId}
{
  userData: {
    fakeAnswers: { ... }
  }
}
```

#### クイズデータの取得
```typescript
GET /api/events/{eventId}/users/{userId}
// Returns EventUserData with userData.fakeAnswers
```

### クイズ生成ロジック

**ファイル:** `app/feat/quiz/utils/quizFromFakes.ts`

プロフィールデータ + 保存済みのfakeAnswersから問題を動的に生成:
1. Fisher-Yatesアルゴリズムで選択肢をシャッフル
2. 正解の位置（0-3）を記録
3. 4択を保証（不足分は自動生成）

## 画面遷移図

```
/events → /events/:eventId → /events/:eventId/quiz → /events/:eventId/quiz/edit
  (一覧)     (ロビー)          (イントロ)              (編集・保存)
                ↓                                            ↓
         /events/:eventId/quiz/challenges ← ← ← ← ← ← ← ← ←
              (挑戦一覧)
                ↓
         /events/:eventId/quiz/challenge/:userId/1
              (問題1)
                ↓
         /events/:eventId/quiz/challenge/:userId/2
              (問題2)
                ↓
               ...
                ↓
         /events/:eventId/quiz/challenge/:userId/result
              (結果)
```

## 重要な注意点

1. **LLM APIの使用**: 名前の間違い選択肢生成にLLM APIを使用（オプション、手動編集も可能）
2. **データ永続化**: EventUserDataのuserDataフィールドに保存
3. **セッションストレージ**: クイズ回答中のスコアは一時保存
4. **レガシー互換性**: MakeFalseSelectionの機能を完全に再現
5. **時間制限なし**: システム側で時間制限は設けない（要件通り）
