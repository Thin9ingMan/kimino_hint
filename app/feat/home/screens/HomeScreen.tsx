import {
  Alert,
  Button,
  Stack,
  Text,
  SimpleGrid,
  Paper,
  ThemeIcon,
  Group,
} from "@mantine/core";
import { useLoaderData, Link } from "react-router-dom";
import { Suspense } from "react";
import {
  IconBulb,
  IconUser,
  IconUsers,
  IconHelp,
  IconArrowRight,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";
import { apis, AppError } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import { Loading } from "@/shared/ui/Loading";

export async function loader() {
  try {
    const profile = await apis.profiles.getMyProfile();
    return { profile };
  } catch (err) {
    if (err instanceof ResponseError && err.response.status === 404) {
      return { profile: null };
    }
    // Convert other errors to a more user-friendly message
    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch profile";
    throw new AppError(
      `プロフィールの取得中にエラーが発生しました: ${errorMessage}`,
      { cause: err },
    );
  }
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

function HomeContent() {
  const { profile } = useLoaderData() as LoaderData;
  const canStartQuiz = !!profile;

  return (
    <Stack gap="xl">
      {/* Hero / Main Action */}
      <Paper
        component={Link}
        to={canStartQuiz ? "/events" : "#"}
        radius="xl"
        shadow="lg"
        p="xl"
        style={{
          backgroundColor: "var(--mantine-primary-color-filled)",
          color: "white",
          textDecoration: "none",
          opacity: canStartQuiz ? 1 : 0.9,
          cursor: canStartQuiz ? "pointer" : "not-allowed",
        }}
        onClick={(e: React.MouseEvent) => {
          if (!canStartQuiz) e.preventDefault();
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Stack gap={4}>
            <Group gap="xs">
              <ThemeIcon size="lg" color="white" variant="transparent">
                <IconBulb size={28} />
              </ThemeIcon>
              <Text fw={700} size="lg" c="white">
                イベントに参加
              </Text>
            </Group>
            <Text size="sm" c="white" opacity={0.9} style={{ lineHeight: 1.5 }}>
              みんなのクイズに挑戦したり、
              <br />
              出題したりしよう
            </Text>
          </Stack>
          <IconArrowRight color="white" />
        </Group>
      </Paper>

      {!canStartQuiz && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          variant="light"
          color="orange"
          title="まずはプロフィール作成"
        >
          クイズに参加するにはプロフィールが必要です。下のボタンから作成してください。
        </Alert>
      )}

      <SimpleGrid cols={2} spacing="md">
        {/* Profile List */}
        <Paper
          component={Link}
          to="/profiles"
          p="lg"
          shadow="md"
          radius="lg"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Stack gap="sm" align="center">
            <ThemeIcon size={48} radius="md" variant="light" color="indigo">
              <IconUsers size={28} />
            </ThemeIcon>
            <Text size="sm" fw={600}>
              みんなの
              <br />
              プロフィール
            </Text>
          </Stack>
        </Paper>

        {/* My Page */}
        <Paper
          component={Link}
          to="/me"
          p="lg"
          shadow="md"
          radius="lg"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Stack gap="sm" align="center">
            <ThemeIcon size={48} radius="md" variant="light" color="pink">
              <IconUser size={28} />
            </ThemeIcon>
            <Text size="sm" fw={600}>
              マイページ
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>

      <Button
        component={Link}
        to="/help"
        variant="subtle"
        color="gray"
        leftSection={<IconHelp size={16} />}
      >
        使い方を見る
      </Button>
    </Stack>
  );
}

export function HomeScreen() {
  return (
    <Container title="キミのヒント" isHome>
      <Suspense fallback={<Loading />}>
        <HomeContent />
      </Suspense>
    </Container>
  );
}

HomeScreen.loader = loader;

