import { Routes, Route } from "react-router-dom";
import LogIn from "./pages/LogIn";
import AuthCallback from "./AuthCallback";
import NotFound from "@/pages/NotFound";

const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<LogIn />} />
      <Route path="callback" element={<AuthCallback />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AuthRoutes;
