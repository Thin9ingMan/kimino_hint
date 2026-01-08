import { Button, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";

export function MeHubScreen() {
  return (
    <Container title="マイページ">
      <Stack gap="sm">
        <Text c="dimmed" size="sm" ta="center">
          自分の情報やイベント関連へのショートカットです。
        </Text>

        <Button component={Link} to="/me/profile" fullWidth size="md">
          自分のプロフィール
        </Button>

        <Button
          component={Link}
          to="/me/profile/edit"
          variant="light"
          fullWidth
          size="md"
        >
          プロフィールを編集
        </Button>

        <Button component={Link} to="/profiles" variant="subtle" fullWidth>
          受け取ったプロフィール一覧
        </Button>

        <Button component={Link} to="/events" variant="subtle" fullWidth>
          イベント
        </Button>

        <Button component={Link} to="/qr" variant="subtle" fullWidth>
          QRコード
        </Button>

        <Button component={Link} to="/help" variant="default" fullWidth>
          使い方
        </Button>
      </Stack>
    </Container>
  );
}
