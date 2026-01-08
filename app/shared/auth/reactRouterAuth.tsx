import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from './AuthProvider';

/**
 * Route guard component.
 * If auth is still loading: render nothing (or replace with a spinner screen later).
 * If auth failed: redirect to /error/auth.
 * If ready: render children.
 */
export function RequireAuth(props: { children: React.ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') return null;

  if (state.status === 'error') {
    return <Navigate to="/error/auth" replace state={{ from: location.pathname }} />;
  }

  // guest auth is always established by provider, but keep it explicit
  if (!state.token) {
    return <Navigate to="/error/auth" replace state={{ from: location.pathname }} />;
  }

  return <>{props.children}</>;
}
