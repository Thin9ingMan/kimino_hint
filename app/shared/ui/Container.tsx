import {
  Box,
  Container as MantineContainer,
  Group,
  Title,
} from "@mantine/core";
import React from "react";

type Props = {
  children?: React.ReactNode;
  title?: string;
  /** Optional max width passed to Mantine Container. */
  size?: React.ComponentProps<typeof MantineContainer>["size"];
};

export function Container({ children, title, size = 520 }: Props) {
  return (
    <MantineContainer size={size} py={{ base: "xl", sm: 60 }}>
      <Box>
        {title && (
          <Group justify="center" mb="lg">
            <Title order={1} ta="center" size={36} fw={800}>
              {title}
            </Title>
          </Group>
        )}
        {children}
      </Box>
    </MantineContainer>
  );
}
