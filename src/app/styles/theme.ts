import { createTheme } from '@mantine/core';

/**
 * Mantine theme tuned to resemble the legacy UI:
 * - soft pastel primary
 * - slightly rounded cards/buttons
 * - readable Japanese typography
 */
export const theme = createTheme({
  // Keep font fixed (webfont is loaded in global.css)
  fontFamily: '"Noto Sans JP", sans-serif',
  primaryColor: 'cyan',
  defaultRadius: 'md',
  components: {
    Title: {
      defaultProps: {
        c: '#0f172a',
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
      },
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
      },
    },
  },
});
