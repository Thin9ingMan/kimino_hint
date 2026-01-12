import {
  Box,
  Container as MantineContainer,
  Group,
  Title,
  Text,
  ActionIcon,
} from "@mantine/core";
import { Home } from "tabler-icons-react";
import { Link } from "react-router-dom";
import React from "react";

type Props = {
  children?: React.ReactNode;
  title?: string;
  /** アプリ名（左上・ホームリンク） */
  appTitle?: string;
  /** Optional max width passed to Mantine Container. */
  size?: React.ComponentProps<typeof MantineContainer>["size"];
  isHome?: boolean;
};

export function Container({
  children,
  title,
  size = 520,
  isHome = false,
}: Props) {
  return (
    <MantineContainer size={size} py={{ base: "xl", sm: 60 }}>
      <Box>
        {/* ヘッダー */}
        <Group mb="lg" justify="flex-start" >
          {/* 左：常に同じホームリンク */}
          {!isHome && (
            <Link to="/" style={{ textDecoration: "none" }}>
              <ActionIcon
                variant="subtle"
                color="dark"
                size="lg"
                aria-label="ホームに戻る"
                title="ホームに戻る"
              >
                <Home style={{ width: 32, height: 32 }} />
              </ActionIcon>
            </Link>
          )}
          <Title order={1} ta="center" size={36} fw={800} flex={1}>
            {title}
          </Title>
        </Group>

        {children}
      </Box>
    </MantineContainer>
  );
}
