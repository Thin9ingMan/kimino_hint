import {
  Alert,
  Button,
  Stack,
  Text,
  Paper,
  Title,
  ThemeIcon,
} from "@mantine/core";
import { Suspense, useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useLoaderData } from "react-router-dom";
import { IconTrophy, IconSparkles } from "@tabler/icons-react";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { apis, fetchCurrentUser } from "@/shared/api";
import { Loading } from "@/shared/ui/Loading";

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function loader({ params }: { params: { eventId?: string } }) {
  const eventId = Number(params.eventId);
  if (Number.isNaN(eventId)) {
    throw new Error("eventId が不正です");
  }

  const me = await fetchCurrentUser();
  const eventAttendees = await apis.events.listEventAttendees({ eventId });

  // Fetch profiles to get display names
  const attendees = await Promise.all(
    eventAttendees.map(async (a) => {
      const uid = a.attendeeUserId ?? 0;
      try {
        const profile = await apis.profiles.getUserProfile({
          userId: uid,
        });
        const pd = isRecord(profile.profileData) ? profile.profileData : null;
        return {
          ...a,
          userId: uid,
          attendeeUserId: uid,
          displayName: String(pd?.displayName ?? ""),
          profileData: pd,
        };
      } catch {
        return {
          ...a,
          userId: uid,
          attendeeUserId: uid,
          displayName: "",
          profileData: null,
        };
      }
    }),
  );

  // Sort by ID to maintain join order
  attendees.sort((a, b) => a.id - b.id);

  return { eventId, me, attendees };
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

function QuizSequenceContent() {
  const { eventId, me, attendees } = useLoaderData<
    typeof loader
  >() as unknown as LoaderData;
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  // Get quiz completion state from sessionStorage
  const quizProgress = useMemo(() => {
    try {
      const stored = sessionStorage.getItem(`quiz_sequence_${eventId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.completedQuizzes)) {
          return parsed as { completedQuizzes: number[] };
        }
      }
    } catch (error) {
      console.error(
        "Failed to parse quiz progress from sessionStorage:",
        error,
      );
    }
    return { completedQuizzes: [] as number[] };
  }, [eventId, refreshKey]);

  // Find current quiz index
  const currentQuizIndex = useMemo(() => {
    return quizProgress.completedQuizzes.length;
  }, [quizProgress]);

  const currentAttendee = attendees[currentQuizIndex];
  const isOwnQuiz =
    !!currentAttendee && currentAttendee.attendeeUserId === me.id;

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

  // If it's the user's own quiz, show special screen
  if (isOwnQuiz && currentAttendee) {
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

    return (
      <Stack gap="xl" align="center" py="xl">
        <ThemeIcon size={100} radius="circle" variant="light" color="blue">
          <IconSparkles size={60} />
        </ThemeIcon>
        <Stack gap="xs" align="center">
          <Title order={2}>あなたのクイズを出題しています</Title>
          <Text c="dimmed" ta="center" size="lg">
            自身のクイズについてエピソードトークをしよう
          </Text>
        </Stack>
        <Paper withBorder p="xl" radius="md" w="100%" maw={500}>
          <Text size="sm" c="dimmed">
            他の参加者があなたのクイズに挑戦しています。
            <br />
            この時間を使って、クイズに関連するエピソードや思い出を共有しましょう。
          </Text>
        </Paper>
        <Button onClick={handleNext} size="lg">
          次のクイズへ
        </Button>
      </Stack>
    );
  }

  // Otherwise, display loading state while transitioning (handled by useEffect above)
  const displayName = currentAttendee
    ? currentAttendee.displayName ||
      `ユーザー ${currentAttendee.attendeeUserId}`
    : "";

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

QuizSequenceScreen.loader = loader;
