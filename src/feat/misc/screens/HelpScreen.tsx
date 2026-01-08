import { Alert, Anchor, List, Stack, Text, Title } from "@mantine/core";

import { Container } from "@/shared/ui/Container";

export function HelpScreen() {
  return (
    <Container title="使い方">
      <Stack gap="md">
        <Alert color="blue" title="このアプリでできること">
          <Text size="sm">
            プロフィールを作って、イベント（クイズ）に参加し、プロフィール交換をします。
          </Text>
        </Alert>

        <Title order={3}>基本の流れ</Title>
        <List spacing="xs">
          <List.Item>まず「自分のプロフィール」を作成</List.Item>
          <List.Item>イベントに参加（招待コード入力）</List.Item>
          <List.Item>クイズに回答</List.Item>
          <List.Item>QR を読み取ってプロフィール交換</List.Item>
        </List>

        <Title order={3}>リンク</Title>
        <List spacing="xs">
          <List.Item>
            ルーティング設計: <Anchor href="/docs/newspec/routes.md">routes.md</Anchor>
          </List.Item>
          <List.Item>
            Compat 方針: <Anchor href="/docs/newspec/compat.md">compat.md</Anchor>
          </List.Item>
        </List>

        <Text size="sm" c="dimmed">
          ※ 上の docs リンクは開発環境でのみ意味があります。
        </Text>
      </Stack>
    </Container>
  );
}
