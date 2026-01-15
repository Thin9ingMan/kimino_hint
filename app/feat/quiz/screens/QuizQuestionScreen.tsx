import {
  Alert,
  Button,
  Paper,
  Stack,
  Text,
  Title,
  Group,
  Progress,
} from "@mantine/core";
import { Suspense, useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import {
  useSuspenseQueries,
} from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import type { Quiz, QuizAnswer } from "../types";
import { generateQuizFromProfileAndFakes } from "../utils/quizFromFakes";

function QuizQuestionContent() {
  const eventId = useNumericParam("eventId");
  const targetUserId = useNumericParam("targetUserId");
  const questionNo = useNumericParam("questionNo") ?? 1;
  const navigate = useNavigate();

  if (!eventId || !targetUserId) {
    throw new Error("パラメータが不正です");
  }

  // Fetch target user's profile and quiz data
  const [targetUser, targetProfile, quizData] = useSuspenseQueries([
    [
      ["users.getUserById", { userId: targetUserId }],
      () => apis.users.getUserById({ userId: targetUserId }),
    ],
    [
      ["profiles.getUserProfile", { userId: targetUserId }],
      () => apis.profiles.getUserProfile({ userId: targetUserId }),
    ],
    [
      ["events.getEventUserData", { eventId, userId: targetUserId }],
      () => apis.events.getEventUserData({ eventId, userId: targetUserId }),
    ],
  ]);

  // Generate quiz from profile + fake answers OR use stored myQuiz
  const quiz = useMemo(() => {
    // 1. Try myQuiz (New Standard)
    if (quizData?.userData?.myQuiz) {
        return quizData.userData.myQuiz;
    }

    // 2. Legacy / Fallback
    const fakeAnswers = quizData?.userData?.fakeAnswers;
    if (!fakeAnswers || !targetProfile) {
      return null;
    }
    return generateQuizFromProfileAndFakes(targetProfile, fakeAnswers);
  }, [targetProfile, quizData]);


  const questionIndex = questionNo - 1;

  if (!quiz || !quiz.questions?.length) {
    return (
      <Stack gap="md">
        <Alert color="yellow" title="クイズが見つかりません">
          <Text size="sm">
            このユーザーはまだクイズを作成していません。
          </Text>
        </Alert>
        <Button onClick={() => navigate(`/events/${eventId}/quiz/challenges`)} fullWidth>
          一覧へ戻る
        </Button>
      </Stack>
    );
  }

  if (questionIndex >= quiz.questions.length) {
    // All questions answered - redirect to result
    navigate(`/events/${eventId}/quiz/challenge/${targetUserId}/result`);
    return <Text>結果画面へ移動中...</Text>;
  }

  const question = quiz.questions[questionIndex];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = useCallback(
    (choiceIndex: number) => {
      setSelectedIndex(choiceIndex);
      setShowResult(true);

      // Store the answer in session storage
      const storageKey = `quiz_${eventId}_${targetUserId}_answers`;
      const stored = sessionStorage.getItem(storageKey);
      const answers = stored ? JSON.parse(stored) : [];
      
      const isCorrect = choiceIndex === question.correctIndex;
      answers[questionIndex] = {
        questionIndex,
        selectedIndex: choiceIndex,
        isCorrect,
        answeredAt: new Date().toISOString(),
      };

      sessionStorage.setItem(storageKey, JSON.stringify(answers));

      // Update score
      const scoreKey = `quiz_${eventId}_${targetUserId}_score`;
      const currentScore = parseInt(sessionStorage.getItem(scoreKey) || "0", 10);
      if (isCorrect) {
        sessionStorage.setItem(scoreKey, String(currentScore + 1));
      }
    },
    [eventId, targetUserId, questionIndex, question.correctIndex]
  );

  const handleNext = useCallback(() => {
    if (questionIndex + 1 < quiz.questions.length) {
      // Go to next question
      navigate(`/events/${eventId}/quiz/challenge/${targetUserId}/${questionNo + 1}`);
    } else {
      // Go to result
      navigate(`/events/${eventId}/quiz/challenge/${targetUserId}/result`);
    }
  }, [eventId, targetUserId, questionNo, questionIndex, quiz.questions.length, navigate]);

  const isCorrect = selectedIndex === question.correctIndex;
  const progress = ((questionNo) / quiz.questions.length) * 100;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          問題 {questionNo} / {quiz.questions.length}
        </Text>
        <Text size="sm" fw={500}>
          {targetUser.profileSummary?.displayName || `ユーザー ${targetUserId}`}のクイズ
        </Text>
      </Group>

      <Progress value={progress} size="sm" />

      <Paper withBorder p="lg" radius="md">
        <Title order={3} mb="xl">
          {question.question}
        </Title>

        <Stack gap="sm">
          {question.choices.map((choice, idx) => {
            let color = undefined;
            let variant: "default" | "filled" | "light" = "default";

            if (showResult) {
              if (idx === question.correctIndex) {
                color = "green";
                variant = "filled";
              } else if (idx === selectedIndex) {
                color = "red";
                variant = "light";
              }
            } else if (selectedIndex === idx) {
              variant = "light";
            }

            return (
              <Button
                key={idx}
                size="lg"
                color={color}
                variant={variant}
                onClick={() => handleAnswer(idx)}
                disabled={showResult}
                fullWidth
                styles={{
                  root: {
                    height: "auto",
                    padding: "16px",
                  },
                  label: {
                    whiteSpace: "normal",
                    textAlign: "left",
                  },
                }}
              >
                {choice}
              </Button>
            );
          })}
        </Stack>
      </Paper>

      {showResult && (
        <Alert
          color={isCorrect ? "green" : "red"}
          title={isCorrect ? "正解！" : "不正解"}
        >
          <Stack gap="sm">
            <Text size="sm">
              {isCorrect
                ? "よくできました！"
                : `正解は「${question.choices[question.correctIndex]}」でした。`}
            </Text>
            <Button onClick={handleNext} fullWidth>
              {questionIndex + 1 < quiz.questions.length ? "次の問題へ" : "結果を見る"}
            </Button>
          </Stack>
        </Alert>
      )}
    </Stack>
  );
}

export function QuizQuestionScreen() {
  return (
    <Container title="クイズ">
      <ErrorBoundary
        fallback={(error, retry) => (
          <Alert color="red" title="読み込みエラー">
            <Stack gap="sm">
              <Text size="sm">{error.message}</Text>
              <Button variant="light" onClick={retry}>
                再試行
              </Button>
            </Stack>
          </Alert>
        )}
      >
        <Suspense
          fallback={<Text size="sm" c="dimmed">読み込み中...</Text>}
        >
          <QuizQuestionContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
