import { Alert, Button, Group, Stack, Text, Container } from "@mantine/core";
import { Link, useRouteError, useNavigate } from "react-router-dom";
import { AppError } from "@/shared/api/errors";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function BaseErrorPage({
  title,
  error,
  recoveryUrl,
  recoveryLabel,
}: {
  title: string;
  error: unknown;
  recoveryUrl?: string;
  recoveryLabel?: string;
}) {
  const navigate = useNavigate();
  const message = getErrorMessage(error);

  return (
    <Container title={title}>
      <Alert color="red" title="エラーが発生しました">
        <Stack>
          <Text size="sm">{message}</Text>
          <Group>
            <Button onClick={() => navigate(0)} variant="light">
              再試行
            </Button>
            {recoveryUrl && (
              <Button component={Link} to={recoveryUrl} variant="default">
                {recoveryLabel}
              </Button>
            )}
          </Group>
        </Stack>
      </Alert>
    </Container>
  );
}

export function GeneralErrorPage() {
  const error = useRouteError();
  const recoveryUrl = error instanceof AppError ? error.recoveryUrl : "/";
  return (
    <BaseErrorPage
      title="エラー"
      error={error}
      recoveryUrl={recoveryUrl}
      recoveryLabel="ホームに戻る"
    />
  );
}

export function EventsErrorPage() {
  const error = useRouteError();
  const recoveryUrl = error instanceof AppError ? error.recoveryUrl : "/events";
  return (
    <BaseErrorPage
      title="イベントエラー"
      error={error}
      recoveryUrl={recoveryUrl}
      recoveryLabel="イベント一覧に戻る"
    />
  );
}

export function ProfileErrorPage() {
  const error = useRouteError();
  const recoveryUrl = error instanceof AppError ? error.recoveryUrl : "/me";
  return (
    <BaseErrorPage
      title="プロフィールエラー"
      error={error}
      recoveryUrl={recoveryUrl}
      recoveryLabel="マイページに戻る"
    />
  );
}
