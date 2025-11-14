import React from "react";
import { Navigate } from "react-router";
import { useSession, isAuthEnabled } from "./provider";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false,
}) => {
  const { isAuthenticated, loading } = useSession();

  // If auth is globally disabled, just render children
  if (!isAuthEnabled) {
    return children;
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // If route requires auth but user is not logged in, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // If route does not require auth but user is logged in, redirect to home
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, show children
  return children;
};
