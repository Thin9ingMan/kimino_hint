import { Container } from "@mantine/core";
import React from "react";

type Props = {
  children: React.ReactNode;
  // title?: string; // add it later
};

export function ScreenContainer({ children }: Props) {
  return <Container>{children}</Container>;
}
