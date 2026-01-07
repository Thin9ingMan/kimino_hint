# Compat layer plan（legacy を尊重しつつ New Spec に寄せる / “気づかれない移行”）

このドキュメントは、既存の画面資産を **大規模リファクタせず**に、新設計（[`docs/newspec/routes.md`](docs/newspec/routes.md:1) / [`docs/newspec/directory-structure.md`](docs/newspec/directory-structure.md:1)）へ段階的に統合するための「互換性計画（Compat layer）」を定義する。

> 最重要: 目的は「旧 UI を温存する」ではない。
> legacy 開発者が **いつも通り**に画面コンポーネントを編集し続けても、裏側では New Spec に統合され、結果として変更がアプリ全体に反映される状態を作る。
> 
> つまり理想は、legacy 開発者にとって「編集対象・編集手順・URL」が **以前と変わらない** のに、アプリの骨格だけが New Spec へ置換されていること。

---

## 0. 要求（この計画が守るもの）

legacy 開発者目線で、以下が **以前と同じ** であることを最優先する。

1. 以前と同じルーティングパス
   - 例: `/room`, `/question`, `/answer` など。
2. 以前と同じコンポーネント編集体験
   - legacy 開発者の主戦場は **[`src/components/`](src/components/:1)**（および配下）とする。
   - 例: [`Room`](src/components/Room.jsx:1), [`Question`](src/components/question.jsx:15), [`Answer`](src/components/Answer.jsx:7), [`Result`](src/components/Result.jsx:4) 等。

同時に、新規実装側では New Spec の方針（例: URL が状態の主（State in URL））を満たしていく（[`docs/newspec/routes.md`](docs/newspec/routes.md:14)）。

---

## 1. 非目標（やらないこと）

- legacy コンポーネントの全面書き換え（TypeScript 化、Mantine 化、状態管理刷新 など）
- legacy 開発者が触るファイルの再配置（例: [`src/components/`](src/components/:1) を別階層へ移動）
- 「旧ルートを消して新ルートだけにする」一括移行

---

## 2. Compat layer の設計原則

### 2.1 Strangler（巻き取り）方式

- **新規の骨格**は New Spec 側（例: [`src/app/router.tsx`](src/app/router.tsx:1)）で増やす
- **旧ルート互換**は Compat 層で受け止める
- 実体画面（Route element）は「[`src/components/`](src/components/:1) の画面を呼ぶ」か「新 Screen を呼ぶ」かを **1 画面単位で差し替え可能**にする

### 2.2 “legacy の見え方” を固定し、裏側だけを差し替える

固定（壊さない/legacy に見せ続ける）:
- URL（パス文字列）: 既存パスを維持（例: `/room`, `/question`）
- 画面コンポーネントの配置/名前/Export 形（例: [`Room`](src/components/Room.jsx:1) が default export である、など）
- state 受け渡しの既存依存（例: [`useLocation()`](src/components/Answer.jsx:8) 経由の [`location.state`](src/components/Answer.jsx:10)）

可変（段階的に変える/ただし legacy には直接見せない）:
- ルート階層（旧: フラット / 新: `/events/:eventId/*` 等）
- state の正規化（旧: [`location.state`](src/components/Answer.jsx:10) 依存 / 新: URL + 永続）

---

## 3. 互換性のスコープ（何を互換にするか）

### 3.1 互換対象: URL（旧ルートは残す）

旧ルートは「廃止」ではなく **互換入口**として存続させる（当面）。

- 旧 URL は維持（アクセスすると従来と同等の画面が出る）
- 新 URL は併設（必要なら alias として追加提供）

### 3.2 互換対象: legacy コンポーネントの import 可能性

- New Router / New Screen から **[`src/components/`](src/components/:1)** を直接 `import` できる状態を維持する
- legacy を “読みやすくするための変更” は、原則 **[`src/components/`](src/components/:1)** に入れない（Compat 側で吸収）
  - 理由: legacy 開発者の認知負荷を増やさない（「知らない概念が突然増えた」を避ける）

> 例: URL の階層化・kebab-case 化・永続化などは、[`src/compat/`](src/compat/:1) か New Spec 側（例: [`src/app/router.tsx`](src/app/router.tsx:1)）に閉じ込める。

### 3.3 互換対象: CSS / 見た目

- legacy 画面は既存の CSS をそのまま使ってよい（例: [`src/components/Answer.css`](src/components/Answer.css:1)）
- 新 Screen は New Spec 方針（Mantine）で実装
- ただし「同一 URL で新旧が混在」すると UX が破綻しやすいので、同じ導線上は **どちらかに寄せる**（後述のフェーズ管理で制御）

---

## 4. Compat layer の実装方針（コード配置）

> ここは “計画” であり、実装場所の提案。将来の実装は New Spec の構成（[`docs/newspec/directory-structure.md`](docs/newspec/directory-structure.md:27)）に沿って **[`src/compat/`](src/compat/:1)** を追加する。

### 4.1 追加するディレクトリ（提案）

- [`src/compat/`](src/compat/:1)
  - [`legacyRoutes.tsx`](src/compat/legacyRoutes.tsx:1): 旧ルートの集約（path → element）
  - [`adapters/`](src/compat/adapters/:1): URL ↔ legacy state を変換する薄い wrapper
  - [`deprecations.ts`](src/compat/deprecations.ts:1): 旧ルートの段階的廃止（リダイレクト開始日等）

New Router 側（例: [`src/app/router.tsx`](src/app/router.tsx:1)）では、
- New Spec routes を通常通り定義
- それに加えて **Compat routes（旧ルート）** を最後にマージする

### 4.2 「旧 App をそのまま mount しない」

旧アプリの Router を丸ごと New Router 配下に mount すると、二重 Router になりやすく設計が破綻しやすい。

そのため Compat 層は、「App 全体」を呼ぶのではなく、旧ルート相当の element として **[`src/components/`](src/components/:1)** の画面コンポーネントを直接割り当てる。

例（旧ルート → legacy コンポーネント）:
- `/room` → [`Room`](src/components/Room.jsx:1)
- `/question` → [`Question`](src/components/question.jsx:15)
- `/answer` → [`Answer`](src/components/Answer.jsx:7)

---

## 5. 旧ルート → 新ルート対応表（互換の出し方）

互換の出し方は 2 種類に分ける。

- A. **Alias（同一実体）**: 旧ルートも新ルートも、同じ “実体画面” を指す
- B. **Redirect（段階的廃止）**: 旧ルートは新ルートへ飛ばす（パラメータ/クエリを可能な範囲で移送）

| legacy path | new spec path | 戦略 | 実体（当面） |
|---|---|---|---|
| `/` | `/home` | A（当面は `/`=legacy、`/home`=new） | （既存ホーム画面） |
| `/profiles` | `/profiles` | A（同一 URL） | （段階的に新旧差し替え） |
| `/profiles/:userId` | `/profiles/:userId` | A（同一 URL） | （段階的に新旧差し替え） |
| `/my_profile` | `/me/profile` | A（新側を legacy 実体で始める） | [`MyProfile`](src/components/MyProfile.jsx:8) |
| `/edit_profile` | `/me/profile/edit` | A | [`EditProfile`](src/components/EditProfile.jsx:38) |
| `/room` | `/events/join` | A | [`Room`](src/components/Room.jsx:1) |
| `/read_qr` | `/qr/scan` | A | [`ReadQRCode`](src/components/ReadQRCode.jsx:8) |
| `/make_qr` | `/qr/profile` | A | [`MakeQRCode`](src/components/MakeQRCode.jsx:6) |
| `/question` | `/events/:eventId/quiz/:questionNo` | B（将来的に redirect） | [`Question`](src/components/question.jsx:15) |
| `/answer` | `/events/:eventId/quiz/:questionNo/answer` | B | [`Answer`](src/components/Answer.jsx:7) |
| `/result` | `/events/:eventId/result` | B | [`Result`](src/components/Result.jsx:4) |
| `/make_question` | `/events/new`（or admin route） | B（保留） | [`MakeQuestion`](src/components/MakeQuestion.jsx:7) |
| `/make_false_selection` | （未定） | B（保留） | [`MakeFalseSelection`](src/components/MakeFalseSelection.jsx:7) |
| `/profile` | `/me/profile`（想定） | B（保留） | [`Profile`](src/components/Profile.jsx:5) |
| `/profile_history` | `/me/friendships/received` | B（保留） | [`Profile_history`](src/components/Profile_history.jsx:5) |

---

## 6. 状態互換（location.state 依存をどう扱うか）

New Spec は「復元に必須な値を URL or 永続へ」（[`docs/newspec/routes.md`](docs/newspec/routes.md:98)）が原則だが、legacy は [`location.state`](src/components/Answer.jsx:10) 依存が残りうる。

Compat 層は “旧コンポーネントを直さずに動かす” ために、次の順序で吸収する。

1. **URL に載っているものは URL を正とする**
   - 例: `eventId`, `questionNo`
2. legacy が [`location.state`](src/components/Answer.jsx:10) を必須としている場合は、Compat adapter で補完する
   - 補完元は（最低限）ブラウザ永続領域（例: [`localStorage`](src/components/MakeFalseSelection.jsx:56)）または API
3. redirect するときは「不足情報が揃ってから」
   - 揃わない場合はエラー画面へ（New Spec の `/error/*` 体系に寄せる）

---

## 7. 段階的移行フェーズ（推奨）

### Phase 0: 旧ルートの “受け皿” を New Router に追加

- New App の router に legacy routes を追加し、[`src/components/`](src/components/:1) の画面を element として割り当てる
- これによりアプリの起点は New Spec 側（例: [`src/app/App.tsx`](src/app/App.tsx:1) / [`src/app/router.tsx`](src/app/router.tsx:1)）へ寄るが、legacy 開発者は従来どおり [`src/components/`](src/components/:1) を触り続けられる

### Phase 1: 新ルートを増やすが、中身は legacy を alias する

- `/events/join`, `/qr/scan` 等を追加し、実体は [`src/components/`](src/components/:1) の画面で開始
- ルート階層だけ New Spec に揃え、画面実装は “そのまま” を維持

### Phase 2: 置き換え可能な画面から New Screen 実装に差し替え

- `/profiles`, `/me/profile` など、直リンク復元が容易なところから新 Screen に差し替え
- この時点でも **旧ルートは残す**（ただし同一実体を指す）

### Phase 3: クイズ導線（state 依存が強い）の新実装を作り、旧を redirect にする

- `/events/:eventId/quiz/*` を New Spec で完走できるようにする
- 完走後に `/question` `/answer` `/result` を redirect（または “旧 UI のままでも良いが URL は新へ” のどちらか）

---

## 8. 互換性維持の運用ルール（legacy を壊さない / 迷わせない）

1. legacy 画面（編集対象の [`src/components/`](src/components/:1)）は **原則そのまま**
   - 修正する場合も「挙動不具合」や「API 追従」など最小に限定
2. 互換対応は Compat 側（[`src/compat/`](src/compat/:1)）で吸収
   - “新しい書き方” を [`src/components/`](src/components/:1) へ持ち込まない
3. 新実装は New Spec に従う
   - URL の階層化、命名統一（kebab-case）など（[`docs/newspec/routes.md`](docs/newspec/routes.md:22)）
4. 既存のアーカイブ（[`oldsrc/`](oldsrc/:1)）は温存する
   - 技術的な理由というより、レガシーエンジニアの心理的安全性（「自分たちの歴史を消された」と感じさせない）を守るため
   - さらに、[`oldsrc/`](oldsrc/:1) は「彼らの認知力の範囲」で成立している実装のスナップショットでもある
     - ここに大規模改修（抽象化・アーキ刷新・命名規約総入替など）を持ち込むと、理解の閾値を超えてしまい、運用が崩壊する
     - 人が認知限界を超える情報を流し込まれたときに起きやすい symptom / 行動例:
       - **回避**: 読まない・触らない・「後で見る」が増える / 変更が止まる
       - **短絡化**: 仕組みを理解せずにコピペ（cargo-cult）で “動くまで” 進め、破綻を後工程へ押し付ける
       - **防衛反応**: 反発・苛立ち・人格攻撃的な言動・「昔のほうが良かった」への回帰
       - **責任転嫁**: バグの原因が追えず、個人/チーム間の blame ゲームになりがち
       - **局所最適**: 既存の慣れたやり方に閉じこもり、統一方針から逸脱した別実装が生まれやすい
     - 崩壊とは具体的に「レビュー不能になる/バグ修正ができない/反発で別実装が生まれて統合が難しくなる」等
   - 運用としては「削除しない / 大規模改変しない / 参照用として残す」を基本とする

---

## 9. 受け入れ条件（Done の定義）

- 旧 URL（従来の主要パス）にアクセスして、同等の画面が出る
- 新ルート一覧（[`docs/newspec/routes.md`](docs/newspec/routes.md:40)）の主要パスにアクセスして、少なくとも “到達可能”
  - Phase 1 では「中身が [`src/components/`](src/components/:1) のままでも可」
- ゲスト認証失敗時に、新 spec のエラー導線（例: `/error/auth`）へ誘導できる
  - legacy 側の認証 UI を残す/置換するは Phase 0 の実装次第だが、どちらでも “迷子にならない” こと
