import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";

type Status = "loading" | "ready" | "not_found" | "error";

export function EventLobbyScreen() {
  const params = useParams();
  const eventId = useMemo(() => {
    const raw = params.eventId ?? "";
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params.eventId]);

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!eventId) {
      setStatus("error");
      setError("eventId が不正です");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const [e, a] = await Promise.all([
        apis.events.getEventById({ eventId }),
        apis.events.listEventAttendees({ eventId }),
      ]);

      setEvent(e as any);
      setAttendees((a ?? []) as any);
      setStatus("ready");
    } catch (ex: any) {
      const s = ex?.status ?? ex?.response?.status;
      if (s === 404) {
        setStatus("not_found");
        return;
      }
      setError(String(ex?.message ?? "イベント情報の取得に失敗しました"));
      setStatus("error");
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Container title="ロビー">
      {status === "loading" && (
        <Center py="xl">
          <Group gap="sm">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              読み込み中...
            </Text>
          </Group>
        </Center>
      )}

      {status === "error" && (
        <Alert color="red" title="取得エラー">
          <Stack gap="sm">
            <Text size="sm">{error}</Text>
            <Button variant="light" onClick={load}>
              再試行
            </Button>
          </Stack>
        </Alert>
      )}

      {status === "not_found" && (
        <Alert color="blue" title="イベントが見つかりませんでした">
          <Button component={Link} to="/events" mt="sm" variant="light">
            イベントへ戻る
          </Button>
        </Alert>
      )}

      {status === "ready" && (
        <Stack gap="md">
          <Paper withBorder p="md" radius="md">
            <Stack gap={6}>
              <Title order={4}>イベント情報</Title>
              <Text size="sm" c="dimmed">
                eventId: {String(event?.id ?? eventId)}
              </Text>
              {event?.invitationCode && (
                <Text size="sm">招待コード: {String(event.invitationCode)}</Text>
              )}
              {event?.status && (
                <Text size="sm">状態: {String(event.status)}</Text>
              )}
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Title order={4}>参加者</Title>
              {!attendees.length ? (
                <Text size="sm" c="dimmed">
                  まだ参加者がいません。
                </Text>
              ) : (
                attendees.map((a) => (
                  <Group key={String(a.id)} justify="space-between">
                    <Text size="sm">User #{String(a.attendeeUserId)}</Text>
                    <Text size="sm" c="dimmed">
                      {String(a.createdAt ?? "")}
                    </Text>
                  </Group>
                ))
              )}
            </Stack>
          </Paper>

          <Button component={Link} to={`/events/${eventId}/live`} fullWidth>
            ライブ状況を見る
          </Button>

          <Button component={Link} to={`/events/${eventId}/quiz`} variant="light" fullWidth>
            クイズへ
          </Button>
        </Stack>
      )}
    </Container>
  );
}
