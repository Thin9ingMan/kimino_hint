import {
  Alert,
  Button,
  Card,
  Stack,
  Text,
  Title,
  Group,
  Avatar,
  ThemeIcon,
  Badge,
} from "@mantine/core";
import { Suspense } from "react";
import { Link } from "react-router-dom";
import { IconClock, IconPlayerPlay, IconUsers } from "@tabler/icons-react";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import { Loading } from "@/shared/ui/Loading";

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
      // Fetch profiles to get display names
      const enriched = await Promise.all(
        eventAttendees.map(async (a: any) => {
          const uid = a.attendeeUserId || a.userId;
          try {
            const profile = await apis.profiles.getUserProfile({ userId: uid });
            return {
              ...a,
              userId: uid,
              displayName: profile.profileData?.displayName,
              profileData: profile.profileData,
            };
          } catch (e) {
            return { ...a, userId: uid };
          }
        })
      );
      return enriched;
    }
  );


  // Filter out the current user from the list
  const otherAttendees = attendees.filter(
    (attendee) => attendee.attendeeUserId !== meData.id
  );

  if (!otherAttendees.length) {
    return (
      <Stack gap="xl" align="center" py="xl">
        <ThemeIcon size={80} radius="circle" variant="light" color="gray">
             <IconClock size={40} />
        </ThemeIcon>
        <Stack gap="xs" align="center">
            <Title order={3}>参加者待ち</Title>
            <Text c="dimmed" ta="center">
            まだ他の参加者がいません。<br/>
            もう少しお待ちください。
            </Text>
        </Stack>
        <Button component={Link} to={`/events/${eventId}`} variant="outline" size="md">
          ロビーへ戻る
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Alert color="indigo" variant="light" title="クイズに挑戦" icon={<IconUsers size={16} />}>
        他の参加者のクイズに挑戦して、スコアを競いましょう！
      </Alert>

      <Stack gap="sm">
      {otherAttendees.map((attendee) => {
        const displayName = (attendee as any).displayName || 
                          (attendee.meta as any)?.displayName || 
                          `ユーザー ${attendee.attendeeUserId}`;
        
        return (
          <Card key={attendee.id} padding="lg" radius="lg">
            <Group justify="space-between">
              <Group>
                <Avatar radius="xl" size="md" color="indigo" name={displayName} />
                <Stack gap={0}>
                  <Text fw={600} size="md">
                    {displayName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    クイズに挑戦する
                  </Text>
                </Stack>
              </Group>

              <Button
                component={Link}
                to={`/events/${eventId}/quiz/challenge/${attendee.attendeeUserId}/1`}
                onClick={() => {
                  sessionStorage.removeItem(`quiz_${eventId}_${attendee.attendeeUserId}_answers`);
                  sessionStorage.removeItem(`quiz_${eventId}_${attendee.attendeeUserId}_score`);
                }}
                variant="light"
                rightSection={<IconPlayerPlay size={16} />}
              >
                開始
              </Button>
            </Group>
          </Card>
        );
      })}
      </Stack>

      <Button component={Link} to={`/events/${eventId}`} variant="subtle" color="gray" fullWidth>
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
        <Suspense fallback={<Loading />}>
          <QuizChallengeListContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
