import { Alert, Button, Stack, Text } from "@mantine/core";
import { Suspense } from "react";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";
import { ProfileDetailContent } from "../components/ProfileDetailContent";

export function ProfileDetailScreen() {
  return (
    <Container title="プロフィール詳細">
      <ErrorBoundary
        fallback={(error, retry) => {
          const is404 =
            error instanceof ResponseError && error.response.status === 404;

          if (is404) {
            return (
              <Alert color="blue" title="プロフィールが見つかりません">
                <Stack gap="sm">
                  <Text size="sm">
                    このユーザーはプロフィールを作成していないようです。作ってもらいましょう。
                  </Text>
                  <Button component={Link} to="/profiles" variant="light">
                    プロフィール一覧へ戻る
                  </Button>
                </Stack>
              </Alert>
            );
          }

          return (
            <Alert color="red" title="プロフィールの取得に失敗しました">
              <Stack gap="sm">
                <Text size="sm">{error.message}</Text>
                <Button variant="light" onClick={retry}>
                  再試行
                </Button>
              </Stack>
            </Alert>
          );
        }}
      >
        <Suspense
          fallback={
            <Text size="sm" c="dimmed">
              読み込み中...
            </Text>
          }
        >
          <ProfileDetailContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
