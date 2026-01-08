type Listener = (token: string | null) => void;

const TOKEN_KEY = 'jwtToken';

let memoryToken: string | null = null;
const listeners = new Set<Listener>();

function safeGetLocalStorageToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function safeSetLocalStorageToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore (e.g. storage disabled)
  }
}

export function getJwtToken(): string | null {
  if (memoryToken != null) return memoryToken;
  memoryToken = safeGetLocalStorageToken();
  return memoryToken;
}

export function setJwtToken(token: string | null) {
  memoryToken = token;
  safeSetLocalStorageToken(token);

  for (const l of listeners) l(token);
}

export function subscribeJwtToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
