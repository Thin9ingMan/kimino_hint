import { useCallback, useEffect, useState } from 'react';

import { ApiError, ensureGuestAuth } from '@/shared/api';

export function useGuestAuth() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        await ensureGuestAuth();
        if (cancelled) return;
        setReady(true);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setReady(false);
        setError(e as ApiError);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const retry = useCallback(() => {
    setReady(false);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  return { ready, error, retry };
}
