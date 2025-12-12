import { useEffect, useState } from "react";
import { apis } from "../api/client";

// Authenticate on first mount. Does not expose the app until a valid token is present.
export function useGuestAuth() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const ensureAuth = async () => {
      try {
        const token = localStorage.getItem("jwtToken");

        if (token) {
          await apis.auth().getCurrentUser();
          if (!cancelled) {
            setReady(true);
            setError(null);
          }
          return;
        }

        const raw = await apis.auth().createGuestUserRaw();
        const authHeader = raw.raw.headers.get("Authorization") || "";
        const bearer = authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : authHeader;
        if (!bearer) throw new Error("Missing Authorization header");
        localStorage.setItem("jwtToken", bearer);

        await apis.auth().getCurrentUser();
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setReady(false);
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      }
    };

    ensureAuth();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const retry = () => {
    setReady(false);
    setError(null);
    setNonce((n) => n + 1);
  };

  return { ready, error, retry };
}
