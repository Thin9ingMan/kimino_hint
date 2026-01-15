import { Center, Loader, Stack, Text } from "@mantine/core";

export function Loading({ message = "読み込み中..." }: { message?: string }) {
  return (
    <Center style={{ height: "100%", minHeight: 400 }}>
      <Stack align="center" gap="md">
        <Loader size="lg" type="dots" color="var(--mantine-primary-color-filled)" />
        <Text size="sm" c="dimmed">{message}</Text>
      </Stack>
    </Center>
  );
}
