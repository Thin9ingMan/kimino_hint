import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";

export type AnyState = Record<string, unknown>;

function safeParseInt(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function safeParseNonNegativeInt(v: unknown, fallback: number): number {
  const n = safeParseInt(v, fallback);
  return n < 0 ? fallback : n;
}

function loadFalseAnswersFromStorage(): unknown | null {
  try {
    const raw = localStorage.getItem("falseAnswers");
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

/**
 * Redirect-only handler for legacy `/question`.
 *
 * - Reads legacy `location.state` when present.
 * - Restores `falseAnswers` from localStorage when missing.
 * - Redirects into New Spec quiz URL space while keeping legacy state via Navigate.state.
 */
export function LegacyQuestionRedirect() {
  const location = useLocation();

  const next = useMemo(() => {
    const incoming = (location.state ?? {}) as AnyState;

    // Legacy quiz uses 0-based `count` (array index).
    const count = safeParseNonNegativeInt(incoming.count, 0);
    const score = safeParseNonNegativeInt(incoming.score, 0);

    const falseAnswers =
      incoming.falseAnswers ?? loadFalseAnswersFromStorage() ?? null;

    if (!falseAnswers) {
      return {
        to: "/make_false_selection",
        state: null as AnyState | null,
      };
    }

    // New Spec route uses `:eventId` and `:questionNo`. We use a sentinel eventId (`legacy`).
    // Use 1-based questionNo for nicer URLs.
    const questionNo = count + 1;

    return {
      to: `/events/legacy/quiz/${questionNo}`,
      state: { ...incoming, count, score, falseAnswers } as AnyState,
    };
  }, [location.state]);

  return <Navigate to={next.to} replace state={next.state ?? undefined} />;
}

/**
 * Redirect-only handler for legacy `/answer`.
 *
 * Legacy flow normally navigates here with state; if missing, fall back to `/question`.
 */
export function LegacyAnswerRedirect() {
  const location = useLocation();

  const next = useMemo(() => {
    const incoming = location.state as AnyState | null;
    if (!incoming) return { to: "/question", state: null as AnyState | null };

    // In legacy Answer, `count` represents the *next* question index.
    // New Spec route uses 1-based questionNo.
    const count = safeParseNonNegativeInt(incoming.count, 0);
    const questionNo = count + 1;

    return {
      to: `/events/legacy/quiz/${questionNo}/answer`,
      state: incoming,
    };
  }, [location.state]);

  return <Navigate to={next.to} replace state={next.state ?? undefined} />;
}

/**
 * Redirect-only handler for legacy `/result`.
 */
export function LegacyResultRedirect() {
  const location = useLocation();

  const next = useMemo(() => {
    const incoming = location.state as AnyState | null;
    if (!incoming) return { to: "/home", state: null as AnyState | null };

    // `/events/:eventId/result` expects `eventId`.
    // We use a sentinel eventId (`legacy`) to carry the legacy flow.
    return { to: "/events/legacy/result", state: incoming };
  }, [location.state]);

  return <Navigate to={next.to} replace state={next.state ?? undefined} />;
}
