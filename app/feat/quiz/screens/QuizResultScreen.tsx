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
import { Suspense, useMemo } from "react";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import type { Quiz } from "../types";

function QuizResultContent() {
  const eventId = useNumericParam("eventId");
  const targetUserId = useNumericParam("targetUserId");

  if (!eventId || !targetUserId) {
    throw new Error("パラメータが不正です");
  }

  // Fetch target user's quiz to show final result
  // In a real implementation, we'd track answers in state/session storage
  // For now, we'll show a placeholder result
  const targetUser = useSuspenseQuery(
    ["quiz", "result", "user", eventId, targetUserId],
    async () => {
      const user = await apis.users.getUserById({ userId: targetUserId });
      return user;
    }
  );

  const quizData = useSuspenseQuery(
    ["quiz", "result", "data", eventId, targetUserId],
    async () => {
      const userData = await apis.events.getEventUserData({
        eventId,
        userId: targetUserId,
      });
      return userData;
    }
  );

  const quiz = quizData?.userData?.myQuiz as Quiz | undefined;

  // TODO: Get actual score from session/state
  // For now, using placeholder
  const score = useMemo(() => {
    const stored = sessionStorage.getItem(`quiz_${eventId}_${targetUserId}_score`);
    return stored ? parseInt(stored, 10) : 0;
  }, [eventId, targetUserId]);

  const totalQuestions = quiz?.questions?.length ?? 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getRatingText = (percent: number) => {
    if (percent === 100) return "完璧です！";
    if (percent >= 80) return "素晴らしい！";
    if (percent >= 60) return "良くできました！";
    if (percent >= 40) return "もう少し！";
    return "次回頑張りましょう！";
  };

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
              sections={[{ value: percentage, color: percentage >= 60 ? "green" : percentage >= 40 ? "yellow" : "red" }]}
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
            <Text size="lg" fw={600}>
              {getRatingText(percentage)}
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
        <Button component={Link} to={`/events/${eventId}/quiz/challenges`} fullWidth>
          他のクイズに挑戦
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
