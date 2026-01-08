import { Button, Stack } from "@mantine/core";
import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface NavigationButton {
  label: string;
  to: string;
  variant?: "filled" | "light" | "subtle" | "default" | "outline";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

interface NavigationButtonListProps {
  buttons: NavigationButton[];
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  defaultVariant?: NavigationButton["variant"];
  defaultSize?: NavigationButton["size"];
  defaultFullWidth?: boolean;
}

/**
 * ナビゲーションボタン群を統一表示するコンポーネント
 * MeHubScreen や EventsHubScreen で使われるボタン群パターンを統一
 */
export function NavigationButtonList({
  buttons,
  gap = "sm",
  defaultVariant = "filled",
  defaultSize = "md",
  defaultFullWidth = true,
}: NavigationButtonListProps) {
  return (
    <Stack gap={gap}>
      {buttons.map((button, index) => {
        const buttonProps = {
          variant: button.variant ?? defaultVariant,
          size: button.size ?? defaultSize,
          fullWidth: button.fullWidth ?? defaultFullWidth,
          disabled: button.disabled,
          onClick: button.onClick,
        };

        return (
          <Button
            key={`nav-button-${index}-${button.to}`}
            component={Link}
            to={button.to}
            leftSection={button.icon}
            {...buttonProps}
          >
            {button.label}
          </Button>
        );
      })}
    </Stack>
  );
}