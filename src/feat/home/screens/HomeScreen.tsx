import { Alert, Button, Group, Loader, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";

type Status = "loading" | "ready" | "error";

/**
 * Home screen (legacy Index.jsx equivalent).
 * - If profile exists: enable "クイズへ".
 * - If not: disable and ask user to create profile first.
 */
export function HomeScreen() {
  const [status, setStatus] = useState<Status>("loading");
  const [canStartQuiz, setCanStartQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("loading");
      setError(null);

      try {
        await apis.profiles.getMyProfile();
        if (cancelled) return;
        setCanStartQuiz(true);
        setStatus("ready");
      } catch (e: any) {
        if (cancelled) return;

        const s = e?.status ?? e?.response?.status;
        if (s === 404) {
          setCanStartQuiz(false);
          setStatus("ready");
          return;
        }

        setError(String(e?.message ?? "プロフィール確認に失敗しました"));
        setStatus("error");
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Container title="キミのヒント">
      <Stack gap="md">
        {status === "loading" && (
          <Group justify="center" gap="sm">
            <Loader size="sm" />
            <Text>読み込み中...</Text>
          </Group>
        )}

        {status === "error" && (
          <Alert color="red" title="データ取得エラー">
            {error}
          </Alert>
        )}

        {status !== "loading" && (
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
              自分のプロフィール
            </Button>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
