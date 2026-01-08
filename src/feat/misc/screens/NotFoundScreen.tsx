import { Alert, Button, Stack, Text } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";

import { Container } from "@/shared/ui/Container";

export function NotFoundScreen() {
  const location = useLocation();

  return (
    <Container title="404 Not Found">
      <Stack gap="md">
        <Alert color="blue" title="ページが見つかりませんでした">
          <Text size="sm" style={{ wordBreak: "break-all" }}>
            {location.pathname}
          </Text>
        </Alert>

        <Button component={Link} to="/home" fullWidth>
          ホームへ
        </Button>

        <Button component={Link} to="/help" variant="light" fullWidth>
          使い方
        </Button>
      </Stack>
    </Container>
  );
}
