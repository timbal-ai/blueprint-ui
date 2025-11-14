import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient, Session } from '@supabase/supabase-js'

// ============================================
// Configuration
// ============================================

/**
 * Supported OAuth providers
 * Add or remove providers here to control what's available in your app
 */
export type OAuthProvider = 'google' | 'github' | 'azure' | 'apple' | 'facebook'

/**
 * Supported auth provider types
 * Add new providers here (e.g., 'auth0', 'firebase', 'cognito')
 */
export type AuthProviderType = 'supabase' | 'custom'

/**
 * Auth configuration from environment variables
 * 
 * Provider-specific credential mapping:
 * - Supabase: url = project URL, key = anon key
 * - Auth0: url = domain, key = client ID
 * - Firebase: url = auth domain, key = API key
 * - Cognito: url = user pool ID, key = client ID
 */

// Auth method constants
const AUTH_METHOD_KEYWORDS = {
    EMAIL: ['email', 'password', 'email-password'],
    OAUTH: ['google', 'github', 'azure', 'apple', 'facebook'],
} as const

const ALL_VALID_METHODS = [...AUTH_METHOD_KEYWORDS.EMAIL, ...AUTH_METHOD_KEYWORDS.OAUTH]

// Parse auth methods from VITE_AUTH_METHODS (e.g., "email,google,github")
const parseAuthMethods = () => {
    const methods = import.meta.env.VITE_AUTH_METHODS
    if (!methods) return { emailPassword: true, oauthProviders: [] as OAuthProvider[] }
    
    const methodList = methods.split(',').map((m: string) => m.trim().toLowerCase())
    
    // Validate and warn about invalid methods
    const invalidMethods = methodList.filter(m => !ALL_VALID_METHODS.includes(m))
    if (invalidMethods.length > 0) {
        console.warn(
            `[Auth Config] Invalid auth methods detected: ${invalidMethods.join(', ')}\n` +
            `Valid methods: ${ALL_VALID_METHODS.join(', ')}`
        )
    }
    
    const emailPassword = methodList.some(m => AUTH_METHOD_KEYWORDS.EMAIL.includes(m as any))
    const oauthProviders = methodList.filter((m: string) => 
        AUTH_METHOD_KEYWORDS.OAUTH.includes(m as any)
    ) as OAuthProvider[]
    
    return { emailPassword, oauthProviders }
}

const parsedMethods = parseAuthMethods()

export const authConfig = {
    // Provider type (defaults to supabase)
    provider: (import.meta.env.VITE_AUTH_PROVIDER || 'supabase') as AuthProviderType,
    
    // Provider credentials (required for auth to be enabled)
    url: import.meta.env.VITE_AUTH_URL,
    key: import.meta.env.VITE_AUTH_KEY,
    
    // OAuth providers from parsed methods
    oauthProviders: parsedMethods.oauthProviders,
    
    // Auth methods configuration
    methods: {
        emailPassword: parsedMethods.emailPassword,
        oauth: parsedMethods.oauthProviders.length > 0,
    },
}

/**
 * Helper to check if auth is fully configured and enabled
 * Auth is enabled when both URL and key are provided
 */
export const isAuthEnabled = !!authConfig.url && !!authConfig.key

/**
 * Helper to check if any auth method is enabled
 */
export const hasAnyAuthMethod = authConfig.methods.emailPassword || authConfig.methods.oauth

/**
 * Helper to check if a specific OAuth provider is enabled
 */
export const isOAuthProviderEnabled = (provider: OAuthProvider): boolean => {
    return authConfig.methods.oauth && authConfig.oauthProviders.includes(provider)
}

// ============================================
// Auth Provider Client
// ============================================

/**
 * Initialize the auth client based on provider type
 * Currently supports Supabase, but can be extended for other providers
 */
const initAuthClient = () => {
    if (!isAuthEnabled) return null
    
    switch (authConfig.provider) {
        case 'supabase':
            return createClient(authConfig.url!, authConfig.key!)
        
        case 'custom':
            // TODO: Implement custom auth provider
            // return createCustomAuthClient(authConfig)
            throw new Error('Custom auth provider not yet implemented')
        
        default:
            throw new Error(`Unknown auth provider: ${authConfig.provider}`)
    }
}

export const authClient = initAuthClient()

// ============================================
// Session Context
// ============================================

interface SessionContextType {
    session: Session | null
    loading: boolean
    isAuthenticated: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export const useSession = () => {
    const context = useContext(SessionContext)
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider')
    }
    return context
}

interface SessionProviderProps {
    children: React.ReactNode
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // If auth is disabled, set empty session and mark as not loading
        if (!isAuthEnabled) {
            setSession(null)
            setLoading(false)
            return
        }

        // authClient is null when auth is disabled (checked above)
        if (!authClient) {
            setSession(null)
            setLoading(false)
            return
        }

        // Get initial session
        authClient.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = authClient.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const isAuthenticated = !!session?.access_token

    return (
        <SessionContext.Provider value={{ session, loading, isAuthenticated }}>
            {children}
        </SessionContext.Provider>
    )
}

// ============================================
// Auth Actions Hook
// ============================================

export const useAuth = () => {
    const signInWithPassword = async (email: string, password: string) => {
        if (!authClient) {
            throw new Error('Auth is not enabled')
        }
        if (!authConfig.methods.emailPassword) {
            throw new Error('Email/password authentication is disabled')
        }
        return authClient.auth.signInWithPassword({ email, password })
    }

    const signInWithOAuth = async (provider: OAuthProvider) => {
        if (!authClient) {
            throw new Error('Auth is not enabled')
        }
        if (!authConfig.methods.oauth) {
            throw new Error('OAuth authentication is disabled')
        }
        if (!isOAuthProviderEnabled(provider)) {
            throw new Error(`OAuth provider '${provider}' is not enabled`)
        }
        return authClient.auth.signInWithOAuth({
            provider: provider as any,
            options: {
                redirectTo: window.location.origin,
            },
        })
    }

    const signUp = async (email: string, password: string) => {
        if (!authClient) {
            throw new Error('Auth is not enabled')
        }
        if (!authConfig.methods.emailPassword) {
            throw new Error('Email/password authentication is disabled')
        }
        return authClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
            },
        })
    }

    const resetPasswordForEmail = async (email: string) => {
        if (!authClient) {
            throw new Error('Auth is not enabled')
        }
        if (!authConfig.methods.emailPassword) {
            throw new Error('Email/password authentication is disabled')
        }
        return authClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })
    }

    const updatePassword = async (password: string) => {
        if (!authClient) {
            throw new Error('Auth is not enabled')
        }
        if (!authConfig.methods.emailPassword) {
            throw new Error('Email/password authentication is disabled')
        }
        return authClient.auth.updateUser({ password })
    }

    const signOut = async () => {
        if (!authClient) {
            throw new Error('Auth is not enabled')
        }
        return authClient.auth.signOut()
    }

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
    }
}
