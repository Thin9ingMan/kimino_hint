import { Alert, Button, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { Container } from "@/shared/ui/Container";

export function QuizIntroScreen() {
  const params = useParams();
  const eventId = useMemo(() => params.eventId ?? "", [params.eventId]);

  const startHref = useMemo(() => {
    if (!eventId) return "/home";
    return `/events/${eventId}/quiz/1`;
  }, [eventId]);

  return (
    <Container title="クイズ開始">
      <Stack gap="md">
        <Alert color="blue" title="準備">
          <Text size="sm">
            クイズはイベント単位で進みます。準備ができたら開始してください。
          </Text>
        </Alert>

        <Button component={Link} to={startHref} fullWidth size="md">
          はじめる
        </Button>

        {eventId && (
          <Button component={Link} to={`/events/${eventId}`} variant="default" fullWidth>
            ロビーへ戻る
          </Button>
        )}
      </Stack>
    </Container>
  );
}
