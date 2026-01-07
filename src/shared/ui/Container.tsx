import { Container as MantineContainer } from "@mantine/core";
import React from "react";

type Props = {
  children?: React.ReactNode;
  title?: string;
};

export function Container({ children, title }: Props) {
  return <MantineContainer title={title}>{children}</MantineContainer>;
}
