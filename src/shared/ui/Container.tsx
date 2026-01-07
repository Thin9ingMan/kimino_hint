import { Container as MantineContainer } from "@mantine/core";
import React from "react";

type Props = {
  children: React.ReactNode;
  // title?: string; // add it later
};

export function Container({ children }: Props) {
  return <MantineContainer>{children}</MantineContainer>;
}
