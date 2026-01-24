import { Alert, Button, Card, Stack, Text, Title, Badge, Group, ActionIcon, Modal } from "@mantine/core";
import { Link } from "react-router-dom";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { Container } from "@/shared/ui/Container";
import { InfoAlert } from "@/shared/ui/InfoAlert";
import { NavigationButtonList } from "@/shared/ui/NavigationButtonList";
import { useCurrentUser } from "@/shared/auth/hooks";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import { JoinedEventsList } from "@/feat/events/components/JoinedEventsList";
import { useQueryClient } from "@tanstack/react-query";

function EventsList() {
  const me = useCurrentUser();
  const queryClient = useQueryClient();
  const allEvents = useSuspenseQuery(
    ["events.listEventsByUser", me.id],
    () => apis.events.listEventsByUser({ userId: me.id })
  );

  // Filter out deleted events (soft-deleted events have status: 'deleted')
  const events = allEvents?.filter((event: any) => event.status !== 'deleted') || [];

  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteClick = (event: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEventToDelete(event);
    setDeleteError(null);
    setDeleteModalOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      // Verify the API method exists
      if (typeof apis.events.deleteEvent !== 'function') {
        throw new Error('API client is outdated. Please refresh the page and try again. (deleteEvent method not found)');
      }

      await apis.events.deleteEvent({ eventId: eventToDelete.id });

      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({
        queryKey: ["events.listEventsByUser", me.id],
      });

      setDeleteModalOpened(false);
      setEventToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete event:", err);
      setDeleteError(err.message || "イベントの削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  if (!events || events.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        まだ作成したイベントはありません
      </Text>
    );
  }

  return (
    <>
      <Stack gap="sm">
        <Title order={5}>作成したイベント</Title>
        {events.map((event: any) => (
          <Card key={event.id} withBorder padding="sm" radius="md">
            <Group justify="space-between" wrap="nowrap">
              <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text fw={500} truncate>{event.meta?.name || "（名前未設定）"}</Text>
                    <Badge color={event.status === 'closed' ? 'gray' : 'green'}>
                      {event.status === 'closed' ? '終了' : '開催中'}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {event.meta?.description || "説明なし"}
                  </Text>
                </Stack>
              </Link>
              <ActionIcon
                color="red"
                variant="subtle"
                onClick={(e) => handleDeleteClick(event, e)}
                aria-label="イベントを削除"
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Group>
          </Card>
        ))}
      </Stack>

      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title={<Text fw={700}>イベントを削除</Text>}
        centered
      >
        <Stack gap="md">
          {deleteError && (
            <Alert color="red" title="エラー" onClose={() => setDeleteError(null)} withCloseButton>
              <Text size="sm">{deleteError}</Text>
            </Alert>
          )}

          <Text size="sm">
            本当に「{eventToDelete?.meta?.name || "（名前未設定）"}」を削除しますか？
            この操作は取り消せません。
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setDeleteModalOpened(false)}
              disabled={deleting}
            >
              キャンセル
            </Button>
            <Button
              color="red"
              onClick={handleConfirmDelete}
              loading={deleting}
            >
              削除する
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export function EventsHubScreen() {
  const buttons = [
    {
      label: "イベントを作成",
      to: "/events/new",
      variant: "filled" as const,
    },
    {
      label: "イベントに参加（招待コード）",
      to: "/events/join",
      variant: "light" as const,
    },
    {
      label: "ホームへ",
      to: "/home",
      variant: "default" as const,
    },
  ];

  return (
    <Container title="イベント">
      <Stack gap="md">
        <InfoAlert title="イベントって？">
          イベント = クイズセッション（ルーム）です。参加者が集まってクイズを進めます。
        </InfoAlert>

        <NavigationButtonList buttons={buttons} />

        <Stack gap="sm" mt="md">
           <JoinedEventsList />
        </Stack>

        <Stack gap="sm" mt="md">
           <EventsList />
        </Stack>

      </Stack>
    </Container>
  );
}

