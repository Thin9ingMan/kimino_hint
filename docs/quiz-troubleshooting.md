# クイズ機能 トラブルシューティングガイド

## よくある問題と解決方法

### 1. クイズが表示されない

#### 症状
- クイズ挑戦画面で「クイズが見つかりません」と表示される
- 参加者一覧に表示されるが、クイズを開始できない

#### 原因と解決方法

**原因A: fakeAnswersが未作成**
```
確認方法:
1. ブラウザのDevToolsを開く
2. Network タブを確認
3. GET /api/events/{eventId}/users/{userId} のレスポンスを確認
4. userData.fakeAnswers が null または空の場合

解決方法:
該当ユーザーに /events/{eventId}/quiz/edit でクイズを作成してもらう
```

**原因B: プロフィールデータ不足**
```
確認方法:
1. GET /api/profiles/{userId} のレスポンスを確認
2. profileData.displayName, hobby, favoriteArtist が空の場合

解決方法:
プロフィールを /me/profile/edit で編集し、必須項目を入力
```

**原因C: API認証エラー**
```
確認方法:
1. Network タブで 401 Unauthorized エラーを確認
2. LocalStorage の token をチェック

解決方法:
1. ページをリロード（AuthProviderが自動的にゲスト認証を再実行）
2. それでも解決しない場合、LocalStorageをクリアして再度アクセス
```

### 2. LLM による名前生成が失敗する

#### 症状
- 「名前を自動生成」ボタンをクリックしてもエラーになる
- タイムアウトエラーが表示される

#### 原因と解決方法

**原因A: LLM APIサーバーの問題**
```
確認方法:
1. Network タブで POST /api/llm/fake-names の Status を確認
2. 500, 503 エラーの場合、サーバー側の問題

解決方法:
1. 手動で間違い選択肢を入力
2. しばらく待ってから再試行
3. サーバー管理者に連絡
```

**原因B: タイムアウト**
```
確認方法:
1. リクエストが30秒以上かかっている
2. pending状態のまま完了しない

解決方法:
1. ネットワーク接続を確認
2. 別のブラウザで試す
3. 手動入力にフォールバック
```

**原因C: 不正な入力**
```
確認方法:
1. displayName に特殊文字が含まれている
2. displayName が空

解決方法:
1. プロフィールのdisplayNameを確認・修正
2. 通常の文字（漢字・ひらがな・カタカナ）を使用
```

### 3. スコアが正しく表示されない

#### 症状
- 結果画面で 0/6 と表示される
- 正解したはずなのにスコアが増えない

#### 原因と解決方法

**原因A: セッションストレージのクリア**
```
確認方法:
1. DevTools > Application > Session Storage を確認
2. quiz_${eventId}_${targetUserId}_score が存在するか

解決方法:
クイズを最初からやり直す（「開始」ボタンを押し直す）
```

**原因B: 別タブで開いている**
```
原因:
セッションストレージはタブごとに独立しているため、
別タブでクイズを開始すると、スコアが共有されない

解決方法:
同じタブ内でクイズを完了する
```

**原因C: ページリロード**
```
原因:
クイズ途中でF5を押すと、一部のスコアがリセットされる可能性

解決方法:
クイズ中はページリロードを避ける
```

### 4. クイズの保存に失敗する

#### 症状
- 「保存してロビーへ戻る」をクリックしてもエラーになる
- ロビーに戻れない

#### 原因と解決方法

**原因A: ネットワークエラー**
```
確認方法:
1. Network タブで PUT /api/events/{eventId}/users/{userId} のステータス
2. Failed to fetch または net::ERR の場合

解決方法:
1. インターネット接続を確認
2. VPNやプロキシを無効化
3. 再試行
```

**原因B: バリデーションエラー**
```
確認方法:
1. 必須項目（名前の間違い選択肢3つ）が未入力
2. エラーメッセージで確認

解決方法:
全ての必須項目を入力してから保存
```

**原因C: サーバーエラー**
```
確認方法:
1. Status が 500 の場合
2. レスポンスボディにエラーメッセージ

解決方法:
1. しばらく待ってから再試行
2. 問題が続く場合、管理者に連絡
```

### 5. 選択肢が正しくシャッフルされていない

#### 症状
- 毎回同じ順序で選択肢が表示される
- 正解が常に同じ位置にある

#### 原因と解決方法

**原因A: ブラウザキャッシュ**
```
解決方法:
1. Ctrl+Shift+R（またはCmd+Shift+R）でハードリロード
2. ブラウザキャッシュをクリア
```

**原因B: クイズデータの再生成が必要**
```
確認方法:
quizGenerator.tsのshuffleArrayが呼ばれているか確認

解決方法:
1. クイズを編集し直す
2. fakeAnswersを更新する
```

## デバッグ方法

### ブラウザDevTools使用

#### 1. NetworkタブでAPIリクエスト確認
```
手順:
1. DevTools > Network タブを開く
2. Preserve log にチェック
3. クイズ操作を実行
4. /api/* のリクエストを確認
5. Status, Response を確認
```

#### 2. Consoleでエラーログ確認
```
手順:
1. DevTools > Console タブを開く
2. エラーメッセージを確認
3. スタックトレースから原因特定
```

#### 3. Application タブでストレージ確認
```
手順:
1. DevTools > Application タブ
2. Local Storage: 認証トークン確認
3. Session Storage: クイズスコア確認
```

### React DevTools使用

#### コンポーネント状態確認
```
手順:
1. React DevTools インストール
2. Components タブを開く
3. QuizEditScreen を選択
4. State を確認（falseName1, falseName2など）
```

#### Props確認
```
手順:
1. QuizQuestionScreen を選択
2. Props を確認（quiz, questionNo など）
3. 期待値と実際の値を比較
```

## パフォーマンス問題

### 1. クイズ読み込みが遅い

#### 確認方法
```
Performance API を使用:
1. console.time('quiz-load')
2. クイズ画面を開く
3. console.timeEnd('quiz-load')
4. 3秒以上かかる場合は問題
```

#### 解決方法
```
1. React Query のキャッシュ確認
2. 不要な再レンダリングを useMemo/useCallback で防止
3. 画像の遅延読み込み
4. コードスプリッティング
```

### 2. メモリリーク

#### 確認方法
```
1. DevTools > Performance > Memory にチェック
2. クイズを複数回実行
3. メモリ使用量が増え続ける場合は問題
```

#### 解決方法
```
1. useEffect のクリーンアップ関数を確認
2. EventListener の削除を確認
3. setInterval/setTimeout のクリア確認
```

## エラーコード一覧

| コード | 意味 | 対処方法 |
|--------|------|----------|
| PROFILE_NOT_FOUND | プロフィール未作成 | プロフィール作成 |
| FAKE_ANSWERS_NOT_FOUND | クイズ未作成 | クイズ作成画面へ |
| LLM_GENERATION_FAILED | AI生成失敗 | 手動入力 |
| QUIZ_SAVE_FAILED | 保存失敗 | 再試行 |
| INVALID_QUIZ_DATA | データ不正 | データ確認・修正 |
| NETWORK_ERROR | ネットワークエラー | 接続確認 |
| AUTH_ERROR | 認証エラー | 再ログイン |
| NOT_FOUND | データなし | データ作成 |
| SERVER_ERROR | サーバーエラー | 待機・再試行 |

## サポート連絡時の情報

バグ報告や問い合わせ時には以下の情報を提供:

```
環境情報:
- OS: Windows 11 / macOS / Linux
- ブラウザ: Chrome 120 / Safari 17 / Firefox 115
- 画面サイズ: 1920x1080

再現手順:
1. /events/123 にアクセス
2. 「自分のクイズを編集」をクリック
3. 「名前を自動生成」をクリック
4. エラー発生

エラー内容:
- エラーメッセージ: "LLM generation failed"
- Status Code: 500
- タイムスタンプ: 2026-01-14 11:00:00

添付:
- スクリーンショット
- コンソールログ
- Networkタブのスクリーンショット
```

## 緊急時の回避策

### 全てのデータをクリアして初期状態に戻す
```javascript
// ブラウザコンソールで実行
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### クイズデータのみリセット
```javascript
// 特定のクイズデータを削除
const eventId = 123;
const userId = 456;
sessionStorage.removeItem(`quiz_${eventId}_${userId}_score`);
sessionStorage.removeItem(`quiz_${eventId}_${userId}_answers`);
```

### キャッシュクリア
```javascript
// React Queryのキャッシュをクリア
// (React DevTools から queryClient にアクセス可能)
queryClient.clear();
```
