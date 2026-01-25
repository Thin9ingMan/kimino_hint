import { Alert, Button, Group, Loader, Stack, Text } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "@/shared/api";
import { getJwtToken } from "@/shared/api/tokenStorage";

export type ConnectionStatus = "connecting" | "ready" | "error";

export type LiveEvent = {
  eventType?: string;
  eventId?: number;
  attendeeUserId?: number;
  timestamp?: string;
  data?: unknown;
};

interface EventConnectionStatusProps {
  eventId: number | null;
  onEventReceived?: (event: LiveEvent) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  maxEvents?: number;
  showControls?: boolean;
}

/**
 * EventSource接続の管理コンポーネント
 * EventLiveScreen で使用されるリアルタイム接続ロジックを分離
 */
export function EventConnectionStatus({
  eventId,
  onEventReceived,
  onStatusChange,
  maxEvents = 50,
  showControls = true,
}: EventConnectionStatusProps) {
  // kept for API compatibility (events limiting is handled by EventLiveEventsList)
  void maxEvents;
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const updateStatus = useCallback(
    (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange],
  );

  const connect = useCallback(() => {
    if (!eventId) {
      updateStatus("error");
      setError("eventId が不正です");
      return;
    }

    updateStatus("connecting");
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
      updateStatus("ready");
    };

    es.onerror = () => {
      updateStatus("error");
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
        onEventReceived?.(data);
      } catch {
        // Fallback for non-JSON messages
        onEventReceived?.({ data: msg.data } as any);
      }
    };
  }, [eventId, updateStatus, onEventReceived]);

  const disconnect = useCallback(() => {
    if (esRef.current) {
      try {
        esRef.current.close();
      } catch {
        // ignore
      }
      esRef.current = null;
    }
    updateStatus("connecting");
  }, [updateStatus]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const getStatusDisplay = () => {
    switch (status) {
      case "connecting":
        return (
          <Group gap="sm">
            <Loader size="xs" />
            <Text size="sm" c="dimmed">
              接続中...
            </Text>
          </Group>
        );
      case "ready":
        return (
          <Group gap="sm">
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "var(--mantine-color-green-filled)",
              }}
            />
            <Text size="sm" c="green">
              接続中
            </Text>
          </Group>
        );
      case "error":
        return (
          <Alert color="red" title="接続エラー">
            <Stack gap="sm">
              <Text size="sm">{error}</Text>
              {showControls && (
                <Button variant="light" size="sm" onClick={connect}>
                  再接続
                </Button>
              )}
            </Stack>
          </Alert>
        );
    }
  };

  return <>{getStatusDisplay()}</>;
}
