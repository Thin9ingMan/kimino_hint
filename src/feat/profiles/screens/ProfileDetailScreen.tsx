import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import { mapProfileDataToUiProfile } from "@/shared/profile/profileUi";

type Status = "loading" | "ready" | "not_found" | "error";

type ExchangeStatus = "idle" | "saving" | "done" | "error";

export function ProfileDetailScreen() {
  const params = useParams();
  const userId = useMemo(() => {
    const raw = params.userId ?? "";
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params.userId]);

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(
    null
  );

  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatus>("idle");
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setStatus("error");
      setError("userId が不正です");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const res = await apis.profiles.getUserProfile({ userId });
      setProfileData((res?.profileData ?? null) as any);
      setStatus("ready");
    } catch (e: any) {
      const s = e?.status ?? e?.response?.status;

      if (s === 404) {
        setProfileData(null);
        setStatus("not_found");
        return;
      }

      setError(String(e?.message ?? "プロフィールの取得に失敗しました"));
      setStatus("error");
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const ui = useMemo(() => mapProfileDataToUiProfile(profileData as any), [profileData]);

  const shareBack = useCallback(async () => {
    if (!userId) return;

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
  }, [userId]);

  return (
    <Container title="プロフィール詳細">
      {status === "loading" && (
        <Center py="xl">
          <Group gap="sm">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              読み込み中...
            </Text>
          </Group>
        </Center>
      )}

      {status === "error" && (
        <Alert color="red" title="取得エラー">
          <Stack gap="sm">
            <Text size="sm">{error}</Text>
            <Button variant="light" onClick={load}>
              再試行
            </Button>
          </Stack>
        </Alert>
      )}

      {status === "not_found" && (
        <Alert color="blue" title="プロフィールが見つかりませんでした">
          <Text size="sm">URL が間違っている可能性があります。</Text>
          <Button component={Link} to="/profiles" mt="sm" variant="light">
            一覧へ戻る
          </Button>
        </Alert>
      )}

      {status === "ready" && (
        <Stack gap="md">
          <Title order={3}>{ui.displayName || `User #${userId}`}</Title>

          <Stack gap={6}>
            <Group justify="space-between" wrap="nowrap">
              <Text c="dimmed" size="sm">
                学部
              </Text>
              <Text fw={600} size="sm" style={{ textAlign: "right" }}>
                {ui.faculty || "-"}
              </Text>
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Text c="dimmed" size="sm">
                学年
              </Text>
              <Text fw={600} size="sm" style={{ textAlign: "right" }}>
                {ui.grade || "-"}
              </Text>
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Text c="dimmed" size="sm">
                趣味
              </Text>
              <Text fw={600} size="sm" style={{ textAlign: "right" }}>
                {ui.hobby || "-"}
              </Text>
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Text c="dimmed" size="sm">
                好きなアーティスト
              </Text>
              <Text fw={600} size="sm" style={{ textAlign: "right" }}>
                {ui.favoriteArtist || "-"}
              </Text>
            </Group>
          </Stack>

          {exchangeMessage && (
            <Alert
              color={exchangeStatus === "error" ? "red" : "blue"}
              title={exchangeStatus === "error" ? "交換エラー" : "プロフィール交換"}
            >
              <Text size="sm">{exchangeMessage}</Text>
            </Alert>
          )}

          <Button
            onClick={shareBack}
            loading={exchangeStatus === "saving"}
            disabled={exchangeStatus === "saving"}
            fullWidth
          >
            自分のプロフィールを相手に渡す
          </Button>

          <Button component={Link} to="/profiles" variant="default" fullWidth>
            一覧へ戻る
          </Button>
        </Stack>
      )}
    </Container>
  );
}
