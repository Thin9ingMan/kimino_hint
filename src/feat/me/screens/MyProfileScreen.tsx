import { Alert, Button, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import { Suspense } from "react";

import { Container } from "@/shared/ui/Container";
import { ProfileCard, ProfileCardActions } from "@/shared/ui/ProfileCard";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import {
  isUiProfileEmpty,
  mapProfileDataToUiProfile,
} from "@/shared/profile/profileUi";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";

function MyProfileContent() {
  const data = useSuspenseQuery(["profiles", "myProfile"], () =>
    apis.profiles.getMyProfile()
  );
  const profile = mapProfileDataToUiProfile(data?.profileData as any);

  // "空"のプロフィールは UX 上は未作成扱いに寄せる
  if (isUiProfileEmpty(profile)) {
    return (
      <Stack gap="md">
        <Alert color="blue" title="プロフィールが未作成です">
          <Text size="sm">
            クイズやプロフィール共有をする前に、まずプロフィールを作成してください。
          </Text>
        </Alert>
        <Button component={Link} to="/me/profile/edit" fullWidth size="md">
          プロフィールを作成する
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <ProfileCard
        profile={profile}
        actions={
          <ProfileCardActions
            onEdit={() => (window.location.href = "/me/profile/edit")}
            editLabel="編集する"
          />
        }
      />
    </Stack>
  );
}

export function MyProfileScreen() {
  return (
    <Container title="自分のプロフィール">
      <ErrorBoundary
        fallback={(error, retry) => {
          const is404 =
            error instanceof ResponseError && error.response.status === 404;

          if (is404) {
            return (
              <Alert color="blue" title="プロフィールを作りましょう">
                <Stack gap="sm">
                  <Text size="sm">
                    あなたのプロフィールはまだ作成されていません。まずはプロフィールを作成しましょう。
                  </Text>
                  <Button
                    component={Link}
                    to="/me/profile/edit"
                    variant="light"
                  >
                    プロフィールを作成する
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
          <MyProfileContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
