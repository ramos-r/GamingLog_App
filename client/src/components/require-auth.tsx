import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { loginUrlFor } from "../lib/safe-redirect";

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to={loginUrlFor(location.pathname + location.search)} replace />;
  }

  return <Outlet />;
}
