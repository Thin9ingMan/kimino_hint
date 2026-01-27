import { Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { Link, useLoaderData } from "react-router-dom";
import { EventsHubScreen } from "../screens/EventsHubScreen";
import { EventStatusEnum } from "@yuki-js/quarkus-crud-js-fetch-client";

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

type LoaderData = Awaited<ReturnType<typeof EventsHubScreen.loader>>;

export function JoinedEventsList() {
  const { attendedEvents } = useLoaderData<
    typeof EventsHubScreen.loader
  >() as unknown as LoaderData;

  if (attendedEvents.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        まだ参加したイベントはありません
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      <Title order={5}>参加したイベント</Title>
      {attendedEvents.map((event) => (
        <Card key={event.id} withBorder padding="sm" radius="md">
          <Link
            to={`/events/${event.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Stack gap="xs">
              <Group justify="space-between" gap="sm">
                <Text fw={500} truncate>
                  {isRecord(event.meta) && typeof event.meta.name === "string"
                    ? event.meta.name
                    : "（名前未設定）"}
                </Text>
                <Badge
                  color={
                    event.status === EventStatusEnum.Ended ? "gray" : "blue"
                  }
                >
                  {event.status === EventStatusEnum.Ended ? "終了" : "参加中"}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                {isRecord(event.meta) &&
                typeof event.meta.description === "string"
                  ? event.meta.description
                  : "説明なし"}
              </Text>
            </Stack>
          </Link>
        </Card>
      ))}
    </Stack>
  );
}
