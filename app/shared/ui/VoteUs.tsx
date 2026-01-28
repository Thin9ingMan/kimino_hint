import {
  Paper,
  Stack,
  Text,
  Button,
  Group,
  ThemeIcon,
  Affix,
  ActionIcon,
  Transition,
} from "@mantine/core";
import { IconHeart, IconThumbUp, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * VoteUs: Mantine Affix＋Transitionで消えるアニメーション付き応援・フィードバックUI
 */
export function VoteUs() {
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpened(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Affix position={{ bottom: 16, right: 16 }}>
      <Transition
        mounted={opened}
        transition="slide-up"
        duration={300}
        timingFunction="ease"
      >
        {(styles) => (
          <Paper
            withBorder
            p="xs"
            radius="md"
            shadow="sm"
            bg="blue.0"
            style={{ ...styles }}
          >
            <Stack gap="xs" align="center" style={{ position: "relative" }}>
              <Group gap="xs">
                <ThemeIcon color="red" size={40} radius="xl" variant="light">
                  <IconHeart size={24} />
                </ThemeIcon>
                <Text size="sm">
                  いいな、って思ったら投票お願いします！
                  <br />
                  また、フィードバックもお待ちしています。
                </Text>
              </Group>
              <Group w="100%">
                <Button
                  component="a"
                  href="https://l.aoki.app/ehvoxy"
                  target="_blank"
                  leftSection={<IconThumbUp size={18} />}
                  variant="gradient"
                  p="sm"
                  style={{
                    flexGrow: 1,
                    flexShrink: 0,
                  }}
                >
                  投票する
                </Button>

                <Button
                  onClick={() => setOpened(false)}
                  p="sm"
                  variant="outline"
                >
                  <IconX size={16} />
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}
      </Transition>
    </Affix>
  );
}
