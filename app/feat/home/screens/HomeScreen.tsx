import { Alert, Button, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import { Suspense } from "react";

import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";

function HomeContent() {
  // プロフィールの存在確認
  let canStartQuiz = false;
  try {
    useSuspenseQuery(["profiles", "myProfile"], () => apis.profiles.getMyProfile());
    canStartQuiz = true;
  } catch (e: any) {
    // 404の場合はプロフィール未作成 -> canStartQuiz = false
    const status = e?.status ?? e?.response?.status;
    if (status === 404) {
      canStartQuiz = false;
    } else {
      // その他のエラーは再throw（ErrorBoundaryでキャッチ）
      throw e;
    }
  }

  return (
    <Stack gap="sm">
      <Button
        component={Link}
        to={canStartQuiz ? "/room" : "#"}
        disabled={!canStartQuiz}
        fullWidth
        size="md"
      >
        クイズへ
      </Button>

      {!canStartQuiz && (
        <Text c="dimmed" size="sm" ta="center">
          プロフィールを作成してからクイズに進んでください
        </Text>
      )}

      <Button
        component={Link}
        to="/profiles"
        variant="light"
        fullWidth
        size="md"
      >
        プロフィール一覧へ
      </Button>

      <Button
        component={Link}
        to="/me"
        variant="light"
        fullWidth
        size="md"
      >
        マイページへ
      </Button>

      <Button component={Link} to="/help" variant="default" fullWidth>
          使い方
      </Button>
    </Stack>
  );
}

export function HomeScreen() {
  return (
    <Container title="キミのヒント" isHome>
      <ErrorBoundary
        fallback={(error, retry) => (
          <Alert color="red" title="データ取得エラー">
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
          <HomeContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}