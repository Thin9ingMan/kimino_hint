import {
  Alert,
  Button,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { apis } from "@/shared/api";
import { addJoinedEventId } from "@/shared/storage/joinedEvents";

function JoinEventContent() {
  const navigate = useNavigate();
  const [invitationCode, setInvitationCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!invitationCode.trim()) {
      setError("招待コードを入力してください");
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const result = await apis.events.joinEventByCode({
        eventJoinByCodeRequest: {
          invitationCode: invitationCode.trim(),
        },
      });

      // Save joined event ID to localStorage
      if (result.eventId) {
        addJoinedEventId(result.eventId);
      }

      // Navigate to event lobby
      navigate(`/events/${result.eventId}`);
    } catch (err: any) {
      console.error("Failed to join event:", err);
      const status = err?.response?.status;

      if (status === 400 || status === 404) {
        setError("招待コードが無効または期限切れです");
      } else if (status === 401) {
        setError("認証エラーが発生しました。再試行してください。");
      } else if (status === 409) {
        setError("すでにこのイベントに参加しています");
      } else {
        setError("イベントへの参加に失敗しました");
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <Stack gap="md">
      <Alert color="blue" title="イベントに参加">
        <Text size="sm">
          招待コードを入力してイベントに参加しましょう。
          QRコードをお持ちの場合は、QRスキャン画面をご利用ください。
        </Text>
      </Alert>

      {error && (
        <Alert color="red" title="エラー" onClose={() => setError(null)} withCloseButton>
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      <TextInput
        label="招待コード"
        placeholder="例: ABC123"
        value={invitationCode}
        onChange={(e) => setInvitationCode(e.currentTarget.value.toUpperCase())}
        required
        maxLength={20}
      />

      <Stack gap="sm">
        <Button
          onClick={handleJoin}
          loading={joining}
          disabled={!invitationCode.trim()}
          fullWidth
          size="md"
        >
          参加する
        </Button>
        <Button
          onClick={() => navigate("/events")}
          variant="default"
          fullWidth
        >
          キャンセル
        </Button>
      </Stack>
    </Stack>
  );
}

export function JoinEventScreen() {
  return (
    <Container title="イベント参加">
      <ErrorBoundary
        fallback={(error, retry) => (
          <Alert color="red" title="エラー">
            <Stack gap="sm">
              <Text size="sm">{error.message}</Text>
              <Button variant="light" onClick={retry}>
                再試行
              </Button>
            </Stack>
          </Alert>
        )}
      >
        <Suspense
          fallback={<Text size="sm" c="dimmed">読み込み中...</Text>}
        >
          <JoinEventContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
