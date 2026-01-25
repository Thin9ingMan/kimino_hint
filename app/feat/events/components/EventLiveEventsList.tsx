import {
  Badge,
  Code,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { LiveEvent } from "./EventConnectionStatus";

interface EventLiveEventsListProps {
  events: LiveEvent[];
  title?: string;
  maxHeight?: number;
  showTimestamp?: boolean;
  showEventType?: boolean;
  showUserId?: boolean;
  maxEvents?: number;
  emptyMessage?: string;
  variant?: "detailed" | "compact" | "minimal";
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return timestamp;
  }
}

function getEventTypeColor(eventType?: string): string {
  switch (eventType) {
    case "user_joined":
      return "green";
    case "user_left":
      return "red";
    case "quiz_answer":
      return "blue";
    case "quiz_start":
      return "orange";
    case "quiz_end":
      return "gray";
    default:
      return "indigo";
  }
}

function formatEventData(data: unknown): string {
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
  return String(data || "");
}

/**
 * ライブイベント一覧表示コンポーネント
 * EventLiveScreen で受信したリアルタイムイベントを表示
 */
export function EventLiveEventsList({
  events,
  title = "ライブ更新",
  maxHeight = 400,
  showTimestamp = true,
  showEventType = true,
  showUserId = false,
  maxEvents,
  emptyMessage = "まだイベントがありません",
  variant = "detailed",
}: EventLiveEventsListProps) {
  const displayEvents = maxEvents ? events.slice(0, maxEvents) : events;

  if (events.length === 0) {
    return (
      <Stack gap="sm">
        {title && <Title order={4}>{title}</Title>}
        <Text size="sm" c="dimmed">
          {emptyMessage}
        </Text>
      </Stack>
    );
  }

  const renderEvent = (event: LiveEvent, index: number) => {
    const timestamp = formatTimestamp(event.timestamp);
    const eventData = formatEventData(event.data);
    const isCompact = variant === "compact" || variant === "minimal";

    return (
      <Paper
        key={`event-${index}-${event.timestamp}`}
        p={isCompact ? "xs" : "sm"}
        withBorder
        style={{
          borderLeft: `3px solid var(--mantine-color-${getEventTypeColor(event.eventType)}-6)`,
        }}
      >
        <Stack gap={isCompact ? "xs" : "sm"}>
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              {showEventType && event.eventType && (
                <Badge
                  size="xs"
                  color={getEventTypeColor(event.eventType)}
                  variant="light"
                >
                  {event.eventType}
                </Badge>
              )}
              {showUserId && event.attendeeUserId && (
                <Badge size="xs" variant="outline">
                  User {event.attendeeUserId}
                </Badge>
              )}
            </Group>

            {showTimestamp && timestamp && (
              <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                {timestamp}
              </Text>
            )}
          </Group>

          {variant !== "minimal" && eventData && (
            <Code
              block={variant === "detailed"}
              style={{
                wordBreak: "break-word",
                maxHeight: variant === "detailed" ? "none" : "60px",
                overflow: variant === "detailed" ? "visible" : "hidden",
                fontSize: "0.75rem",
              }}
            >
              {eventData}
            </Code>
          )}
        </Stack>
      </Paper>
    );
  };

  return (
    <Stack gap="sm">
      {title && (
        <Group justify="space-between">
          <Title order={4}>{title}</Title>
          <Badge variant="light" size="sm">
            {events.length}
          </Badge>
        </Group>
      )}

      <ScrollArea h={maxHeight} type="auto">
        <Stack gap="xs">{displayEvents.map(renderEvent)}</Stack>
      </ScrollArea>
    </Stack>
  );
}
