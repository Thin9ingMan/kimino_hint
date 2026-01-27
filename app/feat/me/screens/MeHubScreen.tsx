import { Button, Stack, Text } from "@mantine/core";
import { Link, useLoaderData } from "react-router-dom";
import { fetchCurrentUser } from "@/shared/api";
import { Container } from "@/shared/ui/Container";

export async function loader() {
  const me = await fetchCurrentUser();
  return { me };
}

export function MeHubScreen() {
  const { me } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return (
    <Container title="マイページ">
      <Stack gap="sm">
        <Text c="dimmed" size="sm" ta="center">
          こんにちは、{me.id}
          さん。自分の情報やイベント関連へのショートカットです。
        </Text>

        <Button component={Link} to="/me/profile" fullWidth size="md">
          自分のプロフィール
        </Button>

        <Button
          component={Link}
          to="/me/profile/edit"
          variant="light"
          fullWidth
          size="md"
        >
          プロフィールを編集
        </Button>

        <Button component={Link} to="/profiles" variant="subtle" fullWidth>
          受け取ったプロフィール一覧
        </Button>
      </Stack>
    </Container>
  );
}

MeHubScreen.loader = loader;
