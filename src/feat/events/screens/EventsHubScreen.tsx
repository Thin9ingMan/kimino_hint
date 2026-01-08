import { Alert, Button, Stack, Text, TextInput } from "@mantine/core";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";

export function EventsHubScreen() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const trimmed = useMemo(() => code.trim(), [code]);

  return (
    <Container title="イベント">
      <Stack gap="md">
        <Alert color="blue" title="イベントって？">
          <Text size="sm">
            イベント = クイズセッション（ルーム）です。参加者が集まってクイズを進めます。
          </Text>
        </Alert>

        <Button component={Link} to="/events/new" fullWidth size="md">
          イベントを作成
        </Button>

        <Button component={Link} to="/events/join" variant="light" fullWidth size="md">
          イベントに参加（招待コード）
        </Button>

        <TextInput
          label="招待コード（ショートカット）"
          placeholder="例: QUIZ-2025-01"
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
        />
        <Button
          onClick={() => {
            if (!trimmed) return;
            // join screen will be the source of truth; keep UX simple.
            navigate("/events/join", { state: { invitationCode: trimmed } });
          }}
          disabled={!trimmed}
          fullWidth
        >
          このコードで参加する
        </Button>

        <Button component={Link} to="/home" variant="default" fullWidth>
          ホームへ
        </Button>
      </Stack>
    </Container>
  );
}
