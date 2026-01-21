# Quiz Supplement Feature Documentation

## Overview
This document describes the quiz question supplement/explanation feature that allows quiz creators to add supplementary information to their quiz questions.

## Feature Description

### For Quiz Creators
When creating or editing a quiz, users can now add optional supplementary explanations to each question. This allows them to provide additional context, interesting facts, or personal stories related to each quiz question.

### For Quiz Takers
When answering a quiz question, after selecting an answer, users will see:
1. Whether their answer was correct or incorrect
2. The correct answer (if they got it wrong)
3. **The supplementary explanation** provided by the quiz creator (if one was added)

## User Interface

### Quiz Edit Screen (`/events/:eventId/quiz/edit`)

Each question card now includes:

```
┌─────────────────────────────────────────┐
│ 質問文                                   │
│ [例: 私の趣味は何でしょう？]              │
├─────────────────────────────────────────┤
│ ━━━━━ 選択肢設定 ━━━━━                  │
│ □ [正解の選択肢]                         │
│ □ [間違いの選択肢 1]                     │
│ □ [間違いの選択肢 2]                     │
│ □ [間違いの選択肢 3]                     │
├─────────────────────────────────────────┤
│ ━━━━━ 補足説明（任意） ━━━━━            │
│ 補足説明                                 │
│ ┌───────────────────────────────────┐   │
│ │ 正解・不正解が表示された後に出題者が  │   │
│ │ 伝えたい補足情報を入力してください    │   │
│ │ （例: この趣味を始めたきっかけは...）  │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Quiz Question Screen (During Quiz)

After answering a question, users see:

**If Correct:**
```
┌─────────────────────────────────────────┐
│ ✓ 正解！                                 │
│                                         │
│ よくできました！                         │
│                                         │
│ 解説: [出題者が入力した補足説明がここに表│
│ 示されます]                              │
│                                         │
│ [ 次の問題へ ]                           │
└─────────────────────────────────────────┘
```

**If Incorrect:**
```
┌─────────────────────────────────────────┐
│ ✗ 不正解                                 │
│                                         │
│ 正解は「[正しい答え]」でした。            │
│                                         │
│ 解説: [出題者が入力した補足説明がここに表│
│ 示されます]                              │
│                                         │
│ [ 次の問題へ ]                           │
└─────────────────────────────────────────┘
```

## Technical Implementation

### Data Model
The `QuizQuestion` interface already supported the `explanation` field:

```typescript
interface QuizQuestion {
  id: string;
  question: string;
  choices: QuizChoice[];
  explanation?: string;  // Optional explanation field
  metadata?: Record<string, any>;
}
```

### Changes Made

1. **QuizEditScreen.tsx**
   - Added `explanation?: string` to `QuestionState` interface
   - Added `Textarea` component for editing explanations
   - Updated save logic to persist explanations

2. **QuizQuestionScreen.tsx**
   - Already had logic to display explanations (lines 212-216)
   - No changes needed

### Code Example

```typescript
// In QuestionEditor component
<Textarea
  label="補足説明"
  placeholder="正解・不正解が表示された後に出題者が伝えたい補足情報を入力してください（例: この趣味を始めたきっかけは...）"
  value={question.explanation || ""}
  onChange={(e) => onChange({ ...question, explanation: e.currentTarget.value })}
  minRows={3}
  maxRows={6}
  autosize
/>
```

## Testing

An E2E test has been created (`e2e/test_quiz_supplement.spec.ts`) that:
1. Creates a quiz with a supplement
2. Verifies the supplement is saved
3. Answers the quiz as a different user
4. Verifies the supplement is displayed in the results

## Usage Examples

### Example 1: Hobby Question
**Question:** "私の趣味は何でしょう？"  
**Correct Answer:** "読書"  
**Supplement:** "小説を読むのが好きで、特にミステリー小説にハマっています。月に5冊くらい読んでいます！"

### Example 2: Favorite Artist Question
**Question:** "私の好きなアーティストはどれ？"  
**Correct Answer:** "YOASOBI"  
**Supplement:** "『夜に駆ける』を初めて聴いたときに衝撃を受けて、それ以来ずっとファンです。ライブにも行きました！"

### Example 3: Faculty Question
**Question:** "私の学部はどれ？"  
**Correct Answer:** "工学部"  
**Supplement:** "プログラミングが好きで工学部を選びました。毎日コーディングを楽しんでいます。"

## Benefits

1. **Enhanced Engagement**: Quiz creators can share more about themselves
2. **Better Understanding**: Quiz takers learn more about the person beyond just facts
3. **Personal Connection**: The supplement creates opportunities for deeper connections
4. **Optional Feature**: Doesn't require changes to existing quizzes

## Future Enhancements

Potential improvements for the future:
- Rich text formatting for supplements (bold, italic, links)
- Image or GIF support in supplements
- Character limit to keep supplements concise
- Pre-filled template suggestions for common supplement patterns
