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
  Table,
} from "@mantine/core";
import { Suspense, useMemo } from "react";
import { Link, useLoaderData } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { apis, AppError } from "@/shared/api";
import type { Quiz, QuizAnswer } from "../types";
import { generateQuizFromProfileAndFakes } from "../utils/quizFromFakes";
import { getPerformanceRating } from "../utils/validation";

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function loader({
  params,
}: {
  params: { eventId?: string; targetUserId?: string };
}) {
  const eventId = Number(params.eventId);
  const targetUserId = Number(params.targetUserId);

  if (Number.isNaN(eventId) || Number.isNaN(targetUserId)) {
    throw new AppError("パラメータが不正です", { recoveryUrl: "/events" });
  }

  try {
    const [targetUser, targetProfile, eventUserData] = await Promise.all([
      apis.users.getUserById({ userId: targetUserId }),
      apis.profiles.getUserProfile({ userId: targetUserId }),
      apis.events.getEventUserData({ eventId, userId: targetUserId }),
    ]);

    return { eventId, targetUserId, targetUser, targetProfile, eventUserData };
  } catch (error) {
    throw new AppError("結果の読み込みに失敗しました", {
      cause: error,
      recoveryUrl: `/events/${eventId}/quiz/challenges`,
    });
  }
}

function QuizResultContent() {
  const { eventId, targetUserId, targetUser, targetProfile, eventUserData } =
    useLoaderData<typeof loader>();

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

  const score = useMemo(() => {
    const stored = sessionStorage.getItem(
      `quiz_${eventId}_${targetUserId}_score`,
    );
    return stored ? parseInt(stored, 10) : 0;
  }, [eventId, targetUserId]);

  // Retrieve stored answers from sessionStorage
  const answers = useMemo<QuizAnswer[]>(() => {
    const stored = sessionStorage.getItem(
      `quiz_${eventId}_${targetUserId}_answers`,
    );
    return stored ? JSON.parse(stored) : [];
  }, [eventId, targetUserId]);

  const totalQuestions = quiz?.questions?.length ?? 0;
  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const performanceRating = getPerformanceRating(percentage);

  return (
    <Stack gap="md">
      <Alert color="blue" title="クイズ完了">
        <Text size="sm">
          {targetUser.profileSummary?.displayName || `ユーザー ${targetUserId}`}
          のクイズが完了しました！
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
            <Text size="xl">{performanceRating.emoji}</Text>
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

      {/* Detailed Results Table */}
      {quiz && answers.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <Title order={3}>詳細結果</Title>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>問題</Table.Th>
                  <Table.Th>正解</Table.Th>
                  <Table.Th>あなたの回答</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {quiz.questions.map((question, index) => {
                  const answer = answers[index];
                  const correctChoice = question.choices.find(
                    (c) => c.isCorrect,
                  );
                  const userChoice = answer
                    ? question.choices.find(
                        (c) => c.id === answer.selectedChoiceId,
                      )
                    : null;

                  return (
                    <Table.Tr key={question.id}>
                      <Table.Td>{question.question}</Table.Td>
                      <Table.Td>{correctChoice?.text || "不明"}</Table.Td>
                      <Table.Td>
                        {answer ? (
                          <Group gap="xs">
                            <Text>{answer.isCorrect ? "⭕" : "✖"}</Text>
                            {!answer.isCorrect && userChoice && (
                              <Text size="sm" c="dimmed">
                                ({userChoice.text})
                              </Text>
                            )}
                          </Group>
                        ) : (
                          <Text c="dimmed">未回答</Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Stack>
        </Paper>
      )}

      <Stack gap="sm">
        <Button
          component={Link}
          to={`/events/${eventId}/quiz/challenge/${targetUserId}/rewards`}
          fullWidth
        >
          プロフィールを取得
        </Button>
      </Stack>
    </Stack>
  );
}

export function QuizResultScreen() {
  return (
    <Container title="クイズ結果">
      <Suspense
        fallback={
          <Text size="sm" c="dimmed">
            読み込み中...
          </Text>
        }
      >
        <QuizResultContent />
      </Suspense>
    </Container>
  );
}

QuizResultScreen.loader = loader;

