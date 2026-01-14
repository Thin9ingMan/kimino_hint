import { Alert, Button, Card, Stack, Text, Title, Badge, Group } from "@mantine/core";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { InfoAlert } from "@/shared/ui/InfoAlert";
import { NavigationButtonList } from "@/shared/ui/NavigationButtonList";
import { InvitationCodeInput } from "@/feat/events/components/InvitationCodeInput";
import { apis } from "@/shared/api";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";

function EventsList() {
  const me = useSuspenseQuery(["auth", "me"], () => apis.auth.getCurrentUser());
  const events = useSuspenseQuery(["events", "user", me.id], () =>
    apis.events.listEventsByUser({ userId: me.id })
  );

  if (!events || events.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        まだ作成したイベントはありません
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      <Title order={5}>作成したイベント</Title>
      {events.map((event: any) => (
        <Card key={event.id} withBorder padding="sm" radius="md">
          <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={500} truncate>{event.meta?.name || "（名前未設定）"}</Text>
                <Badge color={event.status === 'closed' ? 'gray' : 'green'}>
                  {event.status === 'closed' ? '終了' : '開催中'}
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

export function EventsHubScreen() {
  const buttons = [
    {
      label: "イベントを作成",
      to: "/events/new",
      variant: "filled" as const,
    },
    {
      label: "イベントに参加（招待コード）",
      to: "/events/join",
      variant: "light" as const,
    },
    {
      label: "ホームへ",
      to: "/home",
      variant: "default" as const,
    },
  ];

  return (
    <Container title="イベント">
      <Stack gap="md">
        <InfoAlert title="イベントって？">
          イベント = クイズセッション（ルーム）です。参加者が集まってクイズを進めます。
        </InfoAlert>

        <NavigationButtonList buttons={buttons} />

        <InvitationCodeInput
          label="招待コード（ショートカット）"
          placeholder="例: QUIZ-2025-01"
          buttonText="このコードで参加する"
          navigateTo="/events/join"
          includeStateData
        />

        <Stack gap="sm" mt="md">
           <EventsList />
        </Stack>

      </Stack>
    </Container>
  );
}

