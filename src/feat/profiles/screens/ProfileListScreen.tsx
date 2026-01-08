import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import { mapProfileDataToUiProfile } from "@/shared/profile/profileUi";

type Status = "loading" | "ready" | "error";

type Item = {
  id: number;
  senderUserId: number;
  createdAt?: Date;
  // API may include senderProfile, but it can be missing.
  senderProfileData?: Record<string, unknown> | null;
};

function pickDisplayName(profileData: Record<string, unknown> | null | undefined): string {
  const pd = profileData ?? {};
  const v = pd.displayName;
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

export function ProfileListScreen() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  // N+1 fill for missing sender profiles (undefined=not fetched, null=failed once, object=fetched)
  const [profilesByUserId, setProfilesByUserId] = useState<
    Record<number, Record<string, unknown> | null | undefined>
  >({});

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const res = await apis.friendships.listReceivedFriendships();

      const mapped: Item[] = (res ?? []).map((f: any) => ({
        id: f.id,
        senderUserId: f.senderUserId,
        createdAt: f.createdAt,
        senderProfileData: (f.senderProfile?.profileData ?? null) as any,
      }));

      setItems(mapped);
      setStatus("ready");
    } catch (e: any) {
      setError(String(e?.message ?? "一覧の取得に失敗しました"));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;

    async function fillMissing() {
      if (!items.length) return;

      const userIds = Array.from(
        new Set(items.map((i) => i.senderUserId).filter((v) => Number.isFinite(v)))
      ) as number[];

      const missing = userIds.filter((id) => profilesByUserId[id] === undefined);
      if (!missing.length) return;

      // mark as "in-flight" by setting null? -> better keep undefined until response.
      // We'll update per completion.

      for (const userId of missing) {
        try {
          const p = await apis.profiles.getUserProfile({ userId });
          if (cancelled) return;
          setProfilesByUserId((prev) => ({
            ...prev,
            [userId]: (p?.profileData ?? null) as any,
          }));
        } catch {
          if (cancelled) return;
          // avoid retry loop
          setProfilesByUserId((prev) => ({ ...prev, [userId]: null }));
        }
      }
    }

    void fillMissing();

    return () => {
      cancelled = true;
    };
  }, [items, profilesByUserId]);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const at = a.createdAt instanceof Date ? a.createdAt.getTime() : NaN;
      const bt = b.createdAt instanceof Date ? b.createdAt.getTime() : NaN;
      if (!Number.isNaN(at) && !Number.isNaN(bt)) return bt - at;
      return (b.id ?? 0) - (a.id ?? 0);
    });
    return copy;
  }, [items]);

  return (
    <Container title="受け取ったプロフィール一覧">
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

      {status === "ready" && (
        <Stack gap="md">
          {!sorted.length ? (
            <Alert color="blue" title="まだ受け取ったプロフィールがありません">
              <Text size="sm">
                QR を読み取ってプロフィール交換をすると、ここに表示されます。
              </Text>
              <Button component={Link} to="/qr" mt="sm">
                QRへ
              </Button>
            </Alert>
          ) : (
            sorted.map((it) => {
              const fromApi = it.senderProfileData;
              const fromNplusOne = profilesByUserId[it.senderUserId];
              const profileData = fromApi ?? fromNplusOne ?? null;

              const name = pickDisplayName(profileData);
              const ui = mapProfileDataToUiProfile(profileData as any);

              return (
                <Paper key={it.id} withBorder p="md" radius="md">
                  <Stack gap={6}>
                    <Group justify="space-between" align="flex-start">
                      <Title order={4}>{name || `User #${it.senderUserId}`}</Title>
                      <Button
                        component={Link}
                        to={`/profiles/${it.senderUserId}`}
                        variant="light"
                        size="xs"
                      >
                        詳細
                      </Button>
                    </Group>

                    <Text size="sm" c="dimmed">
                      {ui.faculty || ui.grade
                        ? `${ui.faculty}${ui.faculty && ui.grade ? " / " : ""}${ui.grade}`
                        : "プロフィール情報を読み込み中..."}
                    </Text>
                  </Stack>
                </Paper>
              );
            })
          )}

          <Button component={Link} to="/home" variant="default" fullWidth>
            ホームへ
          </Button>
        </Stack>
      )}
    </Container>
  );
}
