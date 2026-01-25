import { Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";

import { apis } from "@/shared/api";
import { useCurrentUser } from "@/shared/auth/hooks";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";

export function JoinedEventsList() {
  const me = useCurrentUser();
  const allJoinedEvents = useSuspenseQuery(
    ["events.listMyAttendedEvents", me.id],
    () => apis.events.listMyAttendedEvents(),
  );

  // Filter out deleted events
  const joinedEvents =
    allJoinedEvents?.filter((event: any) => event.status !== "deleted") || [];

  if (!joinedEvents || joinedEvents.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        まだ参加したイベントはありません
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      <Title order={5}>参加したイベント</Title>
      {joinedEvents.map((event: any) => (
        <Card key={event.id} withBorder padding="sm" radius="md">
          <Link
            to={`/events/${event.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={500} truncate>
                  {event.meta?.name || "（名前未設定）"}
                </Text>
                <Badge color={event.status === "closed" ? "gray" : "blue"}>
                  {event.status === "closed" ? "終了" : "参加中"}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                {event.meta?.description || "説明なし"}
              </Text>
            </Stack>
          </Link>
        </Card>
      ))}
    </Stack>
  );
}
