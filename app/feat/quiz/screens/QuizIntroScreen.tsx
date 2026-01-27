import {
  Alert,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Title,
} from "@mantine/core";
import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { apis, fetchCurrentUser, AppError } from "@/shared/api";

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function loader({ params }: { params: { eventId?: string } }) {
  const eventId = Number(params.eventId);
  if (Number.isNaN(eventId)) {
    throw new AppError("eventId が不正です", { recoveryUrl: "/events" }); // Changed
  }

  try { // Added try block
    const me = await fetchCurrentUser();

    let eventUserData: any = null; // We'll type this properly in the component via useLoaderData
    try {
      eventUserData = await apis.events.getEventUserData({
        eventId,
        userId: me.id,
      });
    } catch {
      eventUserData = null;
    }

    return { eventId, me, eventUserData };
  } catch (error) { // Added catch block
    throw new AppError("クイズ情報の読み込みに失敗しました", {
      cause: error,
      recoveryUrl: `/events/${eventId}`,
    });
  }
}

function QuizIntroContent() {
  const { eventId, eventUserData } = useLoaderData<typeof loader>();

  const hasFakeAnswers =
    isRecord(eventUserData?.userData) &&
    isRecord(eventUserData.userData.fakeAnswers) &&
    Object.keys(eventUserData.userData.fakeAnswers).length > 0;

  return (
    <Stack gap="md">
      <Alert color="blue" title="クイズについて">
        <Text size="sm">
          クイズはイベント参加者同士がお互いのプロフィールに基づいた問題を出し合う形式です。
          まず、あなたのクイズを編集してから、他の参加者のクイズに挑戦しましょう。
        </Text>
      </Alert>

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Title order={5}>あなたのクイズ</Title>
          <Text size="sm" c="dimmed">
            {hasFakeAnswers
              ? "クイズの間違いの選択肢が設定されています"
              : "まだクイズの間違いの選択肢が設定されていません"}
          </Text>
          <Button
            component={Link}
            to={`/events/${eventId}/quiz/edit`}
            fullWidth
          >
            {hasFakeAnswers ? "クイズを編集" : "クイズを作成"}
          </Button>
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Title order={5}>他の参加者のクイズに挑戦</Title>
          <Text size="sm" c="dimmed">
            イベント参加者のクイズに挑戦して、相手のことを知りましょう
          </Text>
          <Button
            component={Link}
            to={`/events/${eventId}/quiz/challenges`}
            fullWidth
            variant="light"
          >
            クイズ一覧を見る
          </Button>
        </Stack>
      </Paper>

      <Button
        component={Link}
        to={`/events/${eventId}`}
        variant="default"
        fullWidth
      >
        ロビーへ戻る
      </Button>
    </Stack>
  );
}

export function QuizIntroScreen() {
  return (
    <Container title="クイズ">
      <Suspense
        fallback={
          <Text size="sm" c="dimmed">
            読み込み中...
          </Text>
        }
      >
        <QuizIntroContent />
      </Suspense>
    </Container>
  );
}

QuizIntroScreen.loader = loader;
