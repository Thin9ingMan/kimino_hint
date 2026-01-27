import { Alert, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { Suspense, useState, useEffect } from "react";
import { Link, useNavigate, useLoaderData } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { apis, fetchCurrentUser, AppError } from "@/shared/api"; // AppError added
import { useQueryParam } from "@/shared/hooks/useQueryParam";

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

function JoinEventContent() {
  const navigate = useNavigate();
  useLoaderData(); // Ensure loader is used
  const codeFromUrl = useQueryParam("code");
  const [invitationCode, setInvitationCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-populate invitation code from URL parameter
  useEffect(() => {
    if (codeFromUrl) {
      setInvitationCode(codeFromUrl.toUpperCase());
    }
  }, [codeFromUrl]);

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

      // Navigate to event lobby
      navigate(`/events/${result.eventId}`);
    } catch (err: unknown) {
      console.error("Failed to join event:", err);
      // We can use a type guard or check properties on unknown
      const status =
        (err &&
          typeof err === "object" &&
          "response" in err &&
          (err.response as any)?.status) ||
        500;

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
        <Button onClick={() => navigate("/events")} variant="default" fullWidth>
          キャンセル
        </Button>
      </Stack>
    </Stack>
  );
}

export function JoinEventScreen() {
  return (
    <Container title="イベント参加">
      <Suspense
        fallback={
          <Text size="sm" c="dimmed">
            読み込み中...
          </Text>
        }
      >
        <JoinEventContent />
      </Suspense>
    </Container>
  );
}

JoinEventScreen.loader = loader;
