import { useRouteLoaderData, redirect } from "react-router-dom";
import { ensureGuestAuth, setJwtToken } from "@/shared/api";

export interface AuthState {
  user: any;
  token: string | null;
}

/**
 * Root loader that ensures a valid session (guest or higher) before any page renders.
 */
export async function rootAuthLoader(): Promise<AuthState> {
  try {
    const { user, token } = await ensureGuestAuth();
    return { user, token };
  } catch (error) {
    console.error("Auth initialization failed:", error);
    // Even if it fails, we return a fallback state to prevent the app from crashing.
    // Specific screens can handle the error state if needed.
    return { user: null, token: null };
  }
}

/**
 * Streamlined hook to access auth state from the root loader.
 */
export function useAuth(): AuthState {
  const data = useRouteLoaderData("root") as AuthState | undefined;
  if (!data) {
    throw new Error(
      "useAuth must be used within a route that has access to the 'root' loader.",
    );
  }
  return data;
}

/**
 * Handle logout by clearing the token and redirecting/revalidating.
 */
export async function logoutAction() {
  setJwtToken(null);
  // Redirect to home will trigger a full re-render and root loader will re-run
  return redirect("/home");
}
