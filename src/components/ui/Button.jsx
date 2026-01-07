import { Button as MantineButton } from '@mantine/core';

/**
 * Legacy-compatible Button wrapper.
 *
 * API is intentionally kept close to the old implementation so legacy engineers
 * can keep using it without learning Mantine immediately.
 *
 * @param {{
 *   type?: "button" | "submit" | "reset";
 *   variant?: "primary" | "ghost";
 *   disabled?: boolean;
 *   onClick?: (event: import("react").MouseEvent<HTMLButtonElement>) => void;
 *   children: import("react").ReactNode;
 * }} props
 */
export default function Button({
  type = 'button',
  variant = 'primary',
  disabled = false,
  onClick,
  children,
}) {
  const isGhost = variant === 'ghost';

  return (
    <MantineButton
      type={type}
      disabled={disabled}
      onClick={onClick}
      radius="md"
      size="md"
      variant={isGhost ? 'outline' : 'gradient'}
      gradient={isGhost ? undefined : { from: 'teal', to: 'cyan', deg: 135 }}
      styles={{
        root: {
          fontWeight: 700,
        },
      }}
    >
      {children}
    </MantineButton>
  );
}