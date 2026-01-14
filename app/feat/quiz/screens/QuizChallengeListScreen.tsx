import {
  Alert,
  Button,
  Paper,
  Stack,
  Text,
  Title,
  Group,
  Avatar,
} from "@mantine/core";
import { Suspense } from "react";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import type { Quiz } from "../types";

function QuizChallengeListContent() {
  const eventId = useNumericParam("eventId");

  if (!eventId) {
    throw new Error("eventId が不正です");
  }

  const meData = useSuspenseQuery(
    ["quiz", "challenges", eventId],
    async () => {
      const me = await apis.auth.getCurrentUser();
      return me;
    }
  );

  const attendees = useSuspenseQuery(
    ["quiz", "challenges", "attendees", eventId],
    async () => {
      const eventAttendees = await apis.events.listEventAttendees({ eventId });
      return eventAttendees;
    }
  );

  // Filter out the current user from the list
  const otherAttendees = attendees.filter(
    (attendee) => attendee.attendeeUserId !== meData.id
  );

  if (!otherAttendees.length) {
    return (
      <Stack gap="md">
        <Alert color="blue" title="参加者待ち">
          <Text size="sm">
            他の参加者が参加するまでお待ちください。
          </Text>
        </Alert>
        <Button component={Link} to={`/events/${eventId}`} fullWidth>
          ロビーへ戻る
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Alert color="blue" title="クイズに挑戦">
        <Text size="sm">
          他の参加者のクイズに挑戦しましょう！
        </Text>
      </Alert>

      {otherAttendees.map((attendee) => (
        <Paper key={attendee.id} withBorder p="md" radius="md">
          <Group>
            <Avatar radius="xl" />
            <Stack gap={4} style={{ flex: 1 }}>
              <Title order={5}>
                {(attendee as any).displayName || `ユーザー ${attendee.attendeeUserId}`}
              </Title>
              <Text size="sm" c="dimmed">
                クイズに挑戦する
              </Text>
            </Stack>
            <Button
              component={Link}
              to={`/events/${eventId}/quiz/challenge/${attendee.attendeeUserId}/1`}
              onClick={() => {
                // Clear previous quiz data when starting a new quiz
                sessionStorage.removeItem(`quiz_${eventId}_${attendee.attendeeUserId}_answers`);
                sessionStorage.removeItem(`quiz_${eventId}_${attendee.attendeeUserId}_score`);
              }}
            >
              開始
            </Button>
          </Group>
        </Paper>
      ))}

      <Button component={Link} to={`/events/${eventId}`} variant="default" fullWidth>
        ロビーへ戻る
      </Button>
    </Stack>
  );
}

export function QuizChallengeListScreen() {
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
        <Suspense
          fallback={<Text size="sm" c="dimmed">読み込み中...</Text>}
        >
          <QuizChallengeListContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
