import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ApiError,
  ensureGuestAuth,
  fetchCurrentUser,
  getJwtToken,
  setJwtToken,
  subscribeJwtToken,
} from "@/shared/api";

export type AuthState =
  | { status: "loading" }
  | { status: "ready"; user: unknown; token: string | null }
  | { status: "error"; error: ApiError };

type AuthContextValue = {
  state: AuthState;
  refresh: () => Promise<void>;
  ensure: () => Promise<void>;
  setToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const setToken = useCallback((token: string | null) => {
    setJwtToken(token);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const user = await fetchCurrentUser();
      setState({ status: "ready", user, token: getJwtToken() });
    } catch (e) {
      setState({ status: "error", error: e as ApiError });
    }
  }, []);

  const ensure = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const { user, token } = await ensureGuestAuth();
      setState({ status: "ready", user, token });
    } catch (e) {
      setState({ status: "error", error: e as ApiError });
    }
  }, []);

  useEffect(() => {
    // Initial auth
    void ensure();

    // Keep token changes reflected
    const unsub = subscribeJwtToken((token) => {
      setState((s) => {
        if (s.status !== "ready") return s;
        return { ...s, token };
      });
    });

    return unsub;
  }, [ensure]);

  const value = useMemo<AuthContextValue>(
    () => ({ state, refresh, ensure, setToken }),
    [state, refresh, ensure, setToken],
  );

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function useIsAuthed(): boolean {
  const { state } = useAuth();
  return state.status === "ready" && !!state.token;
}

export function useLogout() {
  const { setToken, ensure } = useAuth();
  return useCallback(async () => {
    setToken(null);
    await ensure();
  }, [setToken, ensure]);
}
