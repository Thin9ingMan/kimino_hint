import { Button, Stack } from "@mantine/core";
import { Link } from "react-router-dom";
import { useState } from "react";

import { Container } from "@/shared/ui/Container";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { EventConnectionStatus, LiveEvent, ConnectionStatus } from "@/feat/events/components/EventConnectionStatus";
import { EventLiveEventsList } from "@/feat/events/components/EventLiveEventsList";

export function EventLiveScreen() {
  const eventId = useNumericParam("eventId");
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");

  const handleEventReceived = (event: LiveEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 50));
  };

  const handleStatusChange = (status: ConnectionStatus) => {
    setConnectionStatus(status);
  };

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
        <EventConnectionStatus
          eventId={eventId}
          onEventReceived={handleEventReceived}
          onStatusChange={handleStatusChange}
          showControls
        />

        <Button component={Link} to={`/events/${eventId}`} variant="default">
          ロビーに戻る
        </Button>

        {connectionStatus === "ready" && events.length > 0 && (
          <EventLiveEventsList
            events={events}
            title="ライブ更新"
            showTimestamp
            showEventType
            showUserId
            variant="detailed"
          />
        )}
      </Stack>
    </Container>
  );
}