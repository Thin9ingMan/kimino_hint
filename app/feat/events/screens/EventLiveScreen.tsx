import { Alert, Button, Stack, Text } from "@mantine/core";
import { Link, useLoaderData } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { apis } from "@/shared/api";

export async function loader({ params }: { params: { eventId?: string } }) {
  const eventId = Number(params.eventId);
  if (Number.isNaN(eventId)) {
    return { eventId: null, eventData: null, error: "invalid_id" as const };
  }

  const eventData = await apis.events.getEventById({ eventId });
  return { eventId, eventData, error: null };
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export function EventLiveScreen() {
  const data = useLoaderData() as LoaderData;

  if (data.error === "invalid_id" || !data.eventId) {
    return (
      <Container title="ライブ更新">
        <Stack gap="md">
          <Text>無効なイベントIDです</Text>
          <Button component={Link} to="/events" variant="default">
            イベント一覧へ
          </Button>
        </Stack>
      </Container>
    );
  }

  const { eventId } = data;

  return (
    <Container title="ライブ更新">
      <Stack gap="md">
        <Alert color="yellow" title="工事中">
          <Text size="sm">
            SSE（Server-Sent Events）機能は現在準備中です。
            しばらくお待ちください。
          </Text>
        </Alert>

        <Button
          component={Link}
          to={`/events/${eventId}`}
          variant="default"
          fullWidth
        >
          ロビーに戻る
        </Button>
      </Stack>
    </Container>
  );
}

EventLiveScreen.loader = loader;
