/**
 * Auth configuration module
 */

export type OAuthProvider = "google" | "github" | "microsoft";

const OAUTH_KEYWORDS = ["google", "github", "microsoft"] as const;
const MAGIC_LINK_KEYWORDS = ["magic-link", "magiclink", "magic_link"] as const;

const parseAuthMethods = () => {
  const methods = import.meta.env.VITE_AUTH_METHODS;
  if (!methods)
    return {
      magicLink: true,
      oauthProviders: ["google", "github", "microsoft"] as OAuthProvider[],
    };

  const methodList = methods
    .split(",")
    .map((m: string) => m.trim().toLowerCase());

  const magicLink = methodList.some((m: string) =>
    (MAGIC_LINK_KEYWORDS as readonly string[]).includes(m),
  );
  const oauthProviders = methodList.filter((m: string) =>
    (OAUTH_KEYWORDS as readonly string[]).includes(m),
  ) as OAuthProvider[];

  return { magicLink, oauthProviders };
};

const parsedMethods = parseAuthMethods();

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

  oauthProviders: parsedMethods.oauthProviders,
  methods: {
    magicLink: parsedMethods.magicLink,
    oauth: parsedMethods.oauthProviders.length > 0,
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
