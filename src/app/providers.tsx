import React from 'react';
import { MantineProvider } from '@mantine/core';

import { theme } from './styles/theme';
import { AuthProvider } from '@/shared/auth/AuthProvider';

import '@mantine/core/styles.css';

export function AppProviders(props: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme}>
      <AuthProvider>{props.children}</AuthProvider>
    </MantineProvider>
  );
}
