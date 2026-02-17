const AUTH_API_BASE = import.meta.env.VITE_TIMBAL_BASE_URL;
const REFRESH_TOKEN_KEY = "timbal_refresh_token";

// ============================================
// Token storage
// Access token: in-memory (short-lived)
// Refresh token: localStorage (survives refresh)
// ============================================

let accessToken: string | null = null;
let refreshToken: string | null =
  localStorage.getItem(REFRESH_TOKEN_KEY) ?? null;

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// ============================================
// Timbal SDK sync helper
// ============================================

export const syncTimbalToken = (token?: string) => {
  import("@/timbal/client").then(({ timbal }) => {
    timbal.updateSessionToken(token);
  });
};

// ============================================
// Token refresh
// ============================================

let refreshPromise: Promise<boolean> | null = null;

export const refreshAccessToken = async (): Promise<boolean> => {
  if (!refreshToken) return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${AUTH_API_BASE}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken!,
        }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = await res.json();
      accessToken = data.access_token;
      if (data.refresh_token) {
        refreshToken = data.refresh_token;
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      }

      syncTimbalToken(accessToken ?? undefined);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ============================================
// Authenticated fetch wrapper
// ============================================

export const authFetch = async (
  url: string,
  options?: RequestInit,
): Promise<Response> => {
  let res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  }

  return res;
};

// ============================================
// Errors
// ============================================

export class AccessDeniedError extends Error {
  constructor(message = "You don't have access to this application") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

// ============================================
// API helpers
// ============================================

export interface TimbalUser {
  [key: string]: unknown;
}

/**
 * Validate token via GET /me
 */
export const fetchCurrentUser = async (
  token?: string,
): Promise<TimbalUser | null> => {
  const tk = token ?? accessToken;
  if (!tk) return null;

  try {
    const res = await fetch(`${AUTH_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${tk}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Check if user has access to the configured org/project.
 * Throws AccessDeniedError if the user is authenticated but not authorized.
 * Skipped when orgId or projectId are not configured.
 */
export const checkProjectAccess = async (
  token: string,
  orgId?: string,
  projectId?: string,
): Promise<void> => {
  if (!orgId || !projectId) return; // no authorization configured, skip

  const res = await fetch(
    `${AUTH_API_BASE}/orgs/${orgId}/projects/${projectId}`,
    { method: "HEAD", headers: { Authorization: `Bearer ${token}` } },
  );

  if (res.status === 403 || res.status === 404) {
    throw new AccessDeniedError();
  }

  if (!res.ok) {
    throw new Error("Failed to verify project access");
  }
};

/**
 * Full validation: authenticate + authorize.
 * Returns user object or throws.
 * Deduplicates concurrent calls with the same token.
 */
let _validatePromise: Promise<TimbalUser> | null = null;
let _validateToken: string | null = null;

export const validateUser = async (
  token: string,
  orgId?: string,
  projectId?: string,
): Promise<TimbalUser> => {
  // Return existing promise if same token is already being validated
  if (_validatePromise && _validateToken === token) {
    return _validatePromise;
  }

  _validateToken = token;
  _validatePromise = (async () => {
    try {
      const user = await fetchCurrentUser(token);
      if (!user) throw new Error("Invalid token");

      await checkProjectAccess(token, orgId, projectId);
      return user;
    } finally {
      _validatePromise = null;
      _validateToken = null;
    }
  })();

  return _validatePromise;
};

export const requestMagicLink = async (email: string): Promise<void> => {
  const res = await fetch(`${AUTH_API_BASE}/auth/magic-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      redirect_uri: `${window.location.origin}/auth/callback`,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data.detail ?? data.message ?? "Failed to send magic link",
    );
  }
};

export const getOAuthUrl = (provider: string): string => {
  const redirectUri = `${window.location.origin}/auth/callback`;
  return `${AUTH_API_BASE}/oauth/authorize?provider=${provider}&redirect_uri=${encodeURIComponent(redirectUri)}`;
};
