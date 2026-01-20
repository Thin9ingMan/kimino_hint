import {
  Alert,
  Button,
  Paper,
  Stack,
  Text,
  Title,
  RingProgress,
  Group,
  Center,
} from "@mantine/core";
import { Suspense, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import {
  useSuspenseQueries,
} from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import type { Quiz } from "../types";
import { generateQuizFromProfileAndFakes } from "../utils/quizFromFakes";
import { getPerformanceRating } from "../utils/validation";

function QuizResultContent() {
  const eventId = useNumericParam("eventId");
  const targetUserId = useNumericParam("targetUserId");
  const navigate = useNavigate();

  if (!eventId || !targetUserId) {
    throw new Error("パラメータが不正です");
  }

  // Fetch target user's profile and quiz to show final result
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

  // TODO: Get actual score from session/state
  // For now, using placeholder
  const score = useMemo(() => {
    const stored = sessionStorage.getItem(`quiz_${eventId}_${targetUserId}_score`);
    return stored ? parseInt(stored, 10) : 0;
  }, [eventId, targetUserId]);

  const totalQuestions = quiz?.questions?.length ?? 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const performanceRating = getPerformanceRating(percentage);

  // Handle next quiz navigation
  const handleNextQuiz = useCallback(() => {
    // Get current quiz progress with error handling
    try {
      const progressKey = `quiz_sequence_${eventId}`;
      const stored = sessionStorage.getItem(progressKey);
      let progress = { completedQuizzes: [] };
      
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.completedQuizzes)) {
          progress = parsed;
        }
      }
      
      // Mark current quiz as completed (avoid duplicates)
      if (!progress.completedQuizzes.includes(targetUserId)) {
        const newProgress = {
          completedQuizzes: [...progress.completedQuizzes, targetUserId],
        };
        sessionStorage.setItem(progressKey, JSON.stringify(newProgress));
      }
      
      // Navigate to sequence screen to continue
      navigate(`/events/${eventId}/quiz/sequence`);
    } catch (error) {
      console.error('Failed to update quiz progress:', error);
      // Navigate anyway to avoid blocking the user
      navigate(`/events/${eventId}/quiz/sequence`);
    }
  }, [eventId, targetUserId, navigate]);

  return (
    <Stack gap="md">
      <Alert color="blue" title="クイズ完了">
        <Text size="sm">
          {targetUser.profileSummary?.displayName || `ユーザー ${targetUserId}`}のクイズが完了しました！
        </Text>
      </Alert>

      <Paper withBorder p="xl" radius="md">
        <Stack gap="xl" align="center">
          <Title order={2}>結果</Title>

          <Center>
            <RingProgress
              size={200}
              thickness={20}
              sections={[{ value: percentage, color: performanceRating.color }]}
              label={
                <Center>
                  <Stack gap={0} align="center">
                    <Text size="xl" fw={700}>
                      {percentage}%
                    </Text>
                    <Text size="sm" c="dimmed">
                      正解率
                    </Text>
                  </Stack>
                </Center>
              }
            />
          </Center>

          <Stack gap={4} align="center">
            <Text size="xl">
              {performanceRating.emoji}
            </Text>
            <Text size="lg" fw={600}>
              {performanceRating.label}
            </Text>
            <Group gap="xs">
              <Text size="md" fw={500}>
                {score}
              </Text>
              <Text size="sm" c="dimmed">
                / {totalQuestions} 問正解
              </Text>
            </Group>
          </Stack>
        </Stack>
      </Paper>

      <Stack gap="sm">
        <Button onClick={handleNextQuiz} fullWidth>
          次のクイズへ
        </Button>
        <Button component={Link} to={`/events/${eventId}`} variant="default" fullWidth>
          ロビーへ戻る
        </Button>
      </Stack>
    </Stack>
  );
}

export function QuizResultScreen() {
  return (
    <Container title="クイズ結果">
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
          <QuizResultContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
