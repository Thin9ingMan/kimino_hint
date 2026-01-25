import { LegacyPortalScreen } from "@/feat/misc/screens/LegacyPortalScreen";
// import { MakeFalseSelectionCompatScreen } from "@/feat/misc/screens/MakeFalseSelectionCompatScreen";

import React from "react";
import { Navigate, Route } from "react-router-dom";

// import {
//   LegacyAnswerRedirect,
//   LegacyQuestionRedirect,
//   LegacyResultRedirect,
// } from "@/compat/legacyQuizRedirector";

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
  // Order intentionally mirrors the legacy route table (as much as possible).

  <Route path="/question" element={<Navigate to="/events" replace />} />,
  <Route path="/answer" element={<Navigate to="/events" replace />} />,
  <Route path="/result" element={<Navigate to="/events" replace />} />,

  <Route path="/room" element={<Navigate to="/events/join" replace />} />,

  <Route
    path="/make_false_selection"
    element={<Navigate to="/events" replace />}
  />,

  <Route
    path="/profile_history"
    element={<Navigate to="/profiles" replace />}
  />,
  <Route
    path="/make_question"
    element={<Navigate to="/events/new" replace />}
  />,

  <Route path="/my_profile" element={<Navigate to="/me/profile" replace />} />,
  <Route
    path="/edit_profile"
    element={<Navigate to="/me/profile/edit" replace />}
  />,

  <Route path="/read_qr" element={<Navigate to="/qr/scan" replace />} />,
  <Route path="/make_qr" element={<Navigate to="/qr/profile" replace />} />,

  // Not part of the legacy route table ordering request.
  <Route path="/legacy" element={<LegacyPortalScreen />} />,
];
