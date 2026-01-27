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
import { useNavigate, useLoaderData } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { apis, toApiError } from "@/shared/api";
import type { Quiz } from "../types";
import { generateQuizFromProfileAndFakes } from "../utils/quizFromFakes";

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function loader({
  params,
}: {
  params: { eventId?: string; targetUserId?: string; questionNo?: string };
}) {
  const eventId = Number(params.eventId);
  const targetUserId = Number(params.targetUserId);
  const questionNo = Number(params.questionNo) || 1;

  if (Number.isNaN(eventId) || Number.isNaN(targetUserId)) {
    throw new Error("パラメータが不正です");
  }

  try {
    const [targetUser, eventUserData] = await Promise.all([
      apis.users.getUserById({ userId: targetUserId }),
      apis.events.getEventUserData({ eventId, userId: targetUserId }),
    ]);

    // Try to get the profile, but handle 404 gracefully
    let targetProfile;
    try {
      targetProfile = await apis.profiles.getUserProfile({
        userId: targetUserId,
      });
    } catch (profileError) {
      const apiError = toApiError(profileError);
      if (apiError.kind === "not_found") {
        // 404 is not an error - the user just doesn't have a profile yet
        targetProfile = null;
      } else {
        // Other errors should be thrown
        throw profileError;
      }
    }

    return {
      eventId,
      targetUserId,
      questionNo,
      targetUser,
      targetProfile,
      eventUserData,
    };
  } catch (error) {
    // Convert other API errors to more user-friendly messages
    const apiError = toApiError(error);

    if (apiError.kind === "unauthorized") {
      throw new Error("このクイズにアクセスする権限がありません。");
    } else if (apiError.kind === "network") {
      throw new Error(
        "ネットワーク接続に失敗しました。接続を確認して再試行してください。",
      );
    } else {
      throw new Error("クイズデータの読み込み中にエラーが発生しました。");
    }
  }
}

function QuizQuestionContent() {
  const {
    eventId,
    targetUserId,
    questionNo,
    targetUser,
    targetProfile,
    eventUserData,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Generate quiz from profile + fake answers OR use stored myQuiz
  const quiz = useMemo(() => {
    // 1. Try myQuiz (New Standard)
    if (isRecord(eventUserData?.userData) && eventUserData.userData.myQuiz) {
      return eventUserData.userData.myQuiz as Quiz;
    }

    // 2. Legacy / Fallback
    const fakeAnswers = isRecord(eventUserData?.userData)
      ? eventUserData.userData.fakeAnswers
      : null;
    if (!isRecord(fakeAnswers) || !targetProfile) {
      return null;
    }
    return generateQuizFromProfileAndFakes(targetProfile, fakeAnswers);
  }, [targetProfile, eventUserData]);

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

  const handleAnswer = useCallback(
    (choiceId: string) => {
      setSelectedChoiceId(choiceId);
      setShowResult(true);

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
    [eventId, targetUserId, questionIndex, question.id, question.choices],
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

      <Paper withBorder p="lg" radius="md">
        <Title order={3} mb="xl">
          {question.question}
        </Title>

        <Stack gap="sm">
          {question.choices.map((choice) => {
            let color: "green" | "red" | undefined = undefined;
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
                : `正解は「${question.choices.find((c) => c.isCorrect)?.text}」でした。`}
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
  const { questionNo } = useLoaderData<typeof loader>();

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

QuizQuestionScreen.loader = loader;
