import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession, AccessDeniedError } from "./provider";
import { clearTokens } from "./tokens";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUserFromCallback } = useSession();
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const processCallback = async () => {
      try {
        const hash = window.location.hash;
        if (!hash) throw new Error("No tokens found in URL");

        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          throw new Error("Missing access_token or refresh_token");
        }

        // Clear hash immediately to prevent token leaking via referrer
        window.history.replaceState(null, "", window.location.pathname);

        await setUserFromCallback(accessToken, refreshToken);
        navigate("/", { replace: true });
      } catch (err: unknown) {
        if (err instanceof AccessDeniedError) {
          clearTokens();
          navigate("/auth/login?error=access_denied", { replace: true });
          return;
        }
        const message =
          err instanceof Error ? err.message : "Authentication failed";
        setError(message);
        setTimeout(() => navigate("/auth/login", { replace: true }), 2000);
      }
    };

    processCallback();
  }, [navigate, setUserFromCallback]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-2">
        <p className="text-destructive text-sm">{error}</p>
        <p className="text-muted-foreground text-xs">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
};

export default AuthCallback;
