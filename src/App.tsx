import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTitle } from "@/hooks/use-title";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthGuard } from "@/auth/AuthGuard";
import { SessionProvider, isAuthEnabled } from "@/auth/provider";

import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import AuthRoutes from "@/auth/AuthRoutes";

function App() {
  const appTitle = import.meta.env.VITE_APP_TITLE;
  useTitle(appTitle || "");
  return (
    <ThemeProvider
      defaultTheme="system"
      storageKey="timbal-theme"
      attribute="class"
    >
      <SessionProvider>
        <Toaster position="top-right" duration={3000} />
        <BrowserRouter>
          <Routes>
            <Route
              index
              element={
                <AuthGuard requireAuth>
                  <Home />
                </AuthGuard>
              }
            />
            {/* AUTH routes: callback is always accessible, login only when not authenticated */}
            <Route
              path="/auth/*"
              element={
                isAuthEnabled ? <AuthRoutes /> : <Navigate to="/" />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
