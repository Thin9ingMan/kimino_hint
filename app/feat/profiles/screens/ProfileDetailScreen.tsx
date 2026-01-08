import { Alert, Button, Stack, Text } from "@mantine/core";
import { Suspense, useState } from "react";
import { Link } from "react-router-dom";

import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import { ProfileCard } from "@/shared/ui/ProfileCard";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { mapProfileDataToUiProfile } from "@/shared/profile/profileUi";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";

type ExchangeStatus = "idle" | "saving" | "done" | "error";

function ProfileDetailContent() {
  const userId = useNumericParam("userId");
  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatus>("idle");
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);

  if (!userId) {
    throw new Error("userId が不正です");
  }

  const profileData = useSuspenseQuery(["profiles", "user", userId], () =>
    apis.profiles.getUserProfile({ userId })
  );

  const profile = mapProfileDataToUiProfile(profileData?.profileData as any);

  const shareBack = async () => {
    setExchangeStatus("saving");
    setExchangeMessage(null);

    try {
      await apis.friendships.receiveFriendship({
        userId,
        receiveFriendshipRequest: {
          meta: { source: "profiles_detail", at: new Date().toISOString() },
        },
      });
      setExchangeStatus("done");
      setExchangeMessage("プロフィールを交換しました");
    } catch (e: any) {
      const s = e?.status ?? e?.response?.status;
      if (s === 409) {
        setExchangeStatus("done");
        setExchangeMessage("すでに交換済みです");
        return;
      }
      if (s === 404) {
        setExchangeStatus("error");
        setExchangeMessage("ユーザーが見つかりませんでした");
        return;
      }

      setExchangeStatus("error");
      setExchangeMessage(String(e?.message ?? "交換に失敗しました"));
    }
  };

  return (
    <Stack gap="md">
      {exchangeMessage && (
        <Alert
          color={exchangeStatus === "error" ? "red" : "green"}
          title={exchangeStatus === "error" ? "交換エラー" : "成功"}
        >
          <Text size="sm">{exchangeMessage}</Text>
        </Alert>
      )}

      <ProfileCard
        profile={profile}
        title={profile.displayName || `ユーザー ${userId}`}
        subtitle={`userId: ${userId}`}
      />

      <Stack gap="sm">
        <Button
          onClick={shareBack}
          fullWidth
          loading={exchangeStatus === "saving"}
          disabled={exchangeStatus === "done"}
        >
          {exchangeStatus === "done" ? "交換済み" : "プロフィールを交換する"}
        </Button>

        <Button component={Link} to="/profiles" variant="default" fullWidth>
          プロフィール一覧へ
        </Button>
      </Stack>
    </Stack>
  );
}

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
