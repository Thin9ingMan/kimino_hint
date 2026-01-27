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
import {
  Link,
  useLoaderData,
  useFetcher,
  useNavigation,
  useRevalidator,
} from "react-router-dom";

import { apis, fetchCurrentUser } from "@/shared/api";
import { toApiError, AppError } from "@/shared/api/errors";
import { Container } from "@/shared/ui/Container";
import { EventAttendeesList } from "@/feat/events/components/EventAttendeesList";
import { EventInvitationPanel } from "@/feat/events/components/EventInvitationPanel";

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function loader({ params }: { params: { eventId?: string } }) {
  const eventId = Number(params.eventId);
  if (Number.isNaN(eventId)) {
    throw new AppError("eventId が不正です", { recoveryUrl: "/events" });
  }

  try {
    const [me, eventData, eventAttendees] = await Promise.all([
      fetchCurrentUser(),
      apis.events.getEventById({ eventId }),
      apis.events.listEventAttendees({ eventId }),
    ]);

    // Fetch profiles and quiz data to get display names and check readiness
    const attendees = await Promise.all(
      eventAttendees.map(async (a) => {
        const uid = a.attendeeUserId;
        if (uid === undefined) throw new Error("User ID is missing");

        let profileData: Record<string, unknown> | null = null;
        let hasProfile = false;
        let hasQuiz = false;

        try {
          const profile = await apis.profiles.getUserProfile({ userId: uid });
          const rawPd = profile.profileData;
          if (isRecord(rawPd)) {
            profileData = rawPd;
            hasProfile = true;
          }
        } catch {
          hasProfile = false;
        }

        try {
          const eventUserData = await apis.events.getEventUserData({
            eventId,
            userId: uid,
          });
          hasQuiz = !!eventUserData.userData?.myQuiz;
        } catch {
          hasQuiz = false;
        }

        return {
          ...a,
          userId: uid,
          displayName: String(profileData?.displayName ?? ""),
          profileData,
          hasProfile,
          hasQuiz,
        };
      }),
    );
    return { eventId, eventData, attendees, me };
  } catch (err) {
    const apiError = toApiError(err);
    if (apiError.kind === "not_found") {
      const me = await fetchCurrentUser();
      return { eventId, eventData: null, attendees: [], me };
    }
    throw new AppError("イベントの読み込みに失敗しました", {
      cause: err,
      recoveryUrl: "/events",
    });
  }
}

function EventLobbyContent() {
  const { eventId, eventData, attendees, me } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!eventData) {
    return (
      <Alert color="blue" title="イベントが見つかりませんでした">
        <Button component={Link} to="/events" mt="sm" variant="light">
          イベントへ戻る
        </Button>
      </Alert>
    );
  }

  const isCreator = eventData.initiatorId === me.id;

  // Check if all attendees have both profile and quiz data
  const attendeesWithoutProfile = attendees.filter((a) => !a.hasProfile);
  const attendeesWithoutQuiz = attendees.filter((a) => !a.hasQuiz);
  const allAttendeesReady =
    attendeesWithoutProfile.length === 0 && attendeesWithoutQuiz.length === 0;

  const handleOpenEditModal = () => {
    const meta = eventData.meta;
    setEditName(isRecord(meta) ? String(meta.name ?? "") : "");
    setEditDescription(isRecord(meta) ? String(meta.description ?? "") : "");
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

      // Refresh loader data
      revalidator.revalidate();
      setEditModalOpened(false);
    } catch (err: unknown) {
      console.error("Failed to update event:", err);
      let msg = "イベントの更新に失敗しました。もう一度お試しください。";
      if (isRecord(err) && typeof err.message === "string") {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshAttendees = () => {
    revalidator.revalidate();
  };

  const isSaving =
    saving ||
    navigation.state !== "idle" ||
    fetcher.state !== "idle" ||
    revalidator.state !== "idle";

  const eventName = isRecord(eventData.meta)
    ? String(eventData.meta.name ?? "（名前未設定）")
    : "（名前未設定）";
  const eventDescription = isRecord(eventData.meta)
    ? String(eventData.meta.description ?? "")
    : "";

  const myAttendance = attendees.find((a) => a.userId === me.id);
  const hasMyQuiz = !!myAttendance?.hasQuiz;

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
                disabled={isSaving}
              >
                編集
              </Button>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {eventName}
          </Text>
          {eventDescription && (
            <Text size="sm" mt="xs">
              {eventDescription}
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
            <Alert
              color="red"
              title="エラー"
              onClose={() => setError(null)}
              withCloseButton
            >
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
            disabled={isSaving}
          />

          <Textarea
            label="説明"
            placeholder="イベントの詳細を入力してください"
            value={editDescription}
            onChange={(e) => setEditDescription(e.currentTarget.value)}
            minRows={3}
            maxLength={500}
            disabled={isSaving}
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setEditModalOpened(false)}
              disabled={isSaving}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveEdit}
              loading={isSaving}
              disabled={!editName.trim()}
            >
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>

      <EventInvitationPanel invitationCode={eventData.invitationCode} />

      {!allAttendeesReady && (
        <Alert color="yellow" title="クイズを開始できません">
          <Stack gap="xs">
            <Text size="sm">
              全員がプロフィールとクイズを作成してからクイズに挑戦できます。
            </Text>
            {attendeesWithoutProfile.length > 0 && (
              <Text size="sm">
                プロフィール未作成:{" "}
                {attendeesWithoutProfile
                  .map((a) => a.displayName || `ユーザー ${a.userId}`)
                  .join(", ")}
              </Text>
            )}
            {attendeesWithoutQuiz.length > 0 && (
              <Text size="sm">
                クイズ未作成:{" "}
                {attendeesWithoutQuiz
                  .map((a) => a.displayName || `ユーザー ${a.userId}`)
                  .join(", ")}
              </Text>
            )}
          </Stack>
        </Alert>
      )}

      <EventAttendeesList
        attendees={attendees.map((a) => ({
          id: a.id ?? 0,
          userId: a.userId,
          displayName: a.displayName,
          profileData: a.profileData,
          joinedAt: a.createdAt,
        }))}
        title="参加者"
        linkToProfile
        showJoinTime
        onRefresh={handleRefreshAttendees}
      />

      <Stack gap="sm">
        <Button
          component={Link}
          to={`/events/${eventId}/quiz`}
          fullWidth
          variant={hasMyQuiz ? "light" : "gradient"}
          size={hasMyQuiz ? "sm" : "xl"}
        >
          自分のクイズを編集
        </Button>
        <Button
          component={allAttendeesReady ? Link : undefined}
          to={
            allAttendeesReady
              ? (`/events/${eventId}/quiz/sequence` as any)
              : undefined
          }
          fullWidth
          variant="gradient"
          size={allAttendeesReady ? "xl" : "sm"}
          disabled={!allAttendeesReady}
          onClick={
            allAttendeesReady
              ? () => {
                  // Reset quiz sequence progress when starting
                  sessionStorage.removeItem(`quiz_sequence_${eventId}`);
                }
              : undefined
          }
        >
          クイズに挑戦
        </Button>
        <Button component={Link} to="/events" variant="transparent" fullWidth>
          イベント一覧へ
        </Button>
      </Stack>
    </Stack>
  );
}

export function EventLobbyScreen() {
  return (
    <Container title="ロビー">
      <Suspense
        fallback={
          <Text size="sm" c="dimmed">
            読み込み中...
          </Text>
        }
      >
        <EventLobbyContent />
      </Suspense>
    </Container>
  );
}

EventLobbyScreen.loader = loader;
