# クイズ機能

イベント参加者同士がお互いのプロフィールに基づいたクイズを出し合い、相互理解を深めるための機能です。

## 特徴

- 🤖 **AI自動生成**: LLM APIを使用して間違いの選択肢を自動生成
- 📝 **手動編集**: 生成された選択肢は自由に編集可能
- 🎯 **4択形式**: シンプルで分かりやすい4択クイズ
- ⏱️ **時間制限なし**: 自分のペースで回答可能
- 📊 **即時フィードバック**: 回答後すぐに正誤を確認
- 🏆 **スコア表示**: 結果画面で正解率とパフォーマンスを表示

## クイック スタート

### 1. プロフィール作成
まず、自分のプロフィールを作成します：
- 表示名
- 趣味
- 好きなアーティスト
- 学部・学年（オプション）

### 2. イベント参加
- 新規イベント作成、または
- 招待コード/QRコードでイベント参加

### 3. クイズ作成
1. イベントロビーで「自分のクイズを編集」をクリック
2. クイズ編集画面で「名前を自動生成」をクリック（AI使用）
3. 趣味とアーティストの間違い選択肢を手動入力
4. 保存

### 4. クイズ挑戦
1. イベントロビーで「クイズに挑戦」をクリック
2. 挑戦したい参加者を選択
3. 6問の4択クイズに回答
4. 結果確認

## 画面フロー

```
イベントロビー
    ↓
クイズハブ (Intro)
    ↓
クイズ編集 ←→ LLM API
    ↓
保存完了
    ↓
クイズ挑戦一覧
    ↓
問題1 → 問題2 → ... → 問題6
    ↓
結果表示
```

## 技術仕様

### フロントエンド
- **フレームワーク**: React 18 + TypeScript
- **UIライブラリ**: Mantine v7
- **ルーティング**: React Router v6
- **状態管理**: React Query (TanStack Query)
- **ビルドツール**: Vite

### APIエンドポイント
- `POST /api/llm/fake-names` - AI名前生成
- `GET /api/events/{eventId}/users/{userId}` - クイズデータ取得
- `PUT /api/events/{eventId}/users/{userId}` - クイズデータ保存
- `GET /api/events/{eventId}/attendees` - 参加者一覧
- `GET /api/profiles/{userId}` - プロフィール取得

### データモデル
```typescript
interface FakeAnswers {
  username: string[];              // 間違いの名前 × 3
  hobby: string[];                 // 間違いの趣味 × 3
  artist: string[];                // 間違いのアーティスト × 3
  verySimilarUsername: string[];   // 似ている名前 × 3
}
```

## ファイル構成

```
app/feat/quiz/
├── screens/
│   ├── QuizIntroScreen.tsx        # クイズハブ
│   ├── QuizEditScreen.tsx         # クイズ編集
│   ├── QuizChallengeListScreen.tsx # 挑戦一覧
│   ├── QuizQuestionScreen.tsx     # 問題画面
│   └── QuizResultScreen.tsx       # 結果画面
├── hooks/
│   └── useQuizData.ts             # データ取得フック
├── utils/
│   ├── quizFromFakes.ts           # クイズ生成ロジック
│   └── errors.ts                  # エラーハンドリング
└── types.ts                        # 型定義
```

## ドキュメント

詳細なドキュメントは以下を参照：

- [完全ユーザージャーニー](./quiz-user-journey.md) - ユーザーフローの詳細
- [API統合ガイド](./quiz-api-integration.md) - API仕様と使用方法
- [テストシナリオ](./quiz-test-scenarios.md) - テスト方法とシナリオ
- [アクセシビリティガイド](./quiz-accessibility.md) - WCAG準拠とa11y対応
- [パフォーマンス最適化](./quiz-performance.md) - 最適化テクニック
- [トラブルシューティング](./quiz-troubleshooting.md) - よくある問題と解決方法
- [デプロイメント](./quiz-deployment.md) - デプロイ手順と設定

## 開発

### セットアップ
```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# TypeScriptチェック
npm run typecheck

# Linting
npm run lint
```

### テスト
```bash
# 単体テスト（未実装）
npm test

# E2Eテスト（未実装）
npm run test:e2e
```

### ビルド
```bash
# プロダクションビルド
npm run build

# プレビュー
npm run preview
```

## アーキテクチャの決定事項

### なぜクライアント側でクイズ生成？
- サーバー負荷削減
- リアルタイムなユーザー体験
- ネットワーク通信の最小化

### なぜSessionStorageを使用？
- クイズ進行中の一時データ保存
- タブ間の独立性確保
- LocalStorageよりライフサイクルが適切

### なぜ Fisher-Yatesアルゴリズム？
- 効率的なO(n)時間複雑度
- 公平なランダム化
- 業界標準のシャッフルアルゴリズム

## パフォーマンス

### 目標値
- 初回読み込み: < 1.5秒
- クイズ生成: < 100ms
- LLM API: < 5秒
- ページ遷移: < 300ms

### 最適化手法
- React Queryによるキャッシング
- useMemo/useCallbackによる再レンダリング防止
- Code Splittingによる初期バンドルサイズ削減
- 並列APIリクエスト

## アクセシビリティ

- WCAG 2.1 Level AA準拠
- キーボード操作完全対応
- スクリーンリーダー対応
- 色のコントラスト比 4.5:1以上
- ARIA属性の適切な使用

## セキュリティ

- XSS対策: Reactの自動エスケープ
- CSRF対策: JWT認証
- 入力バリデーション: クライアント・サーバー両方
- HTTPS必須
- Content Security Policy設定

## 既知の制限事項

1. **LLM生成のタイムアウト**: 30秒でタイムアウト（手動入力可能）
2. **オフライン非対応**: ネットワーク接続必須
3. **ブラウザサポート**: モダンブラウザのみ（IE11非対応）

## 今後の拡張計画

- [ ] クイズ結果の永続化（EventUserDataに保存）
- [ ] バッジシステム
- [ ] ランキング機能
- [ ] 難易度設定
- [ ] カスタム問題作成
- [ ] 画像問題対応
- [ ] オフライン対応（PWA）

## ライセンス

このプロジェクトのライセンスについてはルートディレクトリのLICENSEファイルを参照してください。

## コントリビューション

バグ報告や機能リクエストは GitHubのIssueで受け付けています。
プルリクエストも歓迎します。

## サポート

問題が発生した場合:
1. [トラブルシューティングガイド](./quiz-troubleshooting.md)を確認
2. GitHubのIssueを検索
3. 新しいIssueを作成

---

**最終更新**: 2026-01-14
**バージョン**: 1.0.0
