/**
 * Auth configuration module
 */

export type OAuthProvider = "google" | "github" | "microsoft";

const ALL_OAUTH_PROVIDERS: OAuthProvider[] = ["google", "github", "microsoft"];

export const authConfig = {
  // Timbal IAM: defaults to true (auth tokens are used for SDK)
  timbalIAM:
    import.meta.env.VITE_AUTH_TIMBAL_IAM !== undefined
      ? import.meta.env.VITE_AUTH_TIMBAL_IAM === "true"
      : true,

  // Authorization: restrict access to a specific org/project
  // When set, only users with access to this project can use the app
  orgId: import.meta.env.VITE_TIMBAL_ORG_ID as string | undefined,
  projectId: import.meta.env.VITE_TIMBAL_PROJECT_ID as string | undefined,

  oauthProviders: ALL_OAUTH_PROVIDERS,
  methods: {
    magicLink: true,
    oauth: true,
  },
};

/**
 * Auth is enabled when VITE_AUTH_ENABLED is "true" or when any auth method is configured
 */
export const isAuthEnabled =
  import.meta.env.VITE_AUTH_ENABLED === "true" ||
  authConfig.methods.oauth ||
  authConfig.methods.magicLink;

export const hasAnyAuthMethod =
  authConfig.methods.magicLink || authConfig.methods.oauth;

export const isOAuthProviderEnabled = (provider: OAuthProvider): boolean => {
  return (
    authConfig.methods.oauth && authConfig.oauthProviders.includes(provider)
  );
};
