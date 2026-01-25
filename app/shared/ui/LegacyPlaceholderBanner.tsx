import React from "react";
import { Alert, Stack, Text } from "@mantine/core";

/**
 * Banner shown on New Spec screens that are the redirect destination for legacy URLs.
 *
 * Purpose: keep the intent explicit during migration.
 * Remove this banner after the legacy component is embedded/handled.
 */
export function LegacyPlaceholderBanner(props: { legacyPath: string }) {
  return (
    <Alert color="yellow" title="Legacy migration notice" mb="md">
      <Stack gap={4}>
        <Text size="sm">
          今後レガシーコンポーネントがここに挿入されます（legacy path:{" "}
          {props.legacyPath}）。
        </Text>
        <Text size="xs" c="dimmed">
          ※レガシーコンポーネント配置後はこのバナーを削除してください
        </Text>
      </Stack>
    </Alert>
  );
}
