import { Container as MantineContainer, Title } from "@mantine/core";
import React from "react";

type Props = {
  children?: React.ReactNode;
  title?: string;
};

export function Container({ children, title }: Props) {
  return (
    <MantineContainer title={title}>
      {title && <Title order={1}>{title}</Title>}
      {children}
    </MantineContainer>
  );
}
