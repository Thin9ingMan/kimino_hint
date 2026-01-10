import { useEffect, useState } from "react";
import { apis } from "@/shared/api";

// Authenticate on first mount. Does not expose the app until a valid token is present.
export function useGuestAuth() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const isUnauthorized = (err) => {
      try {
        const status =
          (err && (err.status ?? err.response?.status ?? err.cause?.status)) ?? undefined;
        if (status === 401) return true;
        const msg = String(err?.message || "").toLowerCase();
        return (
          msg.includes("401") ||
          msg.includes("unauthorized") ||
          msg.includes("authentication required")
        );
      } catch {
        return false;
      }
    };

    const obtainAnonymousToken = async () => {
      const raw = await apis.auth.createGuestUserRaw();
      const authHeader = raw.raw.headers.get("Authorization") || "";
      const bearer = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;
      if (!bearer) throw new Error("Missing Authorization header");
      localStorage.setItem("jwtToken", bearer);
    };

    const validateCurrentUser = async () => {
      await apis.auth.getCurrentUser();
    };

    const ensureAuth = async () => {
      try {
        const token = localStorage.getItem("jwtToken");

        // No token yet -> obtain one and validate
        if (!token) {
          await obtainAnonymousToken();
          await validateCurrentUser();
          if (!cancelled) {
            setReady(true);
            setError(null);
          }
          return;
        }

        // Have a token -> validate it
        try {
          await validateCurrentUser();
          if (!cancelled) {
            setReady(true);
            setError(null);
          }
          return;
        } catch (e) {
          // Token might be expired/invalid -> obtain a fresh anonymous token and retry once
          if (isUnauthorized(e)) {
            try {
              await obtainAnonymousToken();
              await validateCurrentUser();
              if (!cancelled) {
                setReady(true);
                setError(null);
              }
              return;
            } catch (re) {
              // clear broken token so a subsequent retry starts clean
              localStorage.removeItem("jwtToken");
              throw re;
            }
          }
          throw e;
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
