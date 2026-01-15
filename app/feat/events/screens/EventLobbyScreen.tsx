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
import {
  useSuspenseQueries,
} from "@/shared/hooks/useSuspenseQuery";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { EventAttendeesList } from "@/feat/events/components/EventAttendeesList";
import { EventInvitationPanel } from "@/feat/events/components/EventInvitationPanel";


function EventLobbyContent() {
  const eventId = useNumericParam("eventId");

  if (!eventId) {
    throw new Error("eventId が不正です");
  }

  /* Parallel fetching with standardized keys */
  const [eventData, attendees] = useSuspenseQueries([
    [
      ["events.getEventById", { eventId }],
      () => apis.events.getEventById({ eventId }),
    ],
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
                displayName: profile.profileData?.displayName,
                profileData: profile.profileData,
              };
            } catch (e) {
              // Ignore missing profile errors (e.g. 404)
              return { ...a, userId: uid };
            }
          })
        );
        return enriched;
      },
    ],
  ]);


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
            {(eventData as any).meta?.name || "（名前未設定）"}
          </Text>
          {(eventData as any).meta?.description && (
            <Text size="sm" mt="xs">
              {(eventData as any).meta?.description}
            </Text>
          )}

        </Stack>
      </Paper>

      <EventInvitationPanel invitationCode={(eventData as any).invitationCode} />


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
        <Button component={Link} to={`/events/${eventId}/quiz`} fullWidth>
          自分のクイズを編集
        </Button>
        <Button component={Link} to={`/events/${eventId}/quiz/challenges`} fullWidth variant="light">
          クイズに挑戦
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