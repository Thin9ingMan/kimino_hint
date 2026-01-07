# Compat layer plan（legacy を尊重しつつ New Spec に寄せる）

このドキュメントは、現行の legacy 実装（[`oldsrc/`](oldsrc/:1)）を **大規模リファクタせず**に、新設計（[`docs/newspec/routes.md`](docs/newspec/routes.md:1) / [`docs/newspec/directory-structure.md`](docs/newspec/directory-structure.md:1)）へ段階的に統合するための「互換性計画（Compat layer）」を定義する。

> 重要: ここでいう Compat layer は「旧 UI を温存する」ためではなく、**旧ルート/旧コンポーネントをそのまま触れる**（= レガシー開発者が従来の感覚で編集できる）状態を維持しながら、アプリ全体の骨格を New Spec に移すための “薄い変換層” を指す。

---

## 0. 要求（この計画が守るもの）

レガシー開発者目線で、以下が **以前と同じ** であることを優先する。

1. 以前と同じルーティングパス
   - 例: [`Routes`](oldsrc/App.jsx:47) にある `"/room"`, `"/question"` など。
2. 以前と同じコンポーネントコード
   - 例: [`Room`](oldsrc/components/Room.jsx:1), [`Question`](oldsrc/components/question.jsx:1), [`Answer`](oldsrc/components/Answer.jsx:1) 等の “現物” を基本そのまま使えること。

同時に、New Spec の「URL が状態の主（State in URL）」等の方針（[`docs/newspec/routes.md`](docs/newspec/routes.md:14)）を新規実装側では満たしていきたい。

---

## 1. 非目標（やらないこと）

- legacy コンポーネントの全面書き換え（TypeScript 化、Mantine 化、状態管理刷新 など）
- legacy ディレクトリの再配置（`oldsrc/` を `src/` に移動する等）
- 「旧ルートを消して新ルートだけにする」一括移行

---

## 2. Compat layer の設計原則

### 2.1 Strangler（巻き取り）方式

- **新規の骨格**は New Spec 側（[`src/app/router.tsx`](src/app/router.tsx:1)）で増やす
- **旧ルート互換**は Compat 層で受け止める
- 実体画面（Route element）は「旧コンポーネントをそのまま呼ぶ」か「新 Screen を呼ぶ」かを **1 画面単位で差し替え可能**にする

### 2.2 互換性の「境界」を固定する

固定（壊さない）:
- バックエンド契約（[`docs/openapi.yaml`](docs/openapi.yaml:1)）
- ゲスト認証フロー（旧: [`useGuestAuth()`](oldsrc/hooks/useGuestAuth.js:1) / 新: App 起動時に完了する前提）

可変（段階的に変える）:
- ルート階層（旧: フラット / 新: `/events/:eventId/*` など）
- state の受け渡し（旧: `location.state` 依存 / 新: URL + 永続）

---

## 3. 互換性のスコープ（何を互換にするか）

### 3.1 互換対象: URL（旧ルートは残す）

旧ルートは「廃止」ではなく **互換入口**として存続させる（当面）。

旧ルート定義の一次資料は [`oldsrc/App.jsx`](oldsrc/App.jsx:47) とする。

### 3.2 互換対象: 旧コンポーネントの import 可能性

- New Router から legacy コンポーネントを直接 `import` できる状態を維持する
- 旧コードを “読みやすくするための変更” は、原則 **旧ファイルには入れない**（Compat 側で吸収）

### 3.3 互換対象: CSS / 見た目

- legacy 画面は legacy の CSS をそのまま使ってよい（例: [`oldsrc/start_page.css`](oldsrc/start_page.css:1)）
- 新 Screen は New Spec 方針（Mantine）で実装
- ただし「同一 URL で新旧が混在」すると UX が破綻しやすいので、同じ導線上は **どちらかに寄せる**（後述のフェーズ管理で制御）

---

## 4. Compat layer の実装方針（コード配置）

> ここは “計画” であり、実装場所の提案。将来の実装は New Spec の構成（[`docs/newspec/directory-structure.md`](docs/newspec/directory-structure.md:27)）に沿って `src/compat/` を追加する。

### 4.1 追加するディレクトリ（提案）

- `src/compat/`
  - `legacyRoutes.tsx`: 旧ルートの集約（path → element）
  - `adapters/`: URL ↔ legacy state を変換する薄い wrapper
  - `deprecations.ts`: 旧ルートの段階的廃止（リダイレクト開始日等）

New Router 側（[`src/app/router.tsx`](src/app/router.tsx:1)）では、
- New Spec routes を通常通り定義
- それに加えて **Compat routes（旧ルート）** を最後にマージする

### 4.2 「旧 App をそのまま mount しない」

[`oldsrc/App.jsx`](oldsrc/App.jsx:46) は `BrowserRouter` を内包しているため、New App の Router の下にそのまま埋め込むと二重 Router になりやすい。

そのため Compat 層は、`oldsrc/App.jsx` を呼ぶのではなく、旧ルートの element で参照している画面コンポーネントを直接使う。

例（旧ルート → 旧コンポーネント）:
- `"/room"` → [`Room`](oldsrc/components/Room.jsx:1)
- `"/question"` → [`Question`](oldsrc/components/question.jsx:1)
- `"/answer"` → [`Answer`](oldsrc/components/Answer.jsx:1)

---

## 5. 旧ルート → 新ルート対応表（互換の出し方）

互換の出し方は 2 種類に分ける。

- A. **Alias（同一実体）**: 旧ルートも新ルートも、同じ “実体画面” を指す
- B. **Redirect（段階的廃止）**: 旧ルートは新ルートへ飛ばす（パラメータ/クエリを可能な範囲で移送）

| legacy path（oldsrc） | new spec path | 戦略 | 備考 |
|---|---|---|---|
| `/`（[`Index`](oldsrc/Index.jsx:6)） | `/home` | A（当面は `/`=legacy、`/home`=new） | New Spec は `/` をハブにできるが（[`docs/newspec/routes.md`](docs/newspec/routes.md:42)）、レガシー維持のため **即 redirect しない** |
| `/profiles` | `/profiles` | A（同一 URL） | ここは New Spec と一致するため、差し替えは「実体画面だけ」を段階的に行う |
| `/profiles/:userId` | `/profiles/:userId` | A（同一 URL） | 同上 |
| `/my_profile` | `/me/profile` | A（新側を legacy 実体で始める） | 新 Screen の中身を legacy で代用する形でも良い |
| `/edit_profile` | `/me/profile/edit` | A | 同上 |
| `/room` | `/events/join` | A | [`Room`](oldsrc/components/Room.jsx:1) を `/events/join` にも割り当てる（“同じ画面を別名で公開”） |
| `/read_qr` | `/qr/scan` | A | 旧: [`ReadQRCode`](oldsrc/components/ReadQRCode.jsx:1) |
| `/make_qr` | `/qr/profile` | A | 旧: [`MakeQRCode`](oldsrc/components/MakeQRCode.jsx:1) |
| `/question` | `/events/:eventId/quiz/:questionNo` | B（将来的に redirect） | 旧は `eventId` 文脈が URL にない。Compat では当面 `/question` を残し、新側のウィザードが完成したら redirect |
| `/answer` | `/events/:eventId/quiz/:questionNo/answer` | B | 同上 |
| `/result` | `/events/:eventId/result` | B | 同上 |
| `/make_question` | `/events/new`（or admin route） | B（保留） | 新 Spec には直対応がないため、当面 legacy として維持 |
| `/make_false_selection` | （未定） | B（保留） | kebab-case 化の対象だが、まずは維持 |
| `/profile` | `/me/profile`（想定） | B（保留） | 旧の `Profile` は “自分/他者” が曖昧なので New Spec に合わせて再整理 |
| `/profile_history` | `/me/friendships/received` | B（保留） | 新 Spec で役割が近いが、API/表示が一致するか要確認 |

---

## 6. 状態互換（location.state 依存をどう扱うか）

New Spec は「復元に必須な値を URL or 永続へ」（[`docs/newspec/routes.md`](docs/newspec/routes.md:98)）が原則だが、legacy は `location.state` 依存が残りうる。

Compat 層は “旧コンポーネントを直さずに動かす” ために、次の順序で吸収する。

1. **URL に載っているものは URL を正とする**
   - `eventId`, `questionNo` など
2. legacy が `location.state` を必須としている場合は、Compat adapter で補完する
   - 補完元は `sessionStorage`（最低限）または API
3. redirect するときは「不足情報が揃ってから」
   - 揃わない場合はエラー画面へ（New Spec の `/error/*` 体系に寄せる）

---

## 7. 段階的移行フェーズ（推奨）

### Phase 0: 旧ルートの “受け皿” を New Router に追加

- New App の router に legacy routes を追加し、`oldsrc` の画面を element として割り当てる
- これによりアプリの起点は New Spec 側（[`src/app/App.tsx`](src/app/App.tsx:1) / [`src/app/router.tsx`](src/app/router.tsx:1)）へ寄るが、レガシーは従来どおり触れる

### Phase 1: 新ルートを増やすが、中身は legacy を alias する

- `/events/join`, `/qr/scan` 等を追加し、実体は legacy コンポーネントで開始
- ルート階層だけ New Spec に揃え、画面実装は “そのまま” を維持

### Phase 2: 置き換え可能な画面から New Screen 実装に差し替え

- `/profiles`, `/me/profile` など、直リンク復元が容易なところから新 Screen に差し替え
- この時点でも **旧ルートは残す**（ただし同一実体を指す）

### Phase 3: クイズ導線（state 依存が強い）の新実装を作り、旧を redirect にする

- `/events/:eventId/quiz/*` を New Spec で完走できるようにする
- 完走後に `/question` `/answer` `/result` を redirect（または “旧 UI のままでも良いが URL は新へ” のどちらか）

---

## 8. 互換性維持の運用ルール（レガシーを壊さない）

1. legacy 画面（[`oldsrc/`](oldsrc/:1)）は **原則そのまま**
   - 修正する場合も「挙動不具合」や「API 追従」など最小に限定
2. 互換対応は Compat 側で吸収
   - “新しい書き方” を旧へ持ち込まない
3. 新実装は New Spec に従う
   - URL の階層化、命名統一（kebab-case）など（[`docs/newspec/routes.md`](docs/newspec/routes.md:22)）

---

## 9. 受け入れ条件（Done の定義）

- 旧ルート一覧（[`oldsrc/App.jsx`](oldsrc/App.jsx:47)）の主要パスにアクセスして、同等の画面が出る
- 新ルート一覧（[`docs/newspec/routes.md`](docs/newspec/routes.md:40)）の主要パスにアクセスして、少なくとも “到達可能”
  - Phase 1 では「中身が legacy でも可」
- ゲスト認証失敗時に、新 spec のエラー導線（例: `/error/auth`）へ誘導できる
  - legacy の認証 UI（[`oldsrc/App.jsx`](oldsrc/App.jsx:25)）を残すかは Phase 0 の実装次第だが、どちらでも “迷子にならない” こと
