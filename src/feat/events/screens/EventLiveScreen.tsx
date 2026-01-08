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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getApiBaseUrl } from "@/shared/api";
import { getJwtToken } from "@/shared/api/tokenStorage";
import { Container } from "@/shared/ui/Container";

type Status = "connecting" | "ready" | "error";

type LiveEvent = {
  eventType?: string;
  eventId?: number;
  attendeeUserId?: number;
  timestamp?: string;
  data?: unknown;
};

export function EventLiveScreen() {
  const params = useParams();
  const eventId = useMemo(() => {
    const raw = params.eventId ?? "";
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params.eventId]);

  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);

  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!eventId) {
      setStatus("error");
      setError("eventId が不正です");
      return;
    }

    setStatus("connecting");
    setError(null);

    // NOTE: Native EventSource cannot set headers.
    // We pass token via query for now. (Backend must accept it; if not, this will error.)
    const base = getApiBaseUrl();
    const token = getJwtToken();

    const url = new URL(`${base}/api/events/${eventId}/live`);
    if (token) url.searchParams.set("access_token", token);

    const es = new EventSource(url.toString());
    esRef.current = es;

    es.onopen = () => {
      setStatus("ready");
    };

    es.onerror = () => {
      setStatus("error");
      setError("ライブ更新に接続できませんでした");
      try {
        es.close();
      } catch {
        // ignore
      }
    };

    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as LiveEvent;
        setEvents((prev) => [data, ...prev].slice(0, 50));
      } catch {
        setEvents((prev) => [{ data: msg.data } as any, ...prev].slice(0, 50));
      }
    };
  }, [eventId]);

  useEffect(() => {
    connect();

    return () => {
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {
          // ignore
        }
        esRef.current = null;
      }
    };
  }, [connect]);

  return (
    <Container title="ライブ状況">
      <Stack gap="md">
        {status === "connecting" && (
          <Center py="xl">
            <Group gap="sm">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                接続中...
              </Text>
            </Group>
          </Center>
        )}

        {status === "error" && (
          <Alert color="red" title="接続エラー">
            <Stack gap="sm">
              <Text size="sm">{error}</Text>
              <Button variant="light" onClick={connect}>
                再接続
              </Button>
            </Stack>
          </Alert>
        )}

        <Paper withBorder p="md" radius="md">
          <Stack gap={6}>
            <Title order={4}>最新イベント</Title>
            {!events.length ? (
              <Text size="sm" c="dimmed">
                まだ更新がありません。
              </Text>
            ) : (
              events.map((e, idx) => (
                <Text key={idx} size="sm" style={{ wordBreak: "break-word" }}>
                  {e.eventType
                    ? `${e.eventType} / attendee: ${String(e.attendeeUserId ?? "-")}`
                    : String(e.data)}
                </Text>
              ))
            )}
          </Stack>
        </Paper>

        {eventId && (
          <Button component={Link} to={`/events/${eventId}`} variant="default" fullWidth>
            ロビーへ戻る
          </Button>
        )}
      </Stack>
    </Container>
  );
}
