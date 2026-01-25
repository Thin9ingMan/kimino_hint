import {
  Box,
  Container as MantineContainer,
  Group,
  Title,
  ActionIcon,
} from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import React from "react";

type Props = {
  children?: React.ReactNode;
  title?: string;
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
    <MantineContainer
      size={size}
      py={{ base: "xl", sm: 60 }}
      style={{ position: "relative", zIndex: 1 }}
    >
      <Box>
        {/* Header */}
        <Group
          mb={40}
          align="center"
          justify={isHome ? "center" : "space-between"}
        >
          {!isHome ? (
            <Link to="/" style={{ textDecoration: "none" }}>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xl"
                radius="xl"
                aria-label="ホームに戻る"
              >
                <IconHome size={28} stroke={1.5} />
              </ActionIcon>
            </Link>
          ) : (
            <Box />
          )}

          {title && (
            <Title
              order={1}
              ta="center"
              size={28}
              fw={800}
              style={{
                letterSpacing: "0.05em",
                color: "var(--mantine-color-slate-8)",
              }}
            >
              {title}
            </Title>
          )}

          {/* Spacer to balance the header if back button exists */}
          {!isHome && <Box w={44} />}
          {isHome && <Box />}
        </Group>

        {children}
      </Box>
    </MantineContainer>
  );
}
