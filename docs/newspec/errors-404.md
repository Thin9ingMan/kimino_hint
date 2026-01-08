# 404 / Not Found ハンドリング指針（New Spec）

このドキュメントは、フロントエンドにおける **HTTP 404 / Not Found** の扱い方を整理し、

- 画面ごとの「404 の意味付け」（ユーザーにどう見せるか）
- API からの 404 を UI ロジックにどうマッピングするか
- AI コーダー / 自動生成ツールが壊してはいけない前提

を明文化するものです。

既存実装の代表例として、以下の Screen を前提にしています。

- 自分のプロフィール表示: [`MyProfileScreen`](src/feat/me/screens/MyProfileScreen.tsx:53)
- 自分のプロフィール編集: [`EditMyProfileScreen`](src/feat/me/screens/EditMyProfileScreen.tsx:279)
- 受け取ったプロフィール一覧: [`ProfileListScreen`](src/feat/profiles/screens/ProfileListScreen.tsx:140)

---

## 0. TL;DR（AI コーダー向け）

1. **「まだ作っていない」状態を 404 で表現している API がある**。
   - 例: `GET /api/me/profile` の 404 は「エラー」ではなく「未作成」の意味で扱う。
   - 画面によっては 404 を ErrorBoundary で特別扱いし、画面によってはクエリ関数内で `null` などの **ドメイン値に変換**する。

2. **404 = すべて一律に「赤いエラー画面」ではない**。
   - 自分プロフィール表示（`/me/profile`）では「プロフィールを作りましょう」という **ポジティブなメッセージ**に変換する。
   - 自分プロフィール編集（`/me/profile/edit`）では 404 を UI から隠蔽し、**空フォームで作成を開始できる**ようにする。

3. **リスト画面では「一部のプロフィールが 404」でも画面全体を壊さない**。
   - 受け取ったプロフィール一覧では、送信者プロフィールの取得失敗（404 含む）は `null` として扱い、
     `ユーザー {id}` などのフォールバック表示で **一覧自体は崩さない**。

4. **ルーティング破綻としての 404（`*` ルート）と、API レベルの 404 を混同しない**。
   - ルーティング 404（URL が存在しない）は、`/error/*` やグローバル 404 画面で処理（[`docs/newspec/routes.md`](docs/newspec/routes.md) 参照）。
   - API 404 はコンテキストごとに「未作成」「非公開」「削除済み」などの **ビジネス状態にマッピング**して扱う。

> **禁止事項（AI コーダー）**
>
> - 既存の 404 ハンドリングを「全部共通のエラー UI」にまとめないこと。
> - `GET /api/me/profile` の 404 をそのまま ErrorBoundary まで投げて「エラー画面」に変えないこと。
> - 受け取ったプロフィール一覧で、送信者プロフィールの取得失敗を理由に一覧全体をエラーにしないこと。

---

## 1. 404 の分類（何が "Not Found" なのか）

New Spec では、少なくとも次の 3 種類の "Not Found" が存在しうることを意識する。

1. **ルーティング 404**
   - 該当する `Route` が存在しないパスへのアクセス。
   - 例: [`*` ルート（グローバル 404）](docs/newspec/routes.md:40) で処理するケース。

2. **自分に紐づくリソースの 404**
   - `GET /api/me/profile` のように、「存在していれば一意に決まる」自分専用リソースの 404。
   - 実際には「未作成」や「初期状態」であることを意味することがある。

3. **他人 / 任意 ID に紐づくリソースの 404**
   - `GET /api/users/{userId}/profile`、`GET /api/events/{eventId}` 等の 404。
   - 「ID が無効」「リソースが削除済み」「非公開」など、文脈によって意味が変わる。

この区別をせずに「404 = すべて同じ赤エラー」にしてしまうと、UX とドメイン表現の両方が崩れる。

---

## 2. 既存実装における 404 の扱い

### 2.1 自分のプロフィール表示 [`MyProfileScreen`](src/feat/me/screens/MyProfileScreen.tsx:53)

- データ取得は [`useSuspenseQuery`](src/shared/hooks/useSuspenseQuery.ts:1) 経由で `apis.profiles.getMyProfile` を叩き、
  例外は [`ErrorBoundary`](src/shared/ui/ErrorBoundary.tsx:1) に流している。
- ErrorBoundary の `fallback` 内で、[`ResponseError`](src/feat/me/screens/MyProfileScreen.tsx:14) かつ `status === 404` を検出し、
  それを「あなたのプロフィールはまだ作成されていません」として **ポジティブに再解釈**する。
  - 404 のとき: 青い Alert + 「プロフィールを作成する」ボタン（`/me/profile/edit` に遷移）。
  - 404 以外: 赤い Alert + 再試行ボタン（技術的失敗として扱う）。
- さらに、正常系コンポーネント [`MyProfileContent`](src/feat/me/screens/MyProfileScreen.tsx:16) 内では、
  レスポンスが 200 でも中身が空（`isUiProfileEmpty(profile)` が true）の場合、
  UX 上は 404 と同等の「未作成」扱いで Alert + 作成導線を出している。

> 結論: `/me/profile` では **HTTP 404 と「空プロフィール」をどちらも "未作成" に寄せて、
> ユーザーに「プロフィールをつくろう」という成長ステップとして提示する。**

### 2.2 自分のプロフィール編集 [`EditMyProfileScreen`](src/feat/me/screens/EditMyProfileScreen.tsx:279)

- 初期データ取得のクエリ関数内で、`getMyProfile` の 404 を特別扱いしている。
  - `ResponseError` かつ `status === 404` の場合、**例外として投げずに `null` を返す**。
  - それ以外のエラーはそのまま throw し、ErrorBoundary に処理を委ねる。
- `initialData` が `null` の場合は `const pd = initialData ?? {};` で空オブジェクトとして扱い、
  全フィールドを空文字列に初期化したフォーム（空フォーム）を生成する。
- 結果として、ユーザー視点では:
  - 既存プロフィールがある → 値が入った状態で編集開始
  - プロフィール未作成（API 404） → 空フォームから新規作成開始
 となり、**404 という存在は UI に一切露出しない**。

> 結論: `/me/profile/edit` では **404 を UI レイヤーから隠蔽し、「新規作成」と「編集」を同一フォームで吸収する。**
>
> 404 の判定はクエリ関数内に閉じ込め、ErrorBoundary には 404 を流さない。

### 2.3 受け取ったプロフィール一覧 [`ProfileListScreen`](src/feat/profiles/screens/ProfileListScreen.tsx:140)

- 一覧の取得（`listReceivedFriendships`）は、通常 200 + `[]` を返す設計を想定しており、
  404 は「ルーティングやバックエンド実装の不整合」に近い異常系として、ErrorBoundary の汎用エラーに任せている。
- 一覧が空の場合は、青い Alert + QR コード画面への導線として扱い、「まだ受け取っていない状態」をポジティブに表現している。
- 各アイテムの送信者プロフィールを N+1 で取得する処理では、
  `getUserProfile({ userId })` の失敗（404 含む）を `catch` で吸収し、`profilesByUserId[userId] = null` として記録する。
  - UI 上は `pickDisplayName(profileData) || "ユーザー {id}"` としてフォールバックし、
    **一部のプロフィールが取得できなくても一覧全体は壊さない** ようにしている。

> 終端画面ではなく「一覧」の場合、**個々の要素の 404/取得失敗は、可能な限り UI 上の部分的な欠損として扱い、
> 画面全体をエラーにしない** のが現状の方針である。

---

## 3. 新規実装時のパターン

### 3.1 自分に紐づくリソース（`/me/*`）の 404

対象例:

- `/me/profile`（自分のプロフィール）
- 将来的な `/me/settings` など、「存在していれば常に 1 つだけ」なリソース

**基本方針:**

1. **表示 Screen（閲覧系）では、404 を「未作成」などのドメイン状態としてユーザーに説明する。**
   - 例: [`MyProfileScreen`](src/feat/me/screens/MyProfileScreen.tsx:53) と同様に、
     ErrorBoundary の `fallback` で 404 を検出