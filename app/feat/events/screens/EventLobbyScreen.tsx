import {
  Alert,
  Button,
  Paper,
  Stack,
  Text,
  Title,
  Modal,
  TextInput,
  Textarea,
  Group,
} from "@mantine/core";
import { Suspense, useState } from "react";
import { Link } from "react-router-dom";

import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import {
  useSuspenseQueries,
} from "@/shared/hooks/useSuspenseQuery";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { EventAttendeesList } from "@/feat/events/components/EventAttendeesList";
import { EventInvitationPanel } from "@/feat/events/components/EventInvitationPanel";
import { useCurrentUser } from "@/shared/auth/hooks";
import { useQueryClient } from "@tanstack/react-query";


function EventLobbyContent() {
  const eventId = useNumericParam("eventId");
  const me = useCurrentUser();
  const queryClient = useQueryClient();
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshingAttendees, setIsRefreshingAttendees] = useState(false);

  if (!eventId) {
    throw new Error("eventId が不正です");
  }

  /* Parallel fetching with standardized keys */
  const [eventData, attendees] = useSuspenseQueries([
    [
      ["events.getEventById", { eventId }],
      () => apis.events.getEventById({ eventId }),
    ],
    [
      ["events.listEventAttendees", { eventId }],
      async () => {
        const eventAttendees = await apis.events.listEventAttendees({
          eventId,
        });
        // Fetch profiles to get display names
        const enriched = await Promise.all(
          eventAttendees.map(async (a: any) => {
            const uid = a.attendeeUserId || a.userId;
            try {
              const profile = await apis.profiles.getUserProfile({
                userId: uid,
              });
              return {
                ...a,
                userId: uid,
                displayName: profile.profileData?.displayName,
                profileData: profile.profileData,
              };
            } catch (e) {
              // Ignore missing profile errors (e.g. 404)
              return { ...a, userId: uid };
            }
          })
        );
        return enriched;
      },
    ],
  ]);


  if (!eventData) {
    return (
      <Alert color="blue" title="イベントが見つかりませんでした">
        <Button component={Link} to="/events" mt="sm" variant="light">
          イベントへ戻る
        </Button>
      </Alert>
    );
  }

  const isCreator = (eventData as any).initiatorId === me.id;

  const handleOpenEditModal = () => {
    setEditName((eventData as any).meta?.name || "");
    setEditDescription((eventData as any).meta?.description || "");
    setError(null);
    setEditModalOpened(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setError("イベント名を入力してください");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await apis.events.updateEvent({
        eventId,
        eventUpdateRequest: {
          meta: {
            name: editName.trim(),
            description: editDescription.trim() || undefined,
          },
        },
      });

      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({
        queryKey: ["events.getEventById", { eventId }],
      });

      setEditModalOpened(false);
    } catch (err) {
      console.error("Failed to update event:", err);
      setError("イベントの更新に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshAttendees = async () => {
    setIsRefreshingAttendees(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["events.listEventAttendees", { eventId }],
      });
    } catch (error) {
      console.error("Failed to refresh attendees:", error);
      // Query invalidation rarely fails, but if it does, we still want to reset the loading state
      // The UI will show the last known state, which is acceptable
    } finally {
      setIsRefreshingAttendees(false);
    }
  };

  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md">
        <Stack gap={6}>
          <Group justify="space-between" align="flex-start">
            <Title order={4}>イベント情報</Title>
            {isCreator && (
              <Button
                size="xs"
                variant="light"
                onClick={handleOpenEditModal}
              >
                編集
              </Button>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {(eventData as any).meta?.name || "（名前未設定）"}
          </Text>
          {(eventData as any).meta?.description && (
            <Text size="sm" mt="xs">
              {(eventData as any).meta?.description}
            </Text>
          )}

        </Stack>
      </Paper>

      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title={<Text fw={700}>イベント情報を編集</Text>}
        centered
      >
        <Stack gap="md">
          {error && (
            <Alert color="red" title="エラー" onClose={() => setError(null)} withCloseButton>
              <Text size="sm">{error}</Text>
            </Alert>
          )}

          <TextInput
            label="イベント名"
            placeholder="例: 新入生歓迎会クイズ大会"
            value={editName}
            onChange={(e) => setEditName(e.currentTarget.value)}
            required
            maxLength={100}
          />

          <Textarea
            label="説明"
            placeholder="イベントの詳細を入力してください"
            value={editDescription}
            onChange={(e) => setEditDescription(e.currentTarget.value)}
            minRows={3}
            maxLength={500}
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setEditModalOpened(false)}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveEdit}
              loading={saving}
              disabled={!editName.trim()}
            >
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>

      <EventInvitationPanel invitationCode={(eventData as any).invitationCode} />


      <EventAttendeesList
        attendees={(attendees ?? []).map((a: any) => ({
          id: a.id,
          userId: a.userId,
          displayName: a.displayName,
          profileData: a.profileData,
          joinedAt: a.joinedAt,
        }))}
        title="参加者"
        linkToProfile
        showJoinTime
        onRefresh={handleRefreshAttendees}
        isRefreshing={isRefreshingAttendees}
      />

      <Stack gap="sm">
        <Button component={Link} to={`/events/${eventId}/quiz`} fullWidth>
          自分のクイズを編集
        </Button>
        <Button 
          component={Link} 
          to={`/events/${eventId}/quiz/sequence`} 
          fullWidth 
          variant="light"
          onClick={() => {
            // Reset quiz sequence progress when starting
            sessionStorage.removeItem(`quiz_sequence_${eventId}`);
          }}
        >
          クイズに挑戦
        </Button>
        <Button component={Link} to="/events" variant="default" fullWidth>
          イベント一覧へ
        </Button>
      </Stack>
    </Stack>
  );
}

export function EventLobbyScreen() {
  return (
    <Container title="ロビー">
      <ErrorBoundary
        fallback={(error, retry) => (
          <Alert color="red" title="取得エラー">
            <Stack gap="sm">
              <Text size="sm">{error.message}</Text>
              <Button variant="light" onClick={retry}>
                再試行
              </Button>
            </Stack>
          </Alert>
        )}
      >
        <Suspense fallback={<Text size="sm" c="dimmed">読み込み中...</Text>}>
          <EventLobbyContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}