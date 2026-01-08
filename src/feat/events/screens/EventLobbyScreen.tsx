import {
  Alert,
  Button,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Suspense } from "react";
import { Link } from "react-router-dom";

import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { EventAttendeesList } from "@/feat/events/components/EventAttendeesList";

function EventLobbyContent() {
  const eventId = useNumericParam("eventId");

  if (!eventId) {
    throw new Error("eventId が不正です");
  }

  const [eventData, attendees] = useSuspenseQuery(
    () => Promise.all([
      apis.events.getEventById({ eventId }),
      apis.events.listEventAttendees({ eventId }),
    ]),
    [eventId]
  );

  if (!eventData) {
    return (
      <Alert color="blue" title="イベントが見つかりませんでした">
        <Button component={Link} to="/events" mt="sm" variant="light">
          イベントへ戻る
        </Button>
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md">
        <Stack gap={6}>
          <Title order={4}>イベント情報</Title>
          <Text size="sm" c="dimmed">
            {(eventData as any).name || "（名前未設定）"}
          </Text>
          {(eventData as any).description && (
            <Text size="sm" mt="xs">
              {(eventData as any).description}
            </Text>
          )}
        </Stack>
      </Paper>

      <EventAttendeesList
        attendees={(attendees ?? []).map((a: any) => ({
          id: a.id,
          userId: a.userId,
          displayName: a.displayName,
          profileData: a.profileData,
          joinedAt: a.joinedAt,
        }))}
        title="参加者"
        linkToProfile
        showJoinTime
      />

      <Stack gap="sm">
        <Button component={Link} to={`/events/${eventId}/live`} fullWidth>
          ライブ更新を見る
        </Button>
        <Button component={Link} to={`/events/${eventId}/quiz`} fullWidth variant="light">
          クイズへ
        </Button>
        <Button component={Link} to="/events" variant="default" fullWidth>
          イベント一覧へ
        </Button>
      </Stack>
    </Stack>
  );
}

export function EventLobbyScreen() {
  return (
    <Container title="ロビー">
      <ErrorBoundary
        fallback={(error, retry) => (
          <Alert color="red" title="取得エラー">
            <Stack gap="sm">
              <Text size="sm">{error.message}</Text>
              <Button variant="light" onClick={retry}>
                再試行
              </Button>
            </Stack>
          </Alert>
        )}
      >
        <Suspense fallback={<Text size="sm" c="dimmed">読み込み中...</Text>}>
          <EventLobbyContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}