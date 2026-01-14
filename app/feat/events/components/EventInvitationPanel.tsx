import {
  ActionIcon,
  Alert,
  Box,
  Button,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
  Center
} from "@mantine/core";
import { Copy, Check } from "tabler-icons-react";
import QRCode from "react-qr-code";

type Props = {
  invitationCode?: string;
};

export function EventInvitationPanel({ invitationCode }: Props) {
  if (!invitationCode) {
    return null;
  }

  // URL for joining directly (if deep linking is supported) or just the event page
  const joinUrl = `${window.location.origin}/events/join?code=${invitationCode}`;

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <Title order={4}>招待</Title>

        <Alert color="blue" variant="light">
          <Group justify="space-between" align="center">
            <Stack gap={0}>
              <Text c="dimmed" size="xs">
                招待コード
              </Text>
              <Text size="xl" fw={700} style={{ fontFamily: "monospace" }}>
                {invitationCode}
              </Text>
            </Stack>

            <CopyButton value={invitationCode} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? "コピーしました" : "招待コードをコピー"} withArrow>
                  <ActionIcon color={copied ? "teal" : "blue"} variant="subtle" onClick={copy} size="lg" aria-label="招待コードをコピー">
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Alert>
        
        <Center>
            <Stack gap="xs" align="center">
                <Box p="xs" bg="white" style={{ borderRadius: '8px' }}>
                    <QRCode value={joinUrl} size={160} />
                </Box>
                <Text size="xs" c="dimmed">参加用QRコード</Text>
            </Stack>
        </Center>

      </Stack>
    </Paper>
  );
}
