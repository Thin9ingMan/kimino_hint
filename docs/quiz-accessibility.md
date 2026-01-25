# クイズ機能 アクセシビリティガイド

## WAI-ARIA準拠

### 1. セマンティックHTML

#### 適切な見出し階層

```tsx
<h1>クイズ</h1>                      // メインタイトル
  <h2>間違いの選択肢を作成</h2>      // セクションタイトル
    <h3>名前</h3>                    // サブセクション
```

実装例:

```tsx
<Container title="クイズ編集">
  {" "}
  {/* h1 */}
  <Alert title="間違いの選択肢を作成">
    {" "}
    {/* h2相当 */}
    <Title order={5}>名前</Title> {/* h3相当 */}
  </Alert>
</Container>
```

### 2. フォームアクセシビリティ

#### ラベルとinputの関連付け

```tsx
<TextInput
  label="選択肢 1"
  value={falseName1}
  onChange={...}
  placeholder="例: 田中 太郎"
  required
  aria-required="true"
  aria-invalid={error ? "true" : "false"}
  aria-describedby={error ? "name-error" : undefined}
/>

{error && (
  <Text id="name-error" role="alert" c="red">
    {error}
  </Text>
)}
```

#### フォーカス管理

```tsx
const firstInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  // ページ読み込み時に最初の入力にフォーカス
  firstInputRef.current?.focus();
}, []);

<TextInput
  ref={firstInputRef}
  label="選択肢 1"
  ...
/>
```

### 3. ボタンとアクション

#### aria-label for clarity

```tsx
<Button
  onClick={fetchFakeNames}
  loading={generating}
  aria-label="AIで名前を自動生成"
  aria-busy={generating}
>
  名前を自動生成
</Button>
```

#### disabled state

```tsx
<Button
  onClick={handleSave}
  disabled={saving || !isValid}
  aria-disabled={saving || !isValid}
>
  保存してロビーへ戻る
</Button>
```

### 4. アラートとエラーメッセージ

#### role="alert" for important messages

```tsx
<Alert color="red" title="エラー" role="alert" aria-live="assertive">
  <Text>{error}</Text>
</Alert>
```

#### role="status" for info

```tsx
<Alert color="blue" title="情報" role="status" aria-live="polite">
  <Text>クイズの間違いの選択肢が設定されています</Text>
</Alert>
```

### 5. 進捗表示

#### Progress component

```tsx
<Progress
  value={progress}
  aria-label={`クイズ進行状況: 問題${questionNo}/${totalQuestions}`}
  aria-valuenow={questionNo}
  aria-valuemin={1}
  aria-valuemax={totalQuestions}
/>
```

### 6. クイズ問題のアクセシビリティ

#### 選択肢ボタン

```tsx
<Button
  onClick={() => handleAnswer(idx)}
  disabled={showResult}
  aria-label={`選択肢${idx + 1}: ${choice}`}
  aria-pressed={selectedIndex === idx}
  aria-describedby={showResult ? `result-${idx}` : undefined}
>
  {choice}
</Button>;

{
  showResult && idx === correctIndex && (
    <span id={`result-${idx}`} role="status" aria-live="polite">
      正解
    </span>
  );
}
```

## キーボードナビゲーション

### Tab順序

1. メインコンテンツへスキップリンク
2. ナビゲーション
3. フォームフィールド（上から下）
4. アクションボタン
5. 補助リンク

### ショートカットキー（推奨）

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+S: 保存
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleSave();
    }

    // Ctrl+G: 自動生成
    if (e.ctrlKey && e.key === "g") {
      e.preventDefault();
      fetchFakeNames();
    }

    // 数字キー: 選択肢選択（クイズ中）
    if (!showResult && /^[1-4]$/.test(e.key)) {
      handleAnswer(parseInt(e.key) - 1);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [handleSave, fetchFakeNames, handleAnswer, showResult]);
```

### Escapeキーでキャンセル

```tsx
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      navigate(`/events/${eventId}`);
    }
  };

  window.addEventListener("keydown", handleEscape);
  return () => window.removeEventListener("keydown", handleEscape);
}, [navigate, eventId]);
```

## スクリーンリーダー対応

### 読み上げ順序

1. ページタイトル
2. ナビゲーション状態（パンくずリスト）
3. メインコンテンツ
4. フォームフィールド + ラベル
5. エラーメッセージ（即座に読み上げ）

### ライブリージョン

```tsx
// 動的更新を通知
<div aria-live="polite" aria-atomic="true">
  {generating && "AIで名前を生成中..."}
  {saving && "クイズを保存中..."}
</div>
```

### スキップリンク

```tsx
<a href="#main-content" className="skip-link">
  メインコンテンツへスキップ
</a>

<main id="main-content">
  {/* コンテンツ */}
</main>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

## 色覚多様性対応

### コントラスト比

- 通常テキスト: 4.5:1以上
- 大きいテキスト: 3:1以上
- アイコン・ボタン: 3:1以上

### 色だけに依存しない

```tsx
// ❌ 色だけで正誤を表現
<Button color={isCorrect ? "green" : "red"}>
  {choice}
</Button>

// ✅ アイコンとテキストも追加
<Button
  color={isCorrect ? "green" : "red"}
  leftSection={isCorrect ? <IconCheck /> : <IconX />}
>
  {choice} {isCorrect && "(正解)"}
</Button>
```

### フォーカスインジケーター

```css
button:focus-visible {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}
```

## モバイルアクセシビリティ

### タッチターゲットサイズ

```tsx
<Button
  size="lg" // 最小44x44px
  fullWidth
>
  保存
</Button>
```

### スワイプジェスチャー

```tsx
// 次の問題へスワイプ
const handlers = useSwipeable({
  onSwipedLeft: () => handleNext(),
  onSwipedRight: () => handlePrevious(),
  preventDefaultTouchmoveEvent: true,
  trackMouse: true,
});

<div {...handlers}>{/* クイズコンテンツ */}</div>;
```

## テスト方法

### 自動テスト

```bash
# axe-core を使用
npm install --save-dev @axe-core/react

# テストコード
import { axe } from 'jest-axe';

test('Quiz edit screen is accessible', async () => {
  const { container } = render(<QuizEditScreen />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 手動テスト

#### キーボードのみでの操作

1. Tabキーで全要素にフォーカス可能か
2. Enterキーでボタンを押せるか
3. Escapeキーでモーダルを閉じられるか
4. 矢印キーで選択肢を移動できるか（オプション）

#### スクリーンリーダーテスト

1. NVDA (Windows)
2. JAWS (Windows)
3. VoiceOver (Mac/iOS)
4. TalkBack (Android)

#### ズームテスト

1. 200%ズーム: レイアウト崩れなし
2. 400%ズーム: 横スクロールなし
3. テキストサイズ変更: 読みやすさ維持

## チェックリスト

- [ ] 全てのインタラクティブ要素にaria-label
- [ ] フォームにlabelまたはaria-labelledby
- [ ] エラーメッセージにrole="alert"
- [ ] ボタンにloading状態のaria-busy
- [ ] 進捗表示にaria-valuenow/min/max
- [ ] 色のコントラスト比4.5:1以上
- [ ] キーボードのみで全操作可能
- [ ] フォーカストラップ（モーダル時）
- [ ] タッチターゲット44x44px以上
- [ ] スクリーンリーダーで論理的な順序
- [ ] ページタイトル動的更新
- [ ] Skipリンク実装
- [ ] エラー時の適切な通知

## WCAG 2.1 Level AA 準拠状況

| 基準                       | 状態 | 備考                    |
| -------------------------- | ---- | ----------------------- |
| 1.1.1 非テキストコンテンツ | ✅   | alt属性、aria-label実装 |
| 1.3.1 情報と関係性         | ✅   | セマンティックHTML使用  |
| 1.4.3 最低限のコントラスト | ✅   | 4.5:1以上確保           |
| 2.1.1 キーボード操作       | ✅   | 全機能キーボード対応    |
| 2.4.3 フォーカス順序       | ✅   | 論理的な順序            |
| 3.2.2 入力時の状態変化     | ✅   | 予期しない変化なし      |
| 3.3.1 エラー特定           | ✅   | エラーメッセージ明確    |
| 3.3.2 ラベルまたは説明     | ✅   | 全入力にラベル          |
| 4.1.2 名前・役割・値       | ✅   | ARIA適切に使用          |

## 今後の改善計画

1. **音声フィードバック**: 正解時・不正解時の効果音（オプション）
2. **ハイコントラストモード**: 色覚多様性対応強化
3. **カスタムキーボードショートカット**: ユーザー設定可能に
4. **読み上げ速度調整**: スクリーンリーダー用設定
5. **簡易版UI**: 認知負荷軽減モード
