import {
  Alert,
  Button,
  Card,
  Stack,
  Text,
  Title,
  Badge,
  Group,
  ActionIcon,
  Modal,
} from "@mantine/core";
import { Link, useLoaderData, useFetcher } from "react-router-dom";
import { IconTrash } from "@tabler/icons-react";
import { useState, useMemo } from "react";

import { Container } from "@/shared/ui/Container";
import { InfoAlert } from "@/shared/ui/InfoAlert";
import { NavigationButtonList } from "@/shared/ui/NavigationButtonList";
import { apis, fetchCurrentUser } from "@/shared/api";
import { JoinedEventsList } from "@/feat/events/components/JoinedEventsList";
import { EventStatusEnum } from "@yuki-js/quarkus-crud-js-fetch-client";

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function loader() {
  const me = await fetchCurrentUser();
  const [createdEvents, attendedEvents] = await Promise.all([
    apis.events.listEventsByUser({ userId: me.id }),
    apis.events.listMyAttendedEvents(),
  ]);

  return {
    me,
    createdEvents: createdEvents.filter(
      (e) => e.status !== EventStatusEnum.Deleted,
    ),
    attendedEvents: attendedEvents.filter(
      (e) => e.status !== EventStatusEnum.Deleted,
    ),
  };
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

function EventsList() {
  const { createdEvents } = useLoaderData<
    typeof loader
  >() as unknown as LoaderData;
  const fetcher = useFetcher();

  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<
    LoaderData["createdEvents"][number] | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteClick = (
    event: LoaderData["createdEvents"][number],
    e: React.MouseEvent,
  ) => {
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
      await apis.events.deleteEvent({ eventId: eventToDelete.id });
      // Refresh loader
      void fetcher.load(window.location.pathname);
      setDeleteModalOpened(false);
      setEventToDelete(null);
    } catch (err: unknown) {
      console.error("Failed to delete event:", err);
      let msg = "イベントの削除に失敗しました";
      if (isRecord(err) && typeof err.message === "string") {
        msg = err.message;
      }
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (createdEvents.length === 0) {
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
        {createdEvents.map((event) => (
          <Card key={event.id} withBorder padding="sm" radius="md">
            <Group justify="space-between" wrap="nowrap">
              <Link
                to={`/events/${event.id}`}
                style={{ textDecoration: "none", color: "inherit", flex: 1 }}
              >
                <Stack gap="xs">
                  <Group justify="space-between" gap="sm">
                    <Text fw={500} truncate>
                      {isRecord(event.meta) &&
                      typeof event.meta.name === "string"
                        ? event.meta.name
                        : "（名前未設定）"}
                    </Text>
                    <Badge
                      color={
                        event.status === EventStatusEnum.Ended
                          ? "gray"
                          : "green"
                      }
                    >
                      {event.status === EventStatusEnum.Ended
                        ? "終了"
                        : "開催中"}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {isRecord(event.meta) &&
                    typeof event.meta.description === "string"
                      ? event.meta.description
                      : "説明なし"}
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
            <Alert
              color="red"
              title="エラー"
              onClose={() => setDeleteError(null)}
              withCloseButton
            >
              <Text size="sm">{deleteError}</Text>
            </Alert>
          )}

          <Text size="sm">
            本当に「
            {isRecord(eventToDelete?.meta) &&
            typeof eventToDelete.meta.name === "string"
              ? eventToDelete.meta.name
              : "（名前未設定）"}
            」を削除しますか？ この操作は取り消せません。
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
  const buttons = useMemo(
    () => [
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
    ],
    [],
  );

  return (
    <Container title="イベント">
      <Stack gap="md">
        <InfoAlert title="イベントって？">
          イベント =
          クイズセッション（ルーム）です。参加者が集まってクイズを進めます。
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

EventsHubScreen.loader = loader;
