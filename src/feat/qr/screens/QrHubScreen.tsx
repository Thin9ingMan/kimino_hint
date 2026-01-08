import {
  Alert,
  Button,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";

function normalizeBaseUrlPath(): string {
  const basePath = String(import.meta.env.BASE_URL || "/");
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

export function QrHubScreen() {
  const [userIdText, setUserIdText] = useState("");

  const base = useMemo(() => normalizeBaseUrlPath(), []);

  const shareUrl = useMemo(() => {
    const raw = userIdText.trim();
    if (!raw) return "";
    const n = Number(raw);
    if (!Number.isFinite(n)) return "";
    return `${window.location.origin}${base}profiles/${n}`;
  }, [base, userIdText]);

  const imageUrl = useMemo(() => {
    if (!shareUrl) return "";
    const data = encodeURIComponent(shareUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data}`;
  }, [shareUrl]);

  return (
    <Container title="QRコード">
      <Stack gap="md">
        <Alert color="blue" title="何をする画面？">
          <Text size="sm">
            相手のプロフィールURLを開く / 共有するための導線です。
          </Text>
        </Alert>

        <Button component={Link} to="/qr/scan" fullWidth size="md">
          QRを読み取る
        </Button>

        <Button component={Link} to="/qr/profile" variant="light" fullWidth size="md">
          自分のQRを表示（legacy）
        </Button>

        <Title order={4}>共有リンクを作る（簡易）</Title>
        <TextInput
          label="userId"
          placeholder="例: 42"
          value={userIdText}
          onChange={(e) => setUserIdText(e.currentTarget.value)}
        />

        {shareUrl ? (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              共有URL:
            </Text>
            <Text size="sm" style={{ wordBreak: "break-all" }}>
              {shareUrl}
            </Text>
            <img src={imageUrl} alt="profile qr" width={220} height={220} />
            <Button component={Link} to={`/profiles/${Number(userIdText)}`} variant="default">
              プロフィール詳細を開く
            </Button>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            userId を入力すると QR と共有URLが表示されます。
          </Text>
        )}
      </Stack>
    </Container>
  );
}
