/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Auth configuration module
 * Separated to avoid circular dependencies between provider and client
 */

/**
 * Supported OAuth providers
 * Add or remove providers here to control what's available in your app
 */
export type OAuthProvider =
  | "google"
  | "github"
  | "azure"
  | "apple"
  | "facebook";

/**
 * Supported auth provider types
 * Add new providers here (e.g., 'auth0', 'firebase', 'cognito')
 */
export type AuthProviderType = "supabase" | "custom";

// Auth method constants
const AUTH_METHOD_KEYWORDS = {
  EMAIL: ["email", "password", "email-password"],
  OAUTH: ["google", "github", "azure", "apple", "facebook"],
} as const;

const ALL_VALID_METHODS = [
  ...AUTH_METHOD_KEYWORDS.EMAIL,
  ...AUTH_METHOD_KEYWORDS.OAUTH,
];

// Parse auth methods from VITE_AUTH_METHODS (e.g., "email,google,github")
const parseAuthMethods = () => {
  const methods = import.meta.env.VITE_AUTH_METHODS;
  if (!methods)
    return { emailPassword: true, oauthProviders: [] as OAuthProvider[] };

  const methodList = methods
    .split(",")
    .map((m: string) => m.trim().toLowerCase());

  // Validate and warn about invalid methods
  const invalidMethods = methodList.filter(
    (m) => !ALL_VALID_METHODS.includes(m),
  );
  if (invalidMethods.length > 0) {
    console.warn(
      `[Auth Config] Invalid auth methods detected: ${invalidMethods.join(", ")}\n` +
        `Valid methods: ${ALL_VALID_METHODS.join(", ")}`,
    );
  }

  const emailPassword = methodList.some((m) =>
    AUTH_METHOD_KEYWORDS.EMAIL.includes(m as any),
  );
  const oauthProviders = methodList.filter((m: string) =>
    AUTH_METHOD_KEYWORDS.OAUTH.includes(m as any),
  ) as OAuthProvider[];

  return { emailPassword, oauthProviders };
};

const parsedMethods = parseAuthMethods();

/**
 * Auth configuration from environment variables
 *
 * Provider-specific credential mapping:
 * - Supabase: url = project URL, key = anon key
 * - Auth0: url = domain, key = client ID
 * - Firebase: url = auth domain, key = API key
 * - Cognito: url = user pool ID, key = client ID
 */
export const authConfig = {
  // Provider type (defaults to supabase)
  provider: (import.meta.env.VITE_AUTH_PROVIDER ||
    "supabase") as AuthProviderType,

  // Provider credentials (required for auth to be enabled)
  url: import.meta.env.VITE_AUTH_URL,
  key: import.meta.env.VITE_AUTH_KEY,

  // Timbal IAM configuration
  timbalIAM: import.meta.env.VITE_AUTH_TIMBAL_IAM === "true",

  // OAuth providers from parsed methods
  oauthProviders: parsedMethods.oauthProviders,

  // Auth methods configuration
  methods: {
    emailPassword: parsedMethods.emailPassword,
    oauth: parsedMethods.oauthProviders.length > 0,
  },
};

/**
 * Helper to check if auth is fully configured and enabled
 * Auth is enabled when both URL and key are provided
 */
export const isAuthEnabled = !!authConfig.url && !!authConfig.key;

/**
 * Helper to check if any auth method is enabled
 */
export const hasAnyAuthMethod =
  authConfig.methods.emailPassword || authConfig.methods.oauth;

/**
 * Helper to check if a specific OAuth provider is enabled
 */
export const isOAuthProviderEnabled = (provider: OAuthProvider): boolean => {
  return (
    authConfig.methods.oauth && authConfig.oauthProviders.includes(provider)
  );
};
