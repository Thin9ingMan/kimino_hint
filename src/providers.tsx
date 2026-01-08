import React from "react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { theme } from "./styles/theme";
import { AuthProvider } from "@/shared/auth/AuthProvider";

import "@mantine/core/styles.css";
import "./styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Suspense is enabled per-hook via `useSuspenseQuery()`.
      retry: 1,
      staleTime: 10_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders(props: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{props.children}</AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
}
