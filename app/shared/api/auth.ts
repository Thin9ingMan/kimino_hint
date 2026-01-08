import { apis } from "./client";
import { getJwtToken, setJwtToken } from "./tokenStorage";
import { isUnauthorized, toApiError } from "./errors";

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  return authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length)
    : authorizationHeader;
}

/**
 * Creates a guest user and stores returned JWT token.
 * Returns the created user and token.
 */
export async function createGuestSession(): Promise<{
  user: unknown;
  token: string;
}> {
  try {
    const response = await apis.auth.createGuestUserRaw();
    const authorization = response.raw.headers.get("authorization");
    const token = extractBearerToken(authorization);

    if (!token) throw new Error("Missing Authorization header");

    setJwtToken(token);

    const user = await response.value();
    return { user, token };
  } catch (e) {
    throw toApiError(e);
  }
}

export async function fetchCurrentUser() {
  try {
    return await apis.auth.getCurrentUser();
  } catch (e) {
    throw toApiError(e);
  }
}

/**
 * Ensures there is a valid session.
 * - If no token: create guest session then validate.
 * - If token exists but invalid: recreate guest session then validate.
 */
export async function ensureGuestAuth(): Promise<{
  user: unknown;
  token: string;
}> {
  const token = getJwtToken();

  if (!token) {
    const created = await createGuestSession();
    await fetchCurrentUser();
    return created;
  }

  try {
    const user = await fetchCurrentUser();
    return { user, token };
  } catch (e) {
    if (!isUnauthorized(e)) throw e;

    // retry once with fresh token
    setJwtToken(null);
    const created = await createGuestSession();
    await fetchCurrentUser();
    return created;
  }
}
