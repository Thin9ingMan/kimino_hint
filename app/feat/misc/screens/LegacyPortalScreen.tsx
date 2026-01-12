import { Stack } from '@mantine/core';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { LegacyPlaceholderBanner } from '@/shared/ui/LegacyPlaceholderBanner';
import { Container } from '@/shared/ui/Container';

/**
 * A single, explicit entry point for legacy URLs.
 *
 * This exists to:
 * - avoid scattering "temporary" redirects
 * - keep legacy migration visible via a banner
 * - give us one place to later embed/redirect to the actual legacy components
 */
export function LegacyPortalScreen() {
  const location = useLocation();

  const from = useMemo(() => {
    const p = location.pathname;
    const s = location.search;
    return `${p}${s}`;
  }, [location.pathname, location.search]);

  return (
    <Container title="レガシー画面（移行中）" size={720}>
      <Stack gap="md">
        <LegacyPlaceholderBanner legacyPath={from} />
      </Stack>
    </Container>
  );
}
