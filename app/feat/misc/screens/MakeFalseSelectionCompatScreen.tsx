import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { Suspense } from "react";
import { Alert, Button, Stack, Text } from "@mantine/core";
import MakeFalseSelectionScreen from "./MakeFalseSelectionScreen";

/**
 * Compat route element for legacy `/make_false_selection`.
 *
 * This is intentionally a thin wrapper so legacy engineers keep editing
 * [`MakeFalseSelection`](src/components/MakeFalseSelection.jsx:1).
 */
export function MakeFalseSelectionCompatScreen() {
  return (
    <Container title="間違いの選択肢を作ろう">
      <ErrorBoundary
        fallback={(error, retry) => (
          <Alert color="red" title="読み込みエラー">
            <Stack gap="sm">
              <Text size="sm">{error.message}</Text>
              <Button variant="light" onClick={retry}>
                再試行
              </Button>
            </Stack>
          </Alert>
        )}
      >
        <Suspense
          fallback={
            <Text size="sm" c="dimmed">
              読み込み中...
            </Text>
          }
        >
          <MakeFalseSelectionScreen />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
