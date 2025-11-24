/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient, Session } from "@supabase/supabase-js";
import {
  authConfig,
  isAuthEnabled,
  hasAnyAuthMethod,
  isOAuthProviderEnabled,
  type OAuthProvider,
  type AuthProviderType,
} from "@/auth/config";

// Re-export types and helpers for backwards compatibility
export type { OAuthProvider, AuthProviderType };
export { authConfig, isAuthEnabled, hasAnyAuthMethod, isOAuthProviderEnabled };

// ============================================
// Auth Provider Client
// ============================================

/**
 * Initialize the auth client based on provider type
 * Currently supports Supabase, but can be extended for other providers
 */
const initAuthClient = () => {
  if (!isAuthEnabled) return null;

  switch (authConfig.provider) {
    case "supabase":
      return createClient(authConfig.url!, authConfig.key!);

    case "custom":
      // TODO: Implement custom auth provider
      // return createCustomAuthClient(authConfig)
      throw new Error("Custom auth provider not yet implemented");

    default:
      throw new Error(`Unknown auth provider: ${authConfig.provider}`);
  }
};

export const authClient = initAuthClient();

// ============================================
// Session Context
// ============================================

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If auth is disabled, set empty session and mark as not loading
    if (!isAuthEnabled) {
      setSession(null);
      setLoading(false);
      return;
    }

    // authClient is null when auth is disabled (checked above)
    if (!authClient) {
      setSession(null);
      setLoading(false);
      return;
    }

    // Get initial session
    authClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Sync token to Timbal client (lazy import to avoid circular dependency)
      import("@/timbal/client").then(({ timbal }) => {
        timbal.updateSessionToken(session?.access_token);
      });
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Sync token to Timbal client (lazy import to avoid circular dependency)
      import("@/timbal/client").then(({ timbal }) => {
        timbal.updateSessionToken(session?.access_token);
      });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!session?.access_token;

  return (
    <SessionContext.Provider value={{ session, loading, isAuthenticated }}>
      {children}
    </SessionContext.Provider>
  );
};

// ============================================
// Auth Actions Hook
// ============================================

export const useAuth = () => {
  const signInWithPassword = async (email: string, password: string) => {
    if (!authClient) {
      throw new Error("Auth is not enabled");
    }
    if (!authConfig.methods.emailPassword) {
      throw new Error("Email/password authentication is disabled");
    }
    return authClient.auth.signInWithPassword({ email, password });
  };

  const signInWithOAuth = async (provider: OAuthProvider) => {
    if (!authClient) {
      throw new Error("Auth is not enabled");
    }
    if (!authConfig.methods.oauth) {
      throw new Error("OAuth authentication is disabled");
    }
    if (!isOAuthProviderEnabled(provider)) {
      throw new Error(`OAuth provider '${provider}' is not enabled`);
    }
    return authClient.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signUp = async (email: string, password: string) => {
    if (!authClient) {
      throw new Error("Auth is not enabled");
    }
    if (!authConfig.methods.emailPassword) {
      throw new Error("Email/password authentication is disabled");
    }
    return authClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!authClient) {
      throw new Error("Auth is not enabled");
    }
    if (!authConfig.methods.emailPassword) {
      throw new Error("Email/password authentication is disabled");
    }
    return authClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  };

  const updatePassword = async (password: string) => {
    if (!authClient) {
      throw new Error("Auth is not enabled");
    }
    if (!authConfig.methods.emailPassword) {
      throw new Error("Email/password authentication is disabled");
    }
    return authClient.auth.updateUser({ password });
  };

  const signOut = async () => {
    if (!authClient) {
      throw new Error("Auth is not enabled");
    }
    return authClient.auth.signOut();
  };

  return {
    signInWithPassword,
    signInWithOAuth,
    signUp,
    resetPasswordForEmail,
    updatePassword,
    signOut,
    isAuthEnabled,
    config: authConfig,
    isOAuthProviderEnabled,
  };
};
