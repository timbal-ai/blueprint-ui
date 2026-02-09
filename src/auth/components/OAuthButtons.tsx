import { useAuth, type OAuthProvider } from "../provider";
import { OAuthButton } from "./OAuthButton";

interface OAuthButtonsProps {
  onOAuthClick: (provider: OAuthProvider) => void;
  loading?: boolean;
}

export const OAuthButtons = ({
  onOAuthClick,
  loading = false,
}: OAuthButtonsProps) => {
  const auth = useAuth();

  if (!auth.config.methods.oauth) {
    return null;
  }

  return (
    <div className="space-y-2">
      {auth.config.oauthProviders.map((provider) => (
        <OAuthButton
          key={provider}
          provider={provider}
          onClick={onOAuthClick}
          disabled={loading}
        />
      ))}
    </div>
  );
};
