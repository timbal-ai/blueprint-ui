/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  authConfig,
  isAuthEnabled,
  hasAnyAuthMethod,
  isOAuthProviderEnabled,
  type OAuthProvider,
} from "@/auth/config";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  validateUser,
  refreshAccessToken,
  syncTimbalToken,
  requestMagicLink as requestMagicLinkApi,
  getOAuthUrl,
  AccessDeniedError,
  type TimbalUser,
} from "@/auth/tokens";

export type { OAuthProvider };
export { authConfig, isAuthEnabled, hasAnyAuthMethod, isOAuthProviderEnabled };

// ============================================
// Session Context
// ============================================

interface SessionContextType {
  user: TimbalUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUserFromCallback: (
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

// ============================================
// Session Provider
// ============================================

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<TimbalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthEnabled) {
      setLoading(false);
      syncTimbalToken(undefined);
      return;
    }

    let ignore = false;

    const restoreSession = async () => {
      try {
        // Try existing access token first
        const token = getAccessToken();
        if (token) {
          const u = await validateUser(
            token,
            authConfig.orgId,
            authConfig.projectId,
          );
          if (ignore) return;
          setUser(u);
          syncTimbalToken(token);
          setLoading(false);
          return;
        }

        // Try refreshing from stored refresh token
        if (getRefreshToken()) {
          const ok = await refreshAccessToken();
          if (ignore) return;
          if (ok) {
            const newToken = getAccessToken()!;
            const u = await validateUser(
              newToken,
              authConfig.orgId,
              authConfig.projectId,
            );
            if (ignore) return;
            setUser(u);
            syncTimbalToken(newToken);
            setLoading(false);
            return;
          }
        }
      } catch {
        if (ignore) return;
        clearTokens();
      }

      syncTimbalToken(undefined);
      setLoading(false);
    };

    restoreSession();

    return () => {
      ignore = true;
    };
  }, []);

  const setUserFromCallback = useCallback(
    async (accessToken: string, refreshToken: string) => {
      setTokens(accessToken, refreshToken);
      // Throws AccessDeniedError if user lacks project access
      const u = await validateUser(
        accessToken,
        authConfig.orgId,
        authConfig.projectId,
      );
      setUser(u);
      syncTimbalToken(accessToken);
    },
    [],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    syncTimbalToken(undefined);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        setUserFromCallback,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

// ============================================
// Auth Actions Hook
// ============================================

export const useAuth = () => ({
  loginWithOAuth: (provider: OAuthProvider) => {
    window.location.href = getOAuthUrl(provider);
  },
  sendMagicLink: (email: string) => requestMagicLinkApi(email),
  isAuthEnabled,
  config: authConfig,
  isOAuthProviderEnabled,
});

// Re-export for consumers that need to check error types
export { AccessDeniedError };
