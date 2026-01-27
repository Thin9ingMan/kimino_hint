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
} from "@mantine/core";
import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { IconClock, IconPlayerPlay, IconUsers } from "@tabler/icons-react";

import { Container } from "@/shared/ui/Container";
import { apis, fetchCurrentUser, AppError } from "@/shared/api";
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
    throw new AppError("eventId が不正です", { recoveryUrl: "/events" });
  }

  try {
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
          const pd = isRecord(profile.profileData)
            ? profile.profileData
            : null;
          return {
            ...a,
            userId: uid,
            displayName: String(pd?.displayName ?? ""),
            profileData: pd,
          };
        } catch {
          // Removed 'e' variable
          return {
            ...a,
            userId: uid,
            displayName: "",
            profileData: null,
          };
        }
      }),
    );

    return { eventId, me, attendees };
  } catch (error) {
    throw new AppError("挑戦リストの読み込みに失敗しました", {
      cause: error,
      recoveryUrl: `/events/${eventId}`,
    });
  }
}

function QuizChallengeListContent() {
  const { eventId, me, attendees } = useLoaderData<typeof loader>();

  // Filter out the current user from the list
  const otherAttendees = attendees.filter(
    (attendee) => attendee.userId !== me.id,
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
            まだ他の参加者がいません。
            <br />
            もう少しお待ちください。
          </Text>
        </Stack>
        <Button
          component={Link}
          to={`/events/${eventId}`}
          variant="outline"
          size="md"
        >
          ロビーへ戻る
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Alert
        color="indigo"
        variant="light"
        title="クイズに挑戦"
        icon={<IconUsers size={16} />}
      >
        他の参加者のクイズに挑戦して、スコアを競いましょう！
      </Alert>

      <Stack gap="sm">
        {otherAttendees.map((attendee) => {
          const displayName =
            attendee.displayName ||
            (isRecord(attendee.meta) &&
            typeof attendee.meta.displayName === "string"
              ? attendee.meta.displayName
              : "") ||
            `ユーザー ${attendee.userId}`;

          return (
            <Card key={attendee.id} padding="lg" radius="lg">
              <Group justify="space-between">
                <Group>
                  <Avatar
                    radius="xl"
                    size="md"
                    color="indigo"
                    name={displayName}
                  />
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
                  to={`/events/${eventId}/quiz/challenge/${attendee.userId}/1`}
                  onClick={() => {
                    sessionStorage.removeItem(
                      `quiz_${eventId}_${attendee.userId}_answers`,
                    );
                    sessionStorage.removeItem(
                      `quiz_${eventId}_${attendee.userId}_score`,
                    );
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

      <Button
        component={Link}
        to={`/events/${eventId}`}
        variant="subtle"
        color="gray"
        fullWidth
      >
        ロビーへ戻る
      </Button>
    </Stack>
  );
}

export function QuizChallengeListScreen() {
  return (
    <Container title="クイズ挑戦">
      <Suspense fallback={<Loading />}>
        <QuizChallengeListContent />
      </Suspense>
    </Container>
  );
}

QuizChallengeListScreen.loader = loader;

