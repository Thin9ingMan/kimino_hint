# キミのヒント New Spec（ディレクトリ/ファイル構成案）

このドキュメントは、新ルーティング設計（[`docs/newspec/routes.md`](docs/newspec/routes.md)）に沿って **全面リライト（rewrite）**する前提で、フロントエンドのディレクトリ/ファイル構成方針を定義する。

- migrate しない（既存コードは一切引き継がない）
- 引き継ぐのは **機能要件とハート**（API 契約は [`docs/openapi.yaml`](docs/openapi.yaml) を唯一の正とする）
- ルーティングは React Router（file-based routing ではない）
- UI は Mantine に統一（既存 CSS/UI 部品の継承はしない）

---

## 1. oldsrc から「考え方」だけ pick する（コードは捨てる）

oldsrc の「良かったところ」は、実装ではなく **分割の発想**として採用する。

- API クライアントを分離している点（[`oldsrc/api/`](oldsrc/api/)）
- hooks を独立させている点（[`oldsrc/hooks/`](oldsrc/hooks/)）
- 画面っぽいものをまとめようとした点（[`oldsrc/components/screens/`](oldsrc/components/screens/)）
- UI の共通部品を切り出そうとした点（[`oldsrc/components/ui/`](oldsrc/components/ui/)）

一方で、`components/` 配下に「画面」「UI」「機能ロジック」が混在しやすく、ルーティング設計（URL 階層）とモジュール境界が一致しない問題が起きやすい。

---

## 2. 新ディレクトリ方針（rewrite 前提）

### 2.1 結論: 「app が組み立て」「feat が機能の本体」「shared が横断」

- `src/app/`:
  - ルータ、Provider、レイアウト、アプリ初期化など「組み立て」だけ
- `src/feat/`:
  - 機能（= ルーティング設計上のコンテキスト）ごとに閉じる
  - **Screen（Route の element）を直接置く**（`pages/` は作らない）
- `src/shared/`:
  - どの feature にも属さない横断部品（UI primitives、hooks、utils、API クライアント、認証など）
  - 認証や API クライアントもここに集約

### 2.2 ルーティングとディレクトリの対応

[`docs/newspec/routes.md`](docs/newspec/routes.md) のコンテキスト単位に合わせて feat を切る。

- `/me/*` → `feat/me/`
- `/profiles/*` → `feat/profiles/`
- `/events/*` → `feat/events/`
- `/events/:eventId/quiz*` → `feat/quiz/`（クイズは events 配下でなく独立した機能として分離）
- `/qr/*` → `feat/qr/`
- 共通（`/home`, `/help`, `/error/*`, `404`）→ `feat/misc/`（または `feat/home/` などに分ける）

### 2.3 「Screen」と「部品」「model」の置き場所（pages を作らない）

React Router は file-based routing ではないため、Route の `element` は **任意のコンポーネントを直で参照**できる。

- `feat/**/screens/*Screen.tsx`:
  - ルーティングで直接指定する画面コンポーネント
  - 画面内で必要な API 呼び出しや状態管理を開始してよい（ただし共通化は `feat/**/` 内に寄せる）
- `feat/**/components/`:
  - 特定 feat 専用の部品（Screen を軽くするための分割）
- `feat/**/index.ts`:
  - その機能領域（feat配下）でのみ使う型定義、値オブジェクト、ドメインロジック、APIレスポンス→UI用データへの変換関数などを必要最小限にまとめて配置する
  - 例: クイズ進行の状態型、プロフィール編集フォームの値型、APIレスポンス→表示用データ変換、バリデーション関数など
  - "UI部品"や"APIクライアント"のような横断的なものは shared/ に置く
  - 定義数を抑え、肥大化しないために、定義は減らす努力をする。別にインラインで書いてもいいわけだしね。


### 2.4 Mantine 前提のスタイル方針

- 基本は Mantine のコンポーネントと theme で完結させる
- 生 CSS（`*.css`）は原則置かない（必要なら `src/app/styles/` に限定して「グローバル最小」）
- CSS Modules を使うとしても「Mantine で表現できない局所」だけに限定（rewrite の姿勢を明確にする）

---

## 3. 推奨ディレクトリ構成（案）

> TypeScript 前提（`tsconfig.json` があるため）。新規実装は `*.ts` / `*.tsx` に寄せる。

```
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
    layouts/
      RootLayout.tsx
    styles/
      theme.ts
      global.css

  feat/
    home/
      screens/
        HomeScreen.tsx

    me/
      screens/
        MeHubScreen.tsx
        MyProfileScreen.tsx
        EditMyProfileScreen.tsx
        ReceivedFriendshipsScreen.tsx
      components/
        MyProfileCard.tsx
      index.ts

    profiles/
      screens/
        ProfileListScreen.tsx
        ProfileDetailScreen.tsx
      components/
        ProfileCard.tsx
      index.ts

    events/
      screens/
        EventsHubScreen.tsx
        CreateEventScreen.tsx
        JoinEventScreen.tsx
        EventLobbyScreen.tsx
        EventLiveScreen.tsx
      components/
        EventCard.tsx
      index.ts

    quiz/
      screens/
        QuizIntroScreen.tsx
        QuizQuestionScreen.tsx
        QuizAnswerScreen.tsx
        QuizResultScreen.tsx
      components/
        QuizProgress.tsx
      index.ts

    qr/
      screens/
        QrHubScreen.tsx
        QrProfileScreen.tsx
        QrScanScreen.tsx
      components/
        QrCard.tsx

    misc/
      screens/
        HelpScreen.tsx
        AuthErrorScreen.tsx
        NotFoundScreen.tsx

  shared/
    api/
      http.ts
      client.ts
      errors.ts
      me.ts
      profiles.ts
      events.ts
      quiz.ts
    auth/
      useGuestAuth.ts
      tokenStorage.ts
    lib/
      sse.ts
      storage.ts
    ui/
      AppShell.tsx
      Page.tsx
    hooks/
      useQueryParams.ts
    utils/
      assert.ts

  assets/
```

ポイント:

- `src/app/router.tsx` にルート定義を集約し、各 `*Screen.tsx` を直接 import して `element` に渡す
- `events/quiz/` は「URL 的には events 配下」なので、この階層のまま閉じる
- `shared/api/` に API クライアント・API ラッパを集約（`feat/**/api/` は作らない）
- 認証も `shared/auth/` に集約
- `shared/ui/` は Mantine 上に構築する **薄い wrapper**（見た目の共通化ではなく、レイアウトとアクセシビリティの統一が目的）

---

## 4. ルート → Screen 対応表（routes.md 準拠）

| Route | Screen（例） |
|---|---|
| `/` | `app/router.tsx` で `/home` へリダイレクト（実体 Screen は持たない） |
| `/home` | `feat/home/screens/HomeScreen.tsx` |
| `/help` | `feat/misc/screens/HelpScreen.tsx` |
| `/error/auth` | `feat/misc/screens/AuthErrorScreen.tsx` |
| `*` | `feat/misc/screens/NotFoundScreen.tsx` |
| `/profiles` | `feat/profiles/screens/ProfileListScreen.tsx` |
| `/profiles/:userId` | `feat/profiles/screens/ProfileDetailScreen.tsx` |
| `/me` | `feat/me/screens/MeHubScreen.tsx`（`/me/profile` へリダイレクト可） |
| `/me/profile` | `feat/me/screens/MyProfileScreen.tsx` |
| `/me/profile/edit` | `feat/me/screens/EditMyProfileScreen.tsx` |
| `/me/friendships/received` | `feat/me/screens/ReceivedFriendshipsScreen.tsx` |
| `/events` | `feat/events/screens/EventsHubScreen.tsx` |
| `/events/new` | `feat/events/screens/CreateEventScreen.tsx` |
| `/events/join` | `feat/events/screens/JoinEventScreen.tsx` |
| `/events/:eventId` | `feat/events/screens/EventLobbyScreen.tsx` |
| `/events/:eventId/live` | `feat/events/screens/EventLiveScreen.tsx` |
| `/events/:eventId/quiz` | `feat/events/quiz/screens/QuizIntroScreen.tsx` |
| `/events/:eventId/quiz/:questionNo` | `feat/events/quiz/screens/QuizQuestionScreen.tsx` |
| `/events/:eventId/quiz/:questionNo/answer` | `feat/events/quiz/screens/QuizAnswerScreen.tsx` |
| `/events/:eventId/result` | `feat/events/quiz/screens/QuizResultScreen.tsx`（events 直下に置きたいなら `feat/events/screens/` でも良い） |
| `/qr` | `feat/qr/screens/QrHubScreen.tsx` |
| `/qr/profile` | `feat/qr/screens/QrProfileScreen.tsx` |
| `/qr/scan` | `feat/qr/screens/QrScanScreen.tsx` |

---

## 5. 命名/実装ルール（最低限）

- ルーティングの unit は **Screen** と呼ぶ（`*Screen.tsx`）
- `routes.md` の命名（kebab-case）に合わせる（URL 以外も、変数/ファイル名の意味を揃える）
- `feat/**` は「その配下だけ見れば、その機能が読める」状態を目指す
- 共通化は慎重に（早すぎる shared 化を避け、まずは feat 内で閉じる）

---

## 6. rewrite の姿勢を明確にするために「やらないこと」

- `oldsrc/` からコンポーネント/スタイル/ルータ定義をコピーしない
- `components/` という万能ディレクトリを作らない
- `pages/` という “file-based routing っぽい置き場” を作らない
- CSS を積み上げて UI を作らない（Mantine で作る）
