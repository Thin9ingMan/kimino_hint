import { Alert, Button, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { useQueryParam } from "@/shared/hooks/useQueryParam";

export function AuthErrorScreen() {
  const message = useQueryParam("message", "認証に失敗しました。");

  return (
    <Container title="認証エラー">
      <Stack gap="md">
        <Alert color="red" title="セッションの確認に失敗しました">
          <Text size="sm">{message}</Text>
        </Alert>

        <Text size="sm" c="dimmed">
          一度ホームに戻って、再度お試しください。
        </Text>

        <Button component={Link} to="/home" fullWidth>
          ホームへ
        </Button>

        <Button component={Link} to="/legacy" variant="light" fullWidth>
          レガシー入口（移行中）
        </Button>
      </Stack>
    </Container>
  );
}
