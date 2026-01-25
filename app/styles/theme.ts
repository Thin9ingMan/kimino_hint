import { createTheme } from "@mantine/core";

/**
 * Mantine theme tuned for "Kimino Hint" - Warm, Friendly, Modern.
 * - Soft Teal primary for a friendly vibe.
 * - Rounded adjustments for a softer feel.
 * - Card/Paper shadows instead of harsh borders.
 */
export const theme = createTheme({
  fontFamily: '"Noto Sans JP", sans-serif',
  primaryColor: "cyan",
  defaultRadius: "md",
  cursorType: "pointer",

  components: {
    Title: {
      defaultProps: {
        c: "#334155", // slate-700 for softer headings
      },
    },
    Text: {
      defaultProps: {
        c: "#475569", // slate-600 for softer body text
      },
    },
    Button: {
      defaultProps: {
        // Pill-shaped buttons are friendlier
        radius: "xl",
        size: "md",
        variant: "filled",
      },
      styles: {
        root: {
          fontWeight: 600,
        },
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
        padding: "md",
      },
    },
    Paper: {
      defaultProps: {
        radius: "lg",
        p: "md",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
        size: "md",
      },
      styles: {
        input: {
          backgroundColor: "#f8fafc", // slate-50
          border: "1px solid #e2e8f0", // slate-200
        },
      },
    },
    Alert: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        root: {
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          border: "none",
        },
      },
    },
  },
});
