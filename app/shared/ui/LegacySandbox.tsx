import React from "react";

import { Container } from "@mantine/core";

type Props = {
  children: React.ReactNode;
  /**
   * Optional extra className appended after the required `legacy` class.
   * This wrapper exists to provide a stable scoping hook for legacy CSS.
   */
  className?: string;
};

/**
 * Wrap legacy screens with a `.legacy` root so legacy CSS can be sandboxed by scoping selectors.
 */
export function LegacySandbox(props: Props) {
  const cls = ["legacy", props.className].filter(Boolean).join(" ");
  const inner = <div className={cls}>{props.children}</div>;
  return <Container>{inner}</Container>;
}
