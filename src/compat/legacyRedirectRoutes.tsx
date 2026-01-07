import { LegacyPortalScreen } from "@/feat/misc/screens/LegacyPortalScreen";
import { MakeFalseSelectionCompatScreen } from "@/feat/misc/screens/MakeFalseSelectionCompatScreen";
import React, { useMemo } from "react";
import { Navigate, Route, useLocation } from "react-router-dom";

type AnyState = Record<string, unknown>;

function safeParseInt(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
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
function LegacyQuestionRedirect() {
  const location = useLocation();

  const next = useMemo(() => {
    const incoming = (location.state ?? {}) as AnyState;

    // Legacy quiz uses 0-based `count` (array index).
    const count = safeParseInt(incoming.count, 0);
    const score = safeParseInt(incoming.score, 0);

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
function LegacyAnswerRedirect() {
  const location = useLocation();

  const next = useMemo(() => {
    const incoming = location.state as AnyState | null;
    if (!incoming) return { to: "/question", state: null as AnyState | null };

    // In legacy Answer, `count` represents the *next* question index.
    // New Spec route uses 1-based questionNo.
    const count = safeParseInt(incoming.count, 0);
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
function LegacyResultRedirect() {
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

/**
 * Legacy URL compat routes.
 *
 * Policy (Phase 0): keep old URLs as thin redirects to New Spec URLs.
 *
 * NOTE:
 * - Keep this isolated so [`AppRouter`](../app/router.tsx:25) stays readable.
 * - We intentionally keep these redirects near the bottom of the route table.
 */
export const legacyRedirectRoutes: React.ReactElement[] = [
  <Route
    key="legacy-room"
    path="/room"
    element={<Navigate to="/events/join" replace />}
  />,
  <Route
    key="legacy-my-profile"
    path="/my_profile"
    element={<Navigate to="/me/profile" replace />}
  />,
  <Route
    key="legacy-edit-profile"
    path="/edit_profile"
    element={<Navigate to="/me/profile/edit" replace />}
  />,
  <Route
    key="legacy-profile-history"
    path="/profile_history"
    element={<Navigate to="/me/friendships/received" replace />}
  />,
  <Route
    key="legacy-read-qr"
    path="/read_qr"
    element={<Navigate to="/qr/scan" replace />}
  />,
  <Route
    key="legacy-make-qr"
    path="/make_qr"
    element={<Navigate to="/qr/profile" replace />}
  />,

  // Legacy aliases where New Spec has a clear equivalent.
  <Route
    key="legacy-profile"
    path="/profile"
    element={<Navigate to="/me/profile" replace />}
  />,
  <Route
    key="legacy-make-question"
    path="/make_question"
    element={<Navigate to="/events/new" replace />}
  />,

  <Route
    key="legacy-question"
    path="/question"
    element={<LegacyQuestionRedirect />}
  />,
  <Route
    key="legacy-answer"
    path="/answer"
    element={<LegacyAnswerRedirect />}
  />,
  <Route
    key="legacy-result"
    path="/result"
    element={<LegacyResultRedirect />}
  />,

  <Route path="/legacy" element={<LegacyPortalScreen />} />,

  <Route
    path="/make_false_selection"
    element={<MakeFalseSelectionCompatScreen />}
  />,
];
