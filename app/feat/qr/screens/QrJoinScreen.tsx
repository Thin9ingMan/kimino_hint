import {
  Alert,
  Button,
  Stack,
  Text,
} from "@mantine/core";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useQueryParam } from "@/shared/hooks/useQueryParam";
import { apis } from "@/shared/api";

function QrJoinContent() {
  const navigate = useNavigate();
  const code = useQueryParam("code");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!code) {
      setError("招待コードが指定されていません");
      return;
    }

    // Auto-join on load
    const joinEvent = async () => {
      setJoining(true);
      try {
        const result = await apis.events.joinEventByCode({
          eventJoinByCodeRequest: {
            invitationCode: code,
          },
        });

        // Navigate to event lobby on success
        navigate(`/events/${result.eventId}`, { replace: true });
      } catch (err: any) {
        console.error("Failed to join event:", err);

        // Handle different error cases
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

    joinEvent();
  }, [code, navigate]);

  if (joining) {
    return (
      <Stack gap="md">
        <Alert color="blue" title="参加処理中">
          <Text size="sm">イベントに参加しています...</Text>
        </Alert>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack gap="md">
        <Alert color="red" title="エラー">
          <Text size="sm">{error}</Text>
        </Alert>
        <Button onClick={() => window.location.reload()} fullWidth>
          再試行
        </Button>
        <Button onClick={() => navigate("/events")} variant="default" fullWidth>
          イベント一覧へ
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Alert color="blue" title="処理中">
        <Text size="sm">イベントに参加しています...</Text>
      </Alert>
    </Stack>
  );
}

export function QrJoinScreen() {
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
          <QrJoinContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
