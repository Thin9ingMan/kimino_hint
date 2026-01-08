import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import {
  isUiProfileEmpty,
  mapProfileDataToUiProfile,
} from "@/shared/profile/profileUi";

type Status = "loading" | "ready" | "missing" | "error";

export function MyProfileScreen() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<
    ReturnType<typeof mapProfileDataToUiProfile> | null
  >(null);

  const fetchProfile = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const res = await apis.profiles.getMyProfile();
      const ui = mapProfileDataToUiProfile(res?.profileData as any);
      setProfile(ui);

      // “空”のプロフィールは UX 上は未作成扱いに寄せる
      setStatus(isUiProfileEmpty(ui) ? "missing" : "ready");
    } catch (e: any) {
      const s = e?.status ?? e?.response?.status;

      // 404 = 未作成（エラーではなく空状態）
      if (s === 404) {
        setProfile(null);
        setStatus("missing");
        return;
      }

      setError(String(e?.message ?? "プロフィール取得に失敗しました"));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const rows = useMemo(() => {
    if (!profile) return [];
    return [
      { label: "名前", value: profile.displayName },
      { label: "フリガナ", value: profile.furigana },
      { label: "学部", value: profile.faculty },
      { label: "学年", value: profile.grade },
      { label: "趣味", value: profile.hobby },
      { label: "好きなアーティスト", value: profile.favoriteArtist },
    ].filter((r) => r.value);
  }, [profile]);

  return (
    <Container title="自分のプロフィール">
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
        <Alert color="red" title="プロフィール取得エラー">
          <Stack gap="sm">
            <Text size="sm">{error}</Text>
            <Button variant="light" onClick={fetchProfile}>
              再試行
            </Button>
          </Stack>
        </Alert>
      )}

      {status === "missing" && (
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
      )}

      {status === "ready" && (
        <Stack gap="md">
          <Box>
            <Stack gap="xs">
              {rows.length ? (
                rows.map((r) => (
                  <Group key={r.label} justify="space-between" wrap="nowrap">
                    <Text c="dimmed" size="sm">
                      {r.label}
                    </Text>
                    <Text fw={600} size="sm" style={{ textAlign: "right" }}>
                      {r.value}
                    </Text>
                  </Group>
                ))
              ) : (
                <Text size="sm" c="dimmed" ta="center">
                  表示できる項目がありません。
                </Text>
              )}
            </Stack>
          </Box>

          <Button component={Link} to="/me/profile/edit" fullWidth>
            編集する
          </Button>
        </Stack>
      )}
    </Container>
  );
}
