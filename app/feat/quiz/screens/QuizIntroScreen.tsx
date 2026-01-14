import {
  Alert,
  Button,
  Stack,
  Text,
  Paper,
  Title,
} from "@mantine/core";
import { Suspense } from "react";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";

function QuizIntroContent() {
  const eventId = useNumericParam("eventId");

  if (!eventId) {
    throw new Error("eventId が不正です");
  }

  const meData = useSuspenseQuery(["quiz", "intro", "me"], async () => {
    const me = await apis.auth.getCurrentUser();
    return me;
  });

  const myProfile = useSuspenseQuery(["quiz", "intro", "profile"], async () => {
    const profile = await apis.profiles.getMyProfile();
    return profile;
  });

  const eventUserData = useSuspenseQuery(
    ["quiz", "intro", "userdata", eventId, meData.id],
    async () => {
      try {
        const userData = await apis.events.getEventUserData({
          eventId,
          userId: meData.id,
        });
        return userData;
      } catch {
        return null;
      }
    }
  );

  const hasFakeAnswers = eventUserData?.userData?.fakeAnswers;

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

      <Button component={Link} to={`/events/${eventId}`} variant="default" fullWidth>
        ロビーへ戻る
      </Button>
    </Stack>
  );
}

export function QuizIntroScreen() {
  return (
    <Container title="クイズ">
      <ErrorBoundary
        fallback={(error, retry) => (
          <Alert color="red" title="読み込みエラー">
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
          <QuizIntroContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
