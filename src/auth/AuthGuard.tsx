import React from "react";
import { Navigate } from "react-router";
import { useSession } from "./SessionContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * AuthGuard component
 * @param children - The children to be rendered
 * @param requireAuth - Whether the route requires authentication
 * @returns The children if the route requires authentication or the user is logged in, otherwise redirects to the login page
 * @example
 * This will redirect to the login page if the user is not logged in otherwise will render the dashboard
 * <AuthGuard requireAuth>
 *   <Dashboard />
 * </AuthGuard>
 * @example
 * This will redirect to the dashboard home if the user is logged in otherwise will render the login page
 * <AuthGuard>
 *   <Login />
 * </AuthGuard>
 */

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false,
}) => {
  const { session, loading } = useSession();

  if(import.meta.env.VITE_APP_ENABLE_AUTH !== "true"){
    return children;
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8" />
    </div>
  }

  // If route requires auth but user is not logged in, redirect to login
  if (requireAuth && !session) {
    return <Navigate to="/auth/login" replace />;
  }


  // If route does not require auth but user is logged in, redirect to dashboard home
  if (!requireAuth && session) {
    return <Navigate to="/" replace />;
  }

  // If route requires auth but user is logged in, show children
  return children;
};
