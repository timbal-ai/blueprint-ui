import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth, type OAuthProvider } from "../provider";

// ============================================
// Constants
// ============================================

const LAST_PROVIDER_KEY = "timbal_last_auth_provider";

const ERROR_MESSAGES: Record<string, string> = {
  no_access: "You do not have access to this resource",
  auth_failed: "Authentication failed",
  access_denied: "Access was denied",
};

// ============================================
// OAuth provider icons (colored, matching HTML)
// ============================================

const GOOGLE_ICON = (
  <svg className="w-[1.1rem] h-[1.1rem]" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

const MICROSOFT_ICON = (
  <svg className="w-[1.1rem] h-[1.1rem]" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
    <path fill="#f25022" d="M1 1H10V10H1z" />
    <path fill="#7fba00" d="M12 1H21V10H12z" />
    <path fill="#00a4ef" d="M1 12H10V21H1z" />
    <path fill="#ffb900" d="M12 12H21V21H12z" />
  </svg>
);

const GITHUB_ICON = (
  <svg className="w-[1.1rem] h-[1.1rem]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="currentColor"
      d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
    />
  </svg>
);

const PROVIDERS: { id: OAuthProvider; label: string; icon: React.ReactNode }[] = [
  { id: "google", label: "Google", icon: GOOGLE_ICON },
  { id: "microsoft", label: "Microsoft", icon: MICROSOFT_ICON },
  { id: "github", label: "GitHub", icon: GITHUB_ICON },
];

// ============================================
// Badge component
// ============================================

const LastBadge = () => (
  <span className="absolute -top-2 -right-2 text-[0.6rem] font-bold uppercase tracking-wide bg-green-950 text-green-400 border border-black px-2 py-0.5 rounded-full z-10 shadow-md pointer-events-none">
    Last
  </span>
);

// ============================================
// AuthCard
// ============================================

const AuthCard = () => {
  const [searchParams] = useSearchParams();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const lastProvider = useRef(localStorage.getItem(LAST_PROVIDER_KEY));

  const urlError = searchParams.get("error");

  // Show URL error
  useEffect(() => {
    if (urlError && ERROR_MESSAGES[urlError]) {
      setError(ERROR_MESSAGES[urlError]);
    }
  }, [urlError]);

  const handleOAuth = (provider: OAuthProvider) => {
    localStorage.setItem(LAST_PROVIDER_KEY, provider);
    auth.loginWithOAuth(provider);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);

    try {
      await auth.sendMagicLink(email);
      setMagicLinkSent(true);
      localStorage.setItem(LAST_PROVIDER_KEY, "email");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const enabledProviders = PROVIDERS.filter((p) => auth.isOAuthProviderEnabled(p.id));
  const showDivider = enabledProviders.length > 0 && auth.config.methods.magicLink;

  return (
    <div className="auth-card w-full max-w-[400px] bg-black border border-zinc-800 rounded-xl p-10 flex flex-col gap-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_40px_-12px_rgba(0,0,0,1)]">
      {/* Header */}
      <div>
        <h1 className="text-[1.75rem] font-normal tracking-[-0.01em] text-[#ededed] mb-2">
          Get started
        </h1>
        <p className="text-[0.95rem] text-zinc-300 leading-[1.5]">
          Login or create account via OAuth or Email
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl text-sm text-center p-3 bg-red-950/40 border border-red-900 text-red-300">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full">
        {/* OAuth buttons */}
        {enabledProviders.map((p) => (
          <button
            key={p.id}
            onClick={() => handleOAuth(p.id)}
            className="relative inline-flex items-center justify-center gap-2.5 w-full h-11 px-4 text-sm font-medium rounded-lg border border-zinc-800 text-zinc-100 bg-transparent transition-all hover:bg-zinc-900 hover:border-zinc-700"
            style={lastProvider.current === p.id ? { borderColor: "#14532d" } : undefined}
          >
            {lastProvider.current === p.id && <LastBadge />}
            {p.icon}
            {p.label}
          </button>
        ))}

        {/* Divider */}
        {showDivider && (
          <div className="relative text-center text-xs text-zinc-600 my-5">
            <div className="absolute top-1/2 left-0 w-full h-px bg-zinc-800" />
            <span className="relative bg-black px-3 uppercase font-semibold">
              or continue with
            </span>
          </div>
        )}

        {/* Magic link */}
        {auth.config.methods.magicLink && (
          <>
            {magicLinkSent ? (
              <div className="rounded-xl text-sm text-center p-3 bg-blue-950/40 border border-blue-900 text-blue-300">
                Check your inbox. We've sent you a secure sign-in link.
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="flex flex-col gap-2">
                <label htmlFor="email" className="text-[0.8rem] font-medium text-zinc-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-zinc-800 bg-[#0f0f0f] px-4 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600 focus:bg-black disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="relative inline-flex items-center justify-center gap-2.5 w-full h-11 px-4 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-900 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={lastProvider.current === "email" ? { borderColor: "#14532d" } : undefined}
                >
                  {lastProvider.current === "email" && <LastBadge />}
                  {loading ? "Sending..." : "Login with Email"}
                </button>
              </form>
            )}
          </>
        )}

        {/* Terms */}
        <p className="text-[0.7rem] text-zinc-500 leading-snug text-center mt-1">
          By using Timbal, you accept the{" "}
          <a
            href="https://app.timbal.ai/legal/terms-use/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 no-underline border-b border-zinc-700 transition-colors hover:text-zinc-400 hover:border-zinc-600"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="https://app.timbal.ai/legal/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 no-underline border-b border-zinc-700 transition-colors hover:text-zinc-400 hover:border-zinc-600"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthCard;
