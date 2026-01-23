# Reactive API Cache Proposal: Replacing Tanstack Query

## 概要 (Overview)

このドキュメントは、Tanstack Query (TSQ) を軽量でカスタムなリアクティブキャッシュシステムに置き換えるための提案です。

### 問題点 (Current Issues)

1. **不適切なキャッシュの揮発性**
   - TSQは自動的にメモリキャッシュを保持し、ユーザーの直感に反するタイミングでrevalidateが実行される
   - 開発者の意図しないタイミングでのデータ再取得が発生

2. **データタイプごとの異なる要件**
   - `/me/profile`: キャッシュを長く保持すべき（頻繁な揮発はパフォーマンス低下）
   - 他人のデータ: 更新時に即座にrevalidateが必要（古いデータの残存はUX問題）

3. **TSQの過剰な機能**
   - 不要な機能が多く、バンドルサイズが大きい
   - 設定が複雑で、意図しない動作を引き起こしやすい

### 目標 (Goals)

- ✅ TSQを使用しない
- ✅ 軽量でnon-coherentなキャッシュシステム
- ✅ リアクティブな実装（コンポーネント内でのuseEffect禁止）
- ✅ 高速化に寄与する場合は最適化、不明な場合は安全側に倒す
- ✅ データタイプごとに異なるキャッシュ戦略

---

## アーキテクチャ (Architecture)

### 1. コアコンセプト

```
┌─────────────────────────────────────────┐
│         React Components                 │
│  (useQuery, useInvalidate hooks)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      CacheStore (Singleton)              │
│  - データストレージ (Map<key, value>)    │
│  - サブスクライバー管理                   │
│  - キャッシュポリシー適用                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          API Client Layer                │
│  (fetch wrapper with retry logic)        │
└─────────────────────────────────────────┘
```

### 2. キャッシュストア設計

```typescript
type CacheKey = string | readonly unknown[];
type CachePolicy = {
  ttl?: number;           // Time to live (ms), undefined = 無期限
  staleWhileRevalidate?: boolean; // 古いデータを返しつつ裏で更新
  onDemandOnly?: boolean; // 自動revalidateしない
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  policy: CachePolicy;
  status: 'fresh' | 'stale' | 'fetching';
}

class CacheStore {
  private cache = new Map<string, CacheEntry<any>>();
  private subscribers = new Map<string, Set<() => void>>();
  
  // データ取得（購読含む）
  subscribe(key: CacheKey, callback: () => void): () => void;
  
  // データ取得
  get<T>(key: CacheKey): T | undefined;
  
  // データ設定
  set<T>(key: CacheKey, data: T, policy: CachePolicy): void;
  
  // キャッシュ無効化
  invalidate(key: CacheKey | ((key: CacheKey) => boolean)): void;
  
  // ポリシー評価
  shouldRefetch(key: CacheKey): boolean;
}
```

### 3. リアクティブフック

```typescript
// React 19の新機能 use() を活用した実装
function useQuery<T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  policy?: CachePolicy
): T {
  const store = useCacheStore();
  const stringKey = serializeKey(key);
  
  // useSyncExternalStore で購読
  const data = useSyncExternalStore(
    (onStoreChange) => store.subscribe(stringKey, onStoreChange),
    () => store.get(stringKey)
  );
  
  // データがない、またはstaleの場合は取得
  if (data === undefined || store.shouldRefetch(stringKey)) {
    // Suspenseをサポート（Promiseをthrow）
    throw fetchAndCache(store, stringKey, fetcher, policy);
  }
  
  return data;
}

// キャッシュ無効化フック
function useInvalidate() {
  const store = useCacheStore();
  
  return useCallback((key: CacheKey | ((key: CacheKey) => boolean)) => {
    store.invalidate(key);
  }, [store]);
}

// Mutation用フック
function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    invalidateKeys?: CacheKey[];
  }
) {
  const invalidate = useInvalidate();
  const [state, setState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    data?: TData;
    error?: Error;
  }>({ status: 'idle' });
  
  const mutate = useCallback(async (variables: TVariables) => {
    setState({ status: 'loading' });
    try {
      const data = await mutationFn(variables);
      setState({ status: 'success', data });
      options?.onSuccess?.(data);
      options?.invalidateKeys?.forEach(invalidate);
      return data;
    } catch (error) {
      setState({ status: 'error', error: error as Error });
      throw error;
    }
  }, [mutationFn, invalidate, options]);
  
  return { ...state, mutate };
}
```

---

## キャッシュポリシー戦略

### データタイプ別の推奨ポリシー

#### 1. 自分のプロフィール (`/me/profile`)
```typescript
const MY_PROFILE_POLICY: CachePolicy = {
  ttl: 5 * 60 * 1000,        // 5分間有効
  staleWhileRevalidate: true, // 古いデータを表示しつつ裏で更新
  onDemandOnly: false,        // 自動revalidate有効
};

// 使用例
function useMyProfile() {
  return useQuery(
    ['profiles', 'me'],
    () => apis.profiles.getMyProfile(),
    MY_PROFILE_POLICY
  );
}
```

#### 2. 他人のプロフィール
```typescript
const USER_PROFILE_POLICY: CachePolicy = {
  ttl: 30 * 1000,            // 30秒間有効
  staleWhileRevalidate: false,
  onDemandOnly: false,
};

function useUserProfile(userId: string) {
  return useQuery(
    ['profiles', userId],
    () => apis.profiles.getProfile({ userId }),
    USER_PROFILE_POLICY
  );
}
```

#### 3. イベントデータ（更新頻度高）
```typescript
const EVENT_DETAIL_POLICY: CachePolicy = {
  ttl: 10 * 1000,            // 10秒間有効
  staleWhileRevalidate: false,
  onDemandOnly: false,
};

function useEventDetail(eventId: string) {
  return useQuery(
    ['events', eventId],
    () => apis.events.getEventById({ eventId }),
    EVENT_DETAIL_POLICY
  );
}
```

#### 4. 静的データ（ほぼ不変）
```typescript
const STATIC_DATA_POLICY: CachePolicy = {
  ttl: undefined,            // 無期限
  staleWhileRevalidate: false,
  onDemandOnly: true,        // 明示的な無効化のみ
};
```

---

## 使用例

### 基本的な使用

```typescript
// コンポーネント内でのAPI呼び出し
function MyProfileScreen() {
  const profile = useMyProfile();
  
  return <div>Hello, {profile.name}</div>;
}
```

### Mutation + Cache Invalidation

```typescript
function UpdateProfileForm() {
  const invalidate = useInvalidate();
  
  const { mutate, status } = useMutation(
    (data) => apis.profiles.updateMyProfile({ profile: data }),
    {
      onSuccess: () => {
        // 自分のプロフィールを無効化
        invalidate(['profiles', 'me']);
      }
    }
  );
  
  const handleSubmit = (formData) => {
    mutate(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={status === 'loading'}>保存</button>
    </form>
  );
}
```

### パターンマッチングで複数キャッシュ無効化

```typescript
function DeleteEventButton({ eventId }) {
  const invalidate = useInvalidate();
  
  const handleDelete = async () => {
    await apis.events.deleteEvent({ eventId });
    
    // 特定イベント
    invalidate(['events', eventId]);
    
    // パターンマッチング: すべてのイベントリストを無効化
    invalidate((key) => {
      if (Array.isArray(key) && key[0] === 'events' && key[1] === 'list') {
        return true;
      }
      return false;
    });
  };
  
  return <button onClick={handleDelete}>削除</button>;
}
```

---

## 技術詳細

### 1. キーのシリアライゼーション

```typescript
function serializeKey(key: CacheKey): string {
  if (typeof key === 'string') return key;
  
  // 配列・オブジェクトの場合は安定したJSON文字列化
  return JSON.stringify(key, (k, v) => {
    // キーをソートして一貫性を保つ
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v).sort().reduce((acc, key) => {
        acc[key] = v[key];
        return acc;
      }, {} as any);
    }
    return v;
  });
}
```

### 2. Suspenseサポート

```typescript
const suspensePromises = new Map<string, Promise<any>>();

async function fetchAndCache<T>(
  store: CacheStore,
  key: string,
  fetcher: () => Promise<T>,
  policy: CachePolicy
): Promise<T> {
  // 既に取得中の場合は同じPromiseを返す
  if (suspensePromises.has(key)) {
    return suspensePromises.get(key)!;
  }
  
  const promise = fetcher()
    .then((data) => {
      store.set(key, data, policy);
      suspensePromises.delete(key);
      return data;
    })
    .catch((error) => {
      suspensePromises.delete(key);
      throw error;
    });
  
  suspensePromises.set(key, promise);
  return promise;
}
```

### 3. リアクティビティの実装

```typescript
class CacheStore {
  private subscribers = new Map<string, Set<() => void>>();
  
  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);
    
    // アンサブスクライブ関数を返す
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }
  
  private notify(key: string) {
    this.subscribers.get(key)?.forEach((callback) => callback());
  }
  
  set<T>(key: string, data: T, policy: CachePolicy): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      policy,
      status: 'fresh',
    });
    
    // 購読者に通知
    this.notify(key);
  }
}
```

---

## 移行ガイド

### ステップ1: 新しいキャッシュプロバイダーの追加

```typescript
// app/providers.tsx
import { CacheProvider } from '@/shared/cache/CacheProvider';

export function AppProviders({ children }) {
  return (
    <MantineProvider theme={theme}>
      <CacheProvider>
        {/* TSQのQueryClientProviderはまだ残す */}
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </CacheProvider>
    </MantineProvider>
  );
}
```

### ステップ2: 段階的な移行

```typescript
// 旧: TSQ版
import { useSuspenseQuery } from '@/shared/hooks/useSuspenseQuery';

function MyComponent() {
  const data = useSuspenseQuery(['key'], fetcher);
  // ...
}

// 新: カスタムキャッシュ版
import { useQuery } from '@/shared/cache/hooks';

function MyComponent() {
  const data = useQuery(['key'], fetcher, POLICY);
  // ...
}
```

### ステップ3: TSQの削除

すべてのコンポーネントを移行後：
1. `package.json`から`@tanstack/react-query`を削除
2. `QueryClientProvider`を削除
3. TSQ関連のファイルを削除

---

## パフォーマンス考慮事項

### メリット

1. **バンドルサイズ削減**: TSQ (~50KB) → カスタム実装 (~5KB)
2. **メモリ効率**: 必要最小限のキャッシュエントリのみ保持
3. **予測可能**: 明示的なポリシーで動作が明確

### トレードオフ

1. **機能の削減**: DevTools、オフライン同期などの高度な機能なし
2. **メンテナンス**: 自前実装のため、バグ修正は自分たちで行う
3. **エコシステム**: TSQのエコシステム（プラグイン等）は使えない

### 推奨事項

- **小〜中規模アプリ**: カスタム実装で十分
- **大規模アプリ**: TSQの機能が必要になる可能性あり
- **現在の状況**: キャッシュ要件がシンプルなため、カスタム実装が適している

---

## 次のステップ

### 1. プロトタイプ実装
- [ ] `CacheStore`クラスの実装
- [ ] `useQuery`, `useMutation`フックの実装
- [ ] Suspense対応

### 2. 検証
- [ ] 既存の1-2コンポーネントで試験的に使用
- [ ] パフォーマンス測定
- [ ] エッジケースのテスト

### 3. 全体移行（承認後）
- [ ] すべてのTSQ使用箇所をリスト化
- [ ] 優先順位をつけて段階的に移行
- [ ] TSQの削除

---

## 結論

このカスタムキャッシュシステムは、以下を実現します：

✅ **軽量**: TSQの1/10のサイズ  
✅ **柔軟**: データタイプごとの細かいポリシー設定  
✅ **安全**: 不明な場合は再取得（安全側に倒れる）  
✅ **リアクティブ**: `useSyncExternalStore`によるuseEffect不要の実装  
✅ **Suspense対応**: 既存のError Boundaryとの互換性  

このアプローチにより、TSQの問題を解決しつつ、アプリケーションの要件に最適化されたキャッシュシステムを構築できます。
