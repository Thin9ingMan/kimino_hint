# キミのヒント New Spec（ルーティング設計）

このドキュメントは、現行フロントのルーティング実装（例: [`Routes`](src/App.jsx:47) / [`Route`](src/App.jsx:48)）と、バックエンド API（[`docs/openapi.yaml`](docs/openapi.yaml)）を踏まえて、今後の画面・遷移を整理するための「新しいルーティング設計」を定義する。

- old spec（[`docs/spec.md`](docs/spec.md)）との 1:1 対応は行わない（対応できないため）。
- ここでの「イベント」は、API 上の Event（`/api/events`）＝クイズセッション（ルーム）を指す。

---

## 1. 設計方針

### 1.1 ルートの原則

1. **URL が状態の主（State in URL）**
   - 現行のように画面遷移の状態を [`useLocation`](src/components/Answer.jsx:2) の `location.state` に強く依存すると、リロード/直リンク/戻る進むで破綻しやすい。
   - 新設計では、原則として `:eventId` や `:questionNo` などのコンテキストは **パスパラメータ**、軽い条件は **クエリパラメータ**に寄せる。

2. **コンテキスト単位のネスト**
   - `eventId` に紐づく画面は `/events/:eventId/*` の配下にまとめる。
   - `me`（自分）系は `/me/*` にまとめる。

3. **命名を揃える**
   - kebab-case を採用し、`/make_false_selection` のようなスネークケースは廃止する。

4. **“ページ” と “UI部品” を分離しやすい URL を用意**
   - 画面の責務を「一覧」「詳細」「編集」「ウィザード（手順）」に整理し、ファイル構造の整理・テストの導線も作る。

### 1.2 認証/ガード

- ゲスト認証はアプリ起動時に完了している前提（例: [`useGuestAuth()`](src/hooks/useGuestAuth.js:5)）。
- 新設計では、**アプリ全体が要認証（ゲスト含む）**であることを明確にし、`/auth/*` は基本的に作らない。
  - 例外的に “認証エラーの説明” だけは `/error/auth` などに逃がしてもよい。

---

## 2. 新ルーティングマップ（提案）

### 2.1 トップ/共通

| パス | 役割 | ルートパラメータ | 備考 |
|---|---|---|---|
| `/` | エントリ（ルーティングのハブ） | - | 初期ロード後に `/home` へリダイレクトしてよい |
| `/home` | ホーム（入口） | - | 現行の [`Index`](src/Index.jsx:6) の立ち位置 |
| `/help` | 使い方/FAQ | - | 仕様・導線が不明瞭なのでドキュメント導線を確保 |
| `/error/auth` | 認証エラー案内 | - | [`useGuestAuth()`](src/hooks/useGuestAuth.js:5) が失敗した場合の遷移先として定義 |
| `*` | 404（Not Found） | - | ルーティング破綻時の受け皿 |

### 2.2 プロフィール（閲覧系）

API 対応: `GET /api/users/{userId}/profile`（[`/api/users/{userId}/profile`](docs/openapi.yaml:123)）

| パス | 役割 | ルートパラメータ | 備考 |
|---|---|---|---|
| `/profiles` | プロフィール一覧 | - | 現行の一覧（例: [`ListProfile`](src/App.jsx:61)） |
| `/profiles/:userId` | プロフィール詳細（他者） | `userId` | QR から開く “共有リンク” の着地点としても使用（現行: [`qrPayload`](src/components/MyProfile.jsx:21)） |

### 2.3 自分（me）

API 対応: `GET /api/me`（[`/api/me`](docs/openapi.yaml:57)）、`GET/PUT /api/me/profile`（[`/api/me/profile`](docs/openapi.yaml:163)）

| パス | 役割 | ルートパラメータ | 備考 |
|---|---|---|---|
| `/me` | 自分のハブ | - | `/me/profile` へリダイレクトしてよい |
| `/me/profile` | 自分のプロフィール表示 | - | 現行の [`MyProfile`](src/App.jsx:57) 相当 |
| `/me/profile/edit` | 自分のプロフィール編集 | - | 現行の [`EditProfile`](src/App.jsx:58) 相当 |
| `/me/friendships/received` | 受け取ったプロフィールカード一覧 | - | API 対応（[`/api/me/friendships/received`](docs/openapi.yaml:297)） |

### 2.4 イベント（＝ルーム/クイズセッション）

API 対応:
- `POST /api/events`（[`/api/events`](docs/openapi.yaml:325)）
- `POST /api/events/join-by-code`（[`/api/events/join-by-code`](docs/openapi.yaml:447)）
- `GET /api/events/{eventId}`（[`/api/events/{eventId}`](docs/openapi.yaml:365)）
- `GET /api/events/{eventId}/attendees`（[`/api/events/{eventId}/attendees`](docs/openapi.yaml:499)）
- `GET /api/events/{eventId}/live`（[`/api/events/{eventId}/live`](docs/openapi.yaml:541)）

| パス | 役割 | ルートパラメータ | 備考 |
|---|---|---|---|
| `/events` | イベント導線のハブ | - | 「作成」「参加」への入口 |
| `/events/new` | イベント作成 | - | `POST /api/events` を叩くフォーム |
| `/events/join` | 参加（招待コード入力） | - | 現行の [`Room`](src/components/Room.jsx:4) はここへ寄せる |
| `/events/:eventId` | ロビー（イベント概要/参加者一覧） | `eventId` | `GET /api/events/{eventId}` + `GET attendees` |
| `/events/:eventId/live` | ライブ状況（SSE購読） | `eventId` | `GET /api/events/{eventId}/live` を UI で反映 |

### 2.5 クイズ（イベント配下のウィザード）

現行の `/question` → `/answer` → `/result` は、`eventId` を軸にネストする。

| パス | 役割 | ルートパラメータ | 備考 |
|---|---|---|---|
| `/events/:eventId/quiz` | クイズ開始（説明/準備） | `eventId` | ここから `.../quiz/1` に遷移 |
| `/events/:eventId/quiz/:questionNo` | 問題表示 | `eventId`, `questionNo` | 現行の [`navigate()`](src/components/Answer.jsx:22) の state 依存を減らす |
| `/events/:eventId/quiz/:questionNo/answer` | 回答結果（正誤・解説） | `eventId`, `questionNo` | 現行の [`Answer`](src/App.jsx:51) の役割 |
| `/events/:eventId/result` | 結果（スコア/まとめ） | `eventId` | 現行の [`Result`](src/App.jsx:52) の役割 |

#### クイズ画面での状態の持ち方（推奨）

- **URL**: `eventId`, `questionNo` は必ず URL。
- **永続**: スコアや回答履歴は、(A) API に保存、または (B) `sessionStorage` に保存。
- **一時**: “直前の選択肢” 程度なら `location.state` を併用可だが、画面の復元に必須なデータは載せない。

### 2.6 QR（スキャン/共有）

QR の役割を「プロフィール共有」と「イベント参加」に分ける。

| パス | 役割 | ルートパラメータ | 備考 |
|---|---|---|---|
| `/qr` | QR ハブ | - | “プロフィール共有” と “イベント参加” の分岐 |
| `/qr/profile` | 自分のプロフィール共有 QR を表示 | - | 現行は [`MyProfile`](src/components/MyProfile.jsx:121) に内包されているため、将来的に分離可能 |
| `/qr/scan` | QR スキャン（プロフィール/イベントの両対応） | - | 現行の [`ReadQRCode`](src/App.jsx:59) 相当 |

QR の文字列仕様（推奨）:
- **プロフィール共有**: `https://{host}/{base}/profiles/{userId}`（現行の [`qrPayload`](src/components/MyProfile.jsx:21) と整合）
- **イベント参加**: `https://{host}/{base}/events/join?code={invitationCode}`

---

## 3. 画面遷移の基本フロー（提案）

### 3.1 初回起動

1. `/` ロード
2. ゲスト認証（例: [`createGuestUserRaw()`](src/hooks/useGuestAuth.js:30)）
3. 成功 → `/home`
4. 失敗 → `/error/auth`

### 3.2 プロフィール導線

- `/home` → `/me/profile`
- 初回（プロフィール未作成）: `/me/profile` で 404 を検知し、`/me/profile/edit` に誘導（現行の “404 なら編集へ” の流れを整理）

### 3.3 イベント導線

- 作成: `/events/new` → 成功 → `/events/:eventId`（ロビー）
- 参加: `/events/join?code=...` → 成功 → `/events/:eventId`
- ロビーから: `/events/:eventId/quiz` → `.../quiz/1` → `.../answer` → `.../result`

---

## 4. 既存ルートの扱い（移行の考え方）

現行のルート（例: `/room`, `/question`, `/answer` など）は、段階的に以下のいずれかへ寄せる。

- (推奨) **互換リダイレクト**: 旧ルートにアクセスしたら新ルートへ飛ばす（状態は URL か永続ストアで再構成）。
- (簡易) **当面残す**: 旧ルートは残しつつ、新規実装は新ルート配下でのみ行う。

---

## 5. ルーティング設計の最小合意（この docs のゴール）

- “プロフィール（閲覧/自分）” と “イベント（ルーム/クイズ）” を URL の階層で分離する。
- `eventId` をクイズの第一コンテキストとして `/events/:eventId/*` に閉じ込める。
- 直リンク/リロード耐性のために、画面復元に必須な値は URL か永続領域へ寄せる。

---

## 6. 「移行」か「作りなおし」か（推奨戦略）

結論: **全面リライト（作りなおし）を推奨**。

このコードベースは、現状でもルーティングが「ページの実体」ではなく「場当たりな画面遷移の集合」になっており、例えば [`location.state`](src/components/Answer.jsx:10) 前提の値が多い構造は、直リンク/リロード耐性を作る段階で結局大半を書き換えることになる。

なので、**ルーティング設計を先に確定（本ドキュメント）→ それに沿った “ページ単位の骨格” を新規で組み立てる**、が最短。

ただし「何でもかんでも壊す」リライトではなく、**境界（契約）を固定したリライト**にする。

### 6.1 固定する境界（ここは壊さない）

- バックエンド契約: [`docs/openapi.yaml`](docs/openapi.yaml)
  - 既存の [`apis`](src/api/client.js:12) を継続利用するか、同等のクライアントを新設して差し替える。
- 認証: ゲスト認証フロー（例: [`useGuestAuth()`](src/hooks/useGuestAuth.js:5)）
  - 「アプリ起動時にトークン確保」という前提は維持（ルーティングや画面実装をやり直しても、最初に通る認証は同じ）。

### 6.2 リライトの進め方（ルーティング起点）

1. 新ルートを前提に “ページ” を作る（空画面で良い）
   - `/home`, `/me/profile`, `/me/profile/edit`, `/profiles`, `/profiles/:userId`
   - `/events/new`, `/events/join`, `/events/:eventId`, `/events/:eventId/quiz/:questionNo`, `/events/:eventId/result`
2. 「URL で復元できる」最小状態を定義する
   - `eventId`, `questionNo` は URL に必須（本ドキュメントの方針通り）。
3. API 連携を 1 画面ずつ差し込む
   - まずは `/me/profile`（[`/api/me/profile`](docs/openapi.yaml:163)）と `/profiles/:userId`（[`/api/users/{userId}/profile`](docs/openapi.yaml:123)）から。

### 6.3 ガードレール（リライトを失敗させない）

- “完成するまで何も良くならない” を避けるため、ルーティング骨格 → プロフィール → イベント参加 の順で **縦に通す**。
- 旧ルート互換が必要になった場合だけ、最後に薄いリダイレクト層を追加する（例: `/room` → `/events/join`）。

この方針なら、ルーティング設計の恩恵（階層化・直リンク耐性・命名統一）を最短で取り込める。
