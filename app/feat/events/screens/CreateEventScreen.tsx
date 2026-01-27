import {
  Alert,
  Button,
  Stack,
  Text,
  TextInput,
  Textarea,
  NumberInput,
} from "@mantine/core";
import { Suspense, useState } from "react";
import { useNavigate, useLoaderData } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { apis, fetchCurrentUser, AppError } from "@/shared/api"; // AppError added

export async function loader() {
  try { // Added try block
    const me = await fetchCurrentUser();
    return { me };
  } catch (error) { // Added catch block
    throw new AppError("ユーザー情報の読み込みに失敗しました", {
      cause: error,
      recoveryUrl: "/events",
    });
  }
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

function CreateEventContent() {
  const navigate = useNavigate();
  useLoaderData(); // Ensure loader is used

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number | string>(10);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("イベント名を入力してください");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const event = await apis.events.createEvent({
        eventCreateRequest: {
          meta: {
            name: title.trim(),
            description: description.trim() || undefined,
            maxParticipants:
              typeof maxParticipants === "number" ? maxParticipants : undefined,
          },
        },
      });

      // Navigate to the event lobby
      navigate(`/events/${event.id}`);
    } catch (err) {
      console.error("Failed to create event:", err);
      setError("イベントの作成に失敗しました。もう一度お試しください。");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Stack gap="md">
      <Alert color="blue" title="新規イベント作成">
        <Text size="sm">
          イベントを作成して、参加者を招待しましょう。
          作成後、招待コードとQRコードが生成されます。
        </Text>
      </Alert>

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
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        required
        maxLength={100}
      />

      <Textarea
        label="説明（オプション）"
        placeholder="イベントの詳細を入力してください"
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        minRows={3}
        maxLength={500}
      />

      <NumberInput
        label="最大参加者数（オプション）"
        placeholder="制限なし"
        value={maxParticipants}
        onChange={setMaxParticipants}
        min={2}
        max={100}
      />

      <Stack gap="sm">
        <Button
          onClick={handleCreate}
          loading={creating}
          disabled={!title.trim()}
          fullWidth
          size="md"
        >
          イベントを作成
        </Button>
        <Button onClick={() => navigate("/events")} variant="default" fullWidth>
          キャンセル
        </Button>
      </Stack>
    </Stack>
  );
}

export function CreateEventScreen() {
  return (
    <Container title="新規イベント作成">
      <Suspense
        fallback={
          <Text size="sm" c="dimmed">
            読み込み中...
          </Text>
        }
      >
        <CreateEventContent />
      </Suspense>
    </Container>
  );
}

CreateEventScreen.loader = loader;
