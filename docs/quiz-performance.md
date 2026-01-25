# クイズ機能 パフォーマンス最適化ガイド

## React Query キャッシュ戦略

### 1. プロフィールデータのキャッシュ

```typescript
// 5分間キャッシュ、バックグラウンドで更新
const myProfile = useSuspenseQuery(
  ["quiz", "edit", "profile"],
  async () => apis.profiles.getMyProfile(),
  {
    staleTime: 5 * 60 * 1000, // 5分
    cacheTime: 10 * 60 * 1000, // 10分
    refetchOnWindowFocus: false,
  },
);
```

### 2. EventUserDataのキャッシュ無効化

```typescript
// クイズ保存後にキャッシュをクリア
const queryClient = useQueryClient();

await apis.events.updateEventUserData({...});

// 関連するキャッシュを無効化
queryClient.invalidateQueries(["quiz", "edit", "userdata"]);
queryClient.invalidateQueries(["quiz", "intro", "userdata"]);
```

### 3. プリフェッチング

```typescript
// クイズ挑戦一覧画面でデータを先読み
const prefetchQuizData = useCallback(async (userId: number) => {
  await queryClient.prefetchQuery(
    ["quiz", "challenge", "profile", eventId, userId],
    () => apis.profiles.getUserProfile({ userId })
  );

  await queryClient.prefetchQuery(
    ["quiz", "challenge", "data", eventId, userId],
    () => apis.events.getEventUserData({ eventId, userId })
  );
}, [eventId, queryClient]);

// ホバー時にプリフェッチ
<Button
  onMouseEnter={() => prefetchQuizData(attendee.userId)}
  onClick={...}
>
  開始
</Button>
```

## 画像とアセット最適化

### 1. 遅延読み込み

```typescript
import { lazy, Suspense } from 'react';

// 重いコンポーネントを遅延読み込み
const QuizEditScreen = lazy(() => import('./QuizEditScreen'));

<Suspense fallback={<LoadingSpinner />}>
  <QuizEditScreen />
</Suspense>
```

### 2. Code Splitting

```typescript
// ルートレベルで分割
const QuizRoutes = lazy(() => import('./QuizRoutes'));

// router.tsx
<Route path="/events/:eventId/quiz/*" element={
  <Suspense fallback={<LoadingFallback />}>
    <QuizRoutes />
  </Suspense>
} />
```

## レンダリング最適化

### 1. useMemo for expensive computations

```typescript
// クイズ生成は重い処理なのでメモ化
const quiz = useMemo(() => {
  const fakeAnswers = quizData?.userData?.fakeAnswers;
  if (!fakeAnswers || !targetProfile) {
    return null;
  }
  return generateQuizFromProfileAndFakes(targetProfile, fakeAnswers);
}, [targetProfile, quizData]);
```

### 2. useCallback for event handlers

```typescript
// イベントハンドラをメモ化して不要な再レンダリングを防止
const handleAnswer = useCallback(
  (choiceIndex: number) => {
    setSelectedIndex(choiceIndex);
    setShowResult(true);

    // スコア更新ロジック...
  },
  [eventId, targetUserId, questionIndex, question.correctIndex],
);
```

### 3. React.memo for components

```typescript
// 変更がないコンポーネントをメモ化
const QuizChoice = React.memo(({ choice, onClick, isSelected }: Props) => {
  return (
    <Button
      onClick={onClick}
      variant={isSelected ? 'filled' : 'default'}
    >
      {choice}
    </Button>
  );
});
```

## ネットワーク最適化

### 1. 並列リクエスト

```typescript
// 複数のAPIを並列で呼ぶ
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

### 2. リクエストのデバウンス

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSave = useDebouncedCallback(
  async (fakeAnswers) => {
    await apis.events.updateEventUserData({...});
  },
  1000  // 1秒待ってから保存
);
```

### 3. リクエストのキャンセル

```typescript
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const data = await apis.llm.generateFakeNames(
        {...},
        { signal: controller.signal }
      );
      // ...
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request cancelled');
      }
    }
  };

  fetchData();

  return () => controller.abort();
}, [displayName]);
```

## セッションストレージ最適化

### 1. 効率的なデータ構造

```typescript
// ❌ 毎回パースするのは非効率
const score = parseInt(
  sessionStorage.getItem(`quiz_${eventId}_${targetUserId}_score`) || "0",
);

// ✅ メモ化して再利用
const getQuizScore = useMemo(() => {
  const stored = sessionStorage.getItem(
    `quiz_${eventId}_${targetUserId}_score`,
  );
  return stored ? parseInt(stored, 10) : 0;
}, [eventId, targetUserId]);
```

### 2. バッチ更新

```typescript
// ❌ 個別に保存
sessionStorage.setItem("score", score);
sessionStorage.setItem("answers", answers);
sessionStorage.setItem("progress", progress);

// ✅ まとめて保存
const quizState = {
  score,
  answers,
  progress,
  timestamp: Date.now(),
};
sessionStorage.setItem(
  `quiz_${eventId}_${targetUserId}`,
  JSON.stringify(quizState),
);
```

## Fisher-Yates Shuffle 最適化

```typescript
// 最適化されたシャッフル関数
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  // 現代的なFisher-Yatesアルゴリズム
  for (let i = shuffled.length - 1; i > 0; i--) {
    // crypto.getRandomValuesを使用してより良い乱数生成
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const j = randomBuffer[0] % (i + 1);

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
```

## バンドルサイズ最適化

### 1. Tree Shaking

```typescript
// ❌ 全体をインポート
import * as apis from "@/shared/api";

// ✅ 必要なものだけインポート
import { eventsApi, profilesApi, llmApi } from "@/shared/api";
```

### 2. Dynamic Imports

```typescript
// LLM APIは必要な時だけロード
const generateFakeNames = async (inputName: string) => {
  const { llmApi } = await import('@/shared/api/llm');
  return llmApi.generateFakeNames({...});
};
```

## パフォーマンスモニタリング

### 1. React DevTools Profiler

```typescript
import { Profiler } from 'react';

<Profiler
  id="QuizEditScreen"
  onRender={(id, phase, actualDuration) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  }}
>
  <QuizEditScreen />
</Profiler>
```

### 2. Web Vitals

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 3. カスタムパフォーマンスマーク

```typescript
const measureQuizGeneration = () => {
  performance.mark("quiz-generation-start");

  const quiz = generateQuizFromProfileAndFakes(profile, fakeAnswers);

  performance.mark("quiz-generation-end");
  performance.measure(
    "quiz-generation",
    "quiz-generation-start",
    "quiz-generation-end",
  );

  const measure = performance.getEntriesByName("quiz-generation")[0];
  console.log(`Quiz generation took ${measure.duration}ms`);

  return quiz;
};
```

## パフォーマンス目標

| 指標                       | 目標    | 現状      |
| -------------------------- | ------- | --------- |
| 初回読み込み (FCP)         | < 1.5s  | 測定中    |
| インタラクティブまで (TTI) | < 3.5s  | 測定中    |
| クイズ生成時間             | < 100ms | ~50ms ✅  |
| LLM API呼び出し            | < 5s    | ~3s ✅    |
| ページ遷移                 | < 300ms | ~200ms ✅ |
| 問題表示                   | < 500ms | ~100ms ✅ |

## チェックリスト

- [ ] React Queryのキャッシュ設定確認
- [ ] 重いコンポーネントをlazy loadingに変更
- [ ] useMemo/useCallbackで最適化
- [ ] 並列リクエストで高速化
- [ ] セッションストレージの効率化
- [ ] バンドルサイズ分析（webpack-bundle-analyzer）
- [ ] Lighthouseスコア90以上
- [ ] Web Vitalsが全てGreen
- [ ] メモリリーク確認
- [ ] 長時間使用テスト

## トラブルシューティング

### メモリリーク

```typescript
// ❌ クリーンアップなし
useEffect(() => {
  const interval = setInterval(() => {...}, 1000);
}, []);

// ✅ 適切なクリーンアップ
useEffect(() => {
  const interval = setInterval(() => {...}, 1000);
  return () => clearInterval(interval);
}, []);
```

### 無限再レンダリング

```typescript
// ❌ 依存配列にオブジェクト
useEffect(() => {
  fetchData(filters);
}, [filters]); // filtersは毎回新しいオブジェクト

// ✅ 必要な値だけを依存に
useEffect(() => {
  fetchData(filters);
}, [filters.eventId, filters.userId]);
```

### 大量のデータ処理

```typescript
// 仮想スクロールを使用（react-window）
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={attendees.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <AttendeeCard attendee={attendees[index]} />
    </div>
  )}
</FixedSizeList>
```

## 今後の最適化案

1. **Service Worker**: オフライン対応とキャッシュ戦略
2. **IndexedDB**: セッションストレージの代替
3. **WebAssembly**: クイズ生成ロジックの高速化
4. **CDN**: 静的アセットの配信最適化
5. **HTTP/2 Server Push**: 重要リソースの先読み
