import {
  Alert,
  Button,
  Stack,
  Text,
  Paper,
  Title,
  Group,
  ThemeIcon,
  Badge,
  Divider,
} from "@mantine/core";
import { Suspense, useMemo, useEffect } from "react";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconTrophy, IconSparkles } from "@tabler/icons-react";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { useCurrentUser } from "@/shared/auth/hooks";
import { useSuspenseQueries } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import { Loading } from "@/shared/ui/Loading";
import { generateQuizFromProfileAndFakes } from "../utils/quizFromFakes";

function QuizSequenceContent() {
  const eventId = useNumericParam("eventId");
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = React.useState(0);

  if (!eventId) {
    throw new Error("eventId が不正です");
  }

  const meData = useCurrentUser();
  const [attendees] = useSuspenseQueries([
    [
      ["events.listEventAttendees", { eventId }],
      async () => {
        const eventAttendees = await apis.events.listEventAttendees({
          eventId,
        });
        // Fetch profiles to get display names
        const enriched = await Promise.all(
          eventAttendees.map(async (a: any) => {
            const uid = a.attendeeUserId || a.userId;
            try {
              const profile = await apis.profiles.getUserProfile({
                userId: uid,
              });
              return {
                ...a,
                userId: uid,
                attendeeUserId: uid,
                displayName: profile.profileData?.displayName,
                profileData: profile.profileData,
              };
            } catch {
              return { ...a, userId: uid, attendeeUserId: uid };
            }
          }),
        );
        // Sort by ID to maintain join order
        return enriched.sort((a, b) => a.id - b.id);
      },
    ],
  ]);

  // Get quiz completion state from sessionStorage
  const quizProgress = useMemo(() => {
    try {
      const stored = sessionStorage.getItem(`quiz_sequence_${eventId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the structure
        if (parsed && Array.isArray(parsed.completedQuizzes)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error(
        "Failed to parse quiz progress from sessionStorage:",
        error,
      );
    }
    return { completedQuizzes: [] };
  }, [eventId, refreshKey]);

  // Find current quiz index
  const currentQuizIndex = useMemo(() => {
    return quizProgress.completedQuizzes.length;
  }, [quizProgress]);

  const currentAttendee = attendees[currentQuizIndex];
  const isOwnQuiz =
    !!currentAttendee && currentAttendee.attendeeUserId === meData.id;

  useEffect(() => {
    if (!currentAttendee || isOwnQuiz) return;

    // Clear previous quiz answers
    sessionStorage.removeItem(
      `quiz_${eventId}_${currentAttendee.attendeeUserId}_answers`,
    );
    sessionStorage.removeItem(
      `quiz_${eventId}_${currentAttendee.attendeeUserId}_score`,
    );

    // Redirect to first question
    navigate(
      `/events/${eventId}/quiz/challenge/${currentAttendee.attendeeUserId}/1`,
    );
  }, [eventId, currentAttendee?.attendeeUserId, isOwnQuiz, navigate]);

  // Check if all quizzes are completed
  if (currentQuizIndex >= attendees.length) {
    return (
      <Stack gap="xl" align="center" py="xl">
        <ThemeIcon size={100} radius="circle" variant="light" color="green">
          <IconTrophy size={60} />
        </ThemeIcon>
        <Stack gap="xs" align="center">
          <Title order={2}>すべてのクイズが完了しました</Title>
          <Text c="dimmed" ta="center">
            お疲れ様でした！
            <br />
            イベントロビーに戻って他の参加者と交流しましょう。
          </Text>
        </Stack>
        <Stack gap="sm" w="100%" maw={400}>
          <Button component={Link} to="/profiles" size="lg" fullWidth>
            プロフィール一覧
          </Button>
          <Button
            component={Link}
            to={`/events/${eventId}`}
            size="lg"
            variant="light"
            fullWidth
          >
            ロビーへ戻る
          </Button>
        </Stack>
      </Stack>
    );
  }

  // If it's the user's own quiz, show special screen with quiz preview
  if (isOwnQuiz) {
    const handleNext = () => {
      // Mark this quiz as completed (avoid duplicates)
      const completed = quizProgress.completedQuizzes;
      if (!completed.includes(currentAttendee.attendeeUserId)) {
        const newProgress = {
          completedQuizzes: [...completed, currentAttendee.attendeeUserId],
        };
        sessionStorage.setItem(
          `quiz_sequence_${eventId}`,
          JSON.stringify(newProgress),
        );

        // Trigger re-render by updating refreshKey
        setRefreshKey((prev) => prev + 1);
      }
    };

    // Fetch quiz data to display
    const [targetProfile, quizData] = useSuspenseQueries([
      [
        ["profiles.getUserProfile", { userId: currentAttendee.attendeeUserId }],
        () => apis.profiles.getUserProfile({ userId: currentAttendee.attendeeUserId }),
      ],
      [
        ["events.getEventUserData", { eventId, userId: currentAttendee.attendeeUserId }],
        () => apis.events.getEventUserData({ eventId, userId: currentAttendee.attendeeUserId }),
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

    return (
      <Stack gap="xl" py="xl">
        <Stack gap="xs" align="center">
          <ThemeIcon size={80} radius="circle" variant="light" color="blue">
            <IconSparkles size={50} />
          </ThemeIcon>
          <Badge size="lg" variant="light" color="blue">あなたのクイズ (プレビュー)</Badge>
          <Title order={2}>あなたのクイズを出題しています</Title>
          <Text c="dimmed" ta="center" size="md">
            自身のクイズについてエピソードトークをしよう
          </Text>
        </Stack>

        <Paper withBorder p="md" radius="md" bg="blue.0">
          <Text size="sm" c="dimmed">
            他の参加者があなたのクイズに挑戦しています。
            この時間を使って、クイズに関連するエピソードや思い出を共有しましょう。
          </Text>
        </Paper>

        <Divider label="回答者に表示されているクイズ" labelPosition="center" />

        {quiz && quiz.questions && quiz.questions.length > 0 ? (
          <Stack gap="md">
            {quiz.questions.map((question, index) => (
              <Paper key={question.id || index} withBorder p="lg" radius="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Badge size="sm" variant="light">問題 {index + 1}</Badge>
                  </Group>
                  <Title order={4}>{question.question}</Title>
                  <Stack gap="xs">
                    {question.choices.map((choice) => (
                      <Paper
                        key={choice.id}
                        p="md"
                        radius="md"
                        withBorder
                        bg={choice.isCorrect ? "green.0" : undefined}
                        style={{
                          borderColor: choice.isCorrect ? "var(--mantine-color-green-6)" : undefined,
                          borderWidth: choice.isCorrect ? 2 : undefined,
                        }}
                      >
                        <Group gap="sm">
                          <Text size="sm" fw={choice.isCorrect ? 700 : 400}>
                            {choice.text}
                          </Text>
                          {choice.isCorrect && (
                            <Badge size="xs" color="green">正解</Badge>
                          )}
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                  {question.explanation && (
                    <Paper p="md" radius="md" bg="gray.0">
                      <Text size="sm" c="dimmed">
                        <strong>解説:</strong> {question.explanation}
                      </Text>
                    </Paper>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Alert color="yellow" title="クイズが見つかりません">
            <Text size="sm">クイズデータを読み込めませんでした。</Text>
          </Alert>
        )}

        <Button onClick={handleNext} size="lg" fullWidth>
          次のクイズへ
        </Button>
      </Stack>
    );
  }

  // Otherwise, display loading state while transitioning (handled by useEffect above)
  const displayName =
    currentAttendee.displayName || `ユーザー ${currentAttendee.attendeeUserId}`;

  return (
    <Stack gap="md" align="center">
      <Text size="sm" c="dimmed">
        {displayName} のクイズを読み込み中...
      </Text>
    </Stack>
  );
}

export function QuizSequenceScreen() {
  return (
    <Container title="クイズ挑戦">
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
        <Suspense fallback={<Loading />}>
          <QuizSequenceContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
