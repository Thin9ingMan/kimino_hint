import { Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { getJoinedEventIds } from "@/shared/storage/joinedEvents";
import { apis } from "@/shared/api";

interface JoinedEvent {
  id: number;
  meta?: {
    name?: string;
    description?: string;
  };
  status?: string;
}

export function JoinedEventsList() {
  const [joinedEvents, setJoinedEvents] = useState<JoinedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJoinedEvents = async () => {
      setLoading(true);
      try {
        const eventIds = getJoinedEventIds();
        
        if (eventIds.length === 0) {
          setJoinedEvents([]);
          setLoading(false);
          return;
        }

        // Fetch event details for each joined event ID
        // Note: This creates N API calls. Consider implementing batch API if available.
        const eventPromises = eventIds.map(async (eventId) => {
          try {
            const event = await apis.events.getEventById({ eventId });
            return event;
          } catch (error) {
            // If event is not found or error occurs, skip it
            console.error(`Failed to load event ${eventId}:`, error);
            return null;
          }
        });

        const events = await Promise.all(eventPromises);
        
        // Filter out null values (failed fetches)
        const validEvents = events
          .filter((event): event is JoinedEvent => event !== null)
          .reverse(); // Most recently joined first (assumes IDs are sequential)

        setJoinedEvents(validEvents);
      } catch (error) {
        console.error("Failed to load joined events:", error);
        setJoinedEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadJoinedEvents();
  }, []); // Run only once on mount

  if (loading) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        読み込み中...
      </Text>
    );
  }

  if (joinedEvents.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        まだ参加したイベントはありません
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      <Title order={5}>参加したイベント</Title>
      {joinedEvents.map((event) => (
        <Card key={event.id} withBorder padding="sm" radius="md">
          <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={500} truncate>{event.meta?.name || "（名前未設定）"}</Text>
                <Badge color={event.status === 'closed' ? 'gray' : 'blue'}>
                  {event.status === 'closed' ? '終了' : '参加中'}
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
