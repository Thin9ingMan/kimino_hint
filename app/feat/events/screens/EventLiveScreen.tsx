import { Alert, Button, Stack, Text } from "@mantine/core";
import { Link, useLoaderData } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { apis, AppError } from "@/shared/api"; // AppError added

export async function loader({ params }: { params: { eventId?: string } }) {
  const eventId = Number(params.eventId);
  if (Number.isNaN(eventId)) {
    throw new AppError("無効なイベントIDです", { recoveryUrl: "/events" }); // Changed to throw AppError
  }

  try { // Added try block
    const eventData = await apis.events.getEventById({ eventId });
    return { eventId, eventData }; // Modified to remove 'error: null'
  } catch (error) { // Added catch block
    throw new AppError("イベント情報の読み込みに失敗しました", {
      cause: error,
      recoveryUrl: `/events/${eventId}`,
    });
  }
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export function EventLiveScreen() {
  const { eventId } = useLoaderData() as LoaderData; // Direct destructuring, assumes eventId is present

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
