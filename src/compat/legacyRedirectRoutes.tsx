import { LegacyPortalScreen } from "@/feat/misc/screens/LegacyPortalScreen";
import { MakeFalseSelectionCompatScreen } from "@/feat/misc/screens/MakeFalseSelectionCompatScreen";
import React from "react";
import { Navigate, Route } from "react-router-dom";

import {
  LegacyAnswerRedirect,
  LegacyQuestionRedirect,
  LegacyResultRedirect,
} from "@/compat/legacyQuizRedirector";

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
    element={<Navigate to="/profiles" replace />}
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

  <Route key="legacy-portal" path="/legacy" element={<LegacyPortalScreen />} />,

  <Route
    key="legacy-make-false-selection"
    path="/make_false_selection"
    element={<MakeFalseSelectionCompatScreen />}
  />,
];
