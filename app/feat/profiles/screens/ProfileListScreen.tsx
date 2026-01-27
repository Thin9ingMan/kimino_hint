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
import { Link, useLoaderData } from "react-router-dom";
import { Suspense } from "react";

import { apis, AppError } from "@/shared/api";
import { Container } from "@/shared/ui/Container";

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickDisplayName(
  profileData: Record<string, unknown> | null | undefined,
): string {
  const pd = profileData ?? {};
  const v = pd.displayName;
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

export async function loader() {
  try {
    const data = await apis.friendships.listReceivedFriendships();

    const items = data.map((f) => {
      const senderProfileData = isRecord(f.senderProfile?.profileData)
        ? f.senderProfile.profileData
        : null;

      return {
        id: f.id ?? 0,
        senderUserId: f.senderUserId ?? 0,
        createdAt: f.createdAt,
        senderProfileData,
      };
    });

    return { items };
  } catch (error) {
    throw new AppError("プロファイルリストの読み込みに失敗しました", {
      cause: error,
      recoveryUrl: "/me",
    });
  }
}

function ProfileListContent() {
  const { items } = useLoaderData<typeof loader>();

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
            <Paper withBorder p="md" radius="md">
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
      <Suspense
        fallback={
          <Text size="sm" c="dimmed">
            読み込み中...
          </Text>
        }
      >
        <ProfileListContent />
      </Suspense>
    </Container>
  );
}

ProfileListScreen.loader = loader;

