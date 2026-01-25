import { Alert, Button, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { useNumericParam } from "@/shared/hooks/useNumericParam";

export function EventLiveScreen() {
  const eventId = useNumericParam("eventId");

  if (!eventId) {
    return (
      <Container title="ライブ更新">
        <Stack gap="md">
          <p>無効なイベントIDです</p>
          <Button component={Link} to="/events" variant="default">
            イベント一覧へ
          </Button>
        </Stack>
      </Container>
    );
  }

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
