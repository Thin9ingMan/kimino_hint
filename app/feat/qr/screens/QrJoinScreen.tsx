import {
  Alert,
  Button,
  Stack,
  Text,
  Center,
  Loader,
  Group,
} from "@mantine/core";
import { Suspense } from "react";
import { useNavigate, useLoaderData } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { apis } from "@/shared/api";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";
import { redirect } from "react-router-dom";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return { error: "招待コードが指定されていません" };
  }

  try {
    const result = await apis.events.joinEventByCode({
      eventJoinByCodeRequest: {
        invitationCode: code,
      },
    });

    // Navigate to event lobby on success
    return redirect(`/events/${result.eventId}`);
  } catch (err: unknown) {
    console.error("Failed to join event:", err);

    let errorMsg = "イベントへの参加に失敗しました";
    if (err instanceof ResponseError) {
      const status = err.response.status;
      if (status === 400 || status === 404) {
        errorMsg = "招待コードが無効または期限切れです";
      } else if (status === 401) {
        errorMsg = "認証エラーが発生しました。再試行してください。";
      } else if (status === 409) {
        // Already joined - redirect to lobby
        // We need to find the event ID. But the error might not have it.
        // Actually, 409 usually means we can't join again, but we might not know which event.
        // In this app, the invitation code is usually specific enough.
        // If we can't get eventId from 409, we might have to show an error or
        // fetch the event by code first.
        // For now, let's just show an error message that they already joined.
        errorMsg = "すでにこのイベントに参加しています";
      }
    }
    return { error: errorMsg };
  }
}

function QrJoinContent() {
  const navigate = useNavigate();
  const data = useLoaderData<typeof loader>();

  // If we reach here, it means we didn't redirect (so there's an error)
  const error = (data as { error?: string }).error;

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

  // This part might be shown briefly before redirect if any (though redirect is usually immediate)
  return (
    <Stack gap="md">
      <Alert color="blue" title="処理中">
        <Center>
          <Group gap="sm">
            <Loader size="sm" />
            <Text size="sm">イベントに参加しています...</Text>
          </Group>
        </Center>
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
          fallback={
            <Center py="xl">
              <Stack align="center" gap="sm">
                <Loader size="lg" />
                <Text size="sm" c="dimmed">
                  読み込み中...
                </Text>
              </Stack>
            </Center>
          }
        >
          <QrJoinContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}

QrJoinScreen.loader = loader;
