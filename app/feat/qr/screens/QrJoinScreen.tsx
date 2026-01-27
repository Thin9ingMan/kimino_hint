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
import { useLoaderData, redirect } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { apis, AppError } from "@/shared/api";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const recoveryUrl = "/events";

  if (!code) {
    throw new AppError("招待コードが指定されていません", { recoveryUrl });
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
        errorMsg = "すでにこのイベントに参加しています";
      }
    }
    throw new AppError(errorMsg, { cause: err, recoveryUrl });
  }
}

function QrJoinContent() {
  // If we reach here, it means we didn't redirect.
  // This screen is mostly for the loader action.
  // The content is a loading indicator until the redirect happens.
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
    </Container>
  );
}

QrJoinScreen.loader = loader;

