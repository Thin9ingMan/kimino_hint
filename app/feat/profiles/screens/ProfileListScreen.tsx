import {
  Alert,
  Avatar,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";

import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";

type Item = {
  id: number;
  senderUserId: number;
  createdAt?: Date;
  senderProfileData?: Record<string, unknown> | null;
};

function pickDisplayName(
  profileData: Record<string, unknown> | null | undefined
): string {
  const pd = profileData ?? {};
  const v = pd.displayName;
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

function ProfileListContent() {
  const data = useSuspenseQuery(["friendships.listReceivedFriendships"], () =>
    apis.friendships.listReceivedFriendships()
  );

  const items: Item[] = (data ?? []).map((f: any) => ({
    id: f.id,
    senderUserId: f.senderUserId,
    createdAt: f.createdAt,
    senderProfileData: (f.senderProfile?.profileData ?? null) as any,
  }));

  if (items.length === 0) {
    return (
      <Alert color="blue" title="受け取ったプロフィールがありません">
        <Stack gap="sm">
          <Text size="sm">
            QRコードを読み取るとプロフィールが交換され、ここに表示されます。
          </Text>
          <Button component={Link} to="/me/profile" variant="light">
            QRコードへ
          </Button>
        </Stack>
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      {items.map((item) => {
        const profileData = item.senderProfileData;
        const displayName =
          pickDisplayName(profileData) || `ユーザー ${item.senderUserId}`;

        return (
          <Link
            key={item.id}
            to={`/profiles/${item.senderUserId}`}
            style={{ textDecoration: "none" }}
          >
            <Paper key={item.id} withBorder p="md" radius="md">
              <Stack gap="xs">
                <Group justify="left" wrap="nowrap">
                  <Avatar radius="xl" name={displayName} size={48} />
                  <Title
                    order={5}
                    style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {displayName}
                  </Title>
                  {item.createdAt && (
                    <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                      {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                    </Text>
                  )}
                </Group>
              </Stack>
            </Paper>
          </Link>
        );
      })}

      <Button component={Link} to="/me" variant="default" fullWidth>
        マイページへ
      </Button>
    </Stack>
  );
}

export function ProfileListScreen() {
  return (
    <Container title="受け取ったプロフィール">
      <ErrorBoundary
        fallback={(error, retry) => (
          <Alert color="red" title="一覧の取得に失敗しました">
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
            <Text size="sm" c="dimmed">
              読み込み中...
            </Text>
          }
        >
          <ProfileListContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
