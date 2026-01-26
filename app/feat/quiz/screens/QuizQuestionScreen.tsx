import {
  Alert,
  Button,
  Paper,
  Stack,
  Text,
  Title,
  Group,
  Progress,
  RingProgress,
  Box,
} from "@mantine/core";
import { Suspense, useCallback, useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { useSuspenseQueries } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import type { Quiz, QuizAnswer } from "../types";
import { generateQuizFromProfileAndFakes } from "../utils/quizFromFakes";
import { ANSWER_LIMIT_SEC } from "@/shared/constants";

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
          <Text size="sm">このユーザーはまだクイズを作成していません。</Text>
        </Alert>
        <Button
          onClick={() => navigate(`/events/${eventId}/quiz/challenges`)}
          fullWidth
        >
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
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ANSWER_LIMIT_SEC);
  const timerRef = useRef<number | null>(null);

  const handleAutoSubmit = useCallback(() => {
    // Auto-submit with no answer (null)
    setShowResult(true);

    // Store the answer in session storage as no answer
    const storageKey = `quiz_${eventId}_${targetUserId}_answers`;
    const stored = sessionStorage.getItem(storageKey);
    const answers = stored ? JSON.parse(stored) : [];

    answers[questionIndex] = {
      questionId: question.id,
      selectedChoiceId: null,
      isCorrect: false,
      answeredAt: new Date().toISOString(),
    };

    sessionStorage.setItem(storageKey, JSON.stringify(answers));
    // Score remains unchanged (no correct answer)
  }, [eventId, targetUserId, questionIndex, question.id]);

  // Timer effect
  useEffect(() => {
    if (showResult) {
      // Clear timer if result is shown
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          // Time's up - auto submit with no answer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Trigger auto-submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showResult, handleAutoSubmit]);

  const handleAnswer = useCallback(
    (choiceId: string) => {
      if (showResult) return; // Prevent multiple submissions
      
      setSelectedChoiceId(choiceId);
      setShowResult(true);

      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Store the answer in session storage
      const storageKey = `quiz_${eventId}_${targetUserId}_answers`;
      const stored = sessionStorage.getItem(storageKey);
      const answers = stored ? JSON.parse(stored) : [];

      const selectedChoice = question.choices.find((c) => c.id === choiceId);
      const isCorrect = !!selectedChoice?.isCorrect;

      answers[questionIndex] = {
        questionId: question.id,
        selectedChoiceId: choiceId,
        isCorrect,
        answeredAt: new Date().toISOString(),
      };

      sessionStorage.setItem(storageKey, JSON.stringify(answers));

      // Update score
      const scoreKey = `quiz_${eventId}_${targetUserId}_score`;
      const currentScore = parseInt(
        sessionStorage.getItem(scoreKey) || "0",
        10,
      );
      if (isCorrect) {
        sessionStorage.setItem(scoreKey, String(currentScore + 1));
      }
    },
    [eventId, targetUserId, questionIndex, question.id, question.choices, showResult],
  );

  const handleNext = useCallback(() => {
    if (questionIndex + 1 < quiz.questions.length) {
      // Go to next question
      navigate(
        `/events/${eventId}/quiz/challenge/${targetUserId}/${questionNo + 1}`,
      );
    } else {
      // Go to result
      navigate(`/events/${eventId}/quiz/challenge/${targetUserId}/result`);
    }
  }, [
    eventId,
    targetUserId,
    questionNo,
    questionIndex,
    quiz.questions.length,
    navigate,
  ]);

  const selectedChoice = question.choices.find(
    (c) => c.id === selectedChoiceId,
  );
  const isCorrect = !!selectedChoice?.isCorrect;
  const progress = (questionNo / quiz.questions.length) * 100;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          問題 {questionNo} / {quiz.questions.length}
        </Text>
        <Text size="sm" fw={500}>
          {targetUser.profileSummary?.displayName || `ユーザー ${targetUserId}`}
          のクイズ
        </Text>
      </Group>

      <Progress value={progress} size="sm" />

      <Paper withBorder p="lg" radius="md" pos="relative">
        {/* Timer Ring Progress - positioned at top right */}
        {!showResult && (
          <Box
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
            }}
          >
            <RingProgress
              size={60}
              thickness={6}
              sections={[
                {
                  value: (timeLeft / ANSWER_LIMIT_SEC) * 100,
                  color: timeLeft > 3 ? "blue" : "red",
                },
              ]}
            />
          </Box>
        )}

        <Title order={3} mb="xl">
          {question.question}
        </Title>

        <Stack gap="sm">
          {question.choices.map((choice) => {
            let color = undefined;
            let variant: "default" | "filled" | "light" = "default";

            if (showResult) {
              if (choice.isCorrect) {
                color = "green";
                variant = "filled";
              } else if (choice.id === selectedChoiceId) {
                color = "red";
                variant = "light";
              }
            } else if (selectedChoiceId === choice.id) {
              variant = "light";
            }

            return (
              <Button
                key={choice.id}
                size="lg"
                color={color}
                variant={variant}
                onClick={() => handleAnswer(choice.id)}
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
                {choice.text}
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
                : selectedChoiceId
                  ? `正解は「${question.choices.find((c) => c.isCorrect)?.text}」でした。`
                  : "時間切れです。正解は「" + question.choices.find((c) => c.isCorrect)?.text + "」でした。"}
            </Text>
            {question.explanation && (
              <Paper withBorder p="md" radius="md" bg="gray.0">
                <Text size="md" fw={500}>
                  解説: {question.explanation}
                </Text>
              </Paper>
            )}
            <Button onClick={handleNext} fullWidth mt="sm">
              {questionIndex + 1 < quiz.questions.length
                ? "次の問題へ"
                : "結果を見る"}
            </Button>
          </Stack>
        </Alert>
      )}
    </Stack>
  );
}

export function QuizQuestionScreen() {
  const questionNo = useNumericParam("questionNo") ?? 1;

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
          fallback={
            <Text size="sm" c="dimmed">
              読み込み中...
            </Text>
          }
        >
          <QuizQuestionContent key={questionNo} />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
