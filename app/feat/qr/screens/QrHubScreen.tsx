import { Button, Stack, Title } from "@mantine/core";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { InfoAlert } from "@/shared/ui/InfoAlert";
import { QrGenerator } from "@/feat/qr/components/QrGenerator";

export function QrHubScreen() {
  return (
    <Container title="QRコード">
      <Stack gap="md">
        <InfoAlert title="何をする画面？">
          相手のプロフィールURLを開く / 共有するための導線です。
        </InfoAlert>

        <Button component={Link} to="/qr/scan" fullWidth size="md">
          QRを読み取る
        </Button>

        <Button component={Link} to="/qr/profile" variant="light" fullWidth size="md">
          自分のQRを表示（legacy）
        </Button>

        <Title order={4}>共有リンクを作る（簡易）</Title>
        
        <QrGenerator
          pathTemplate="/profiles/{userId}"
          placeholder="例: 42"
          label="userId"
          showUrlInput
          showDirectLink
        />
      </Stack>
    </Container>
  );
}
