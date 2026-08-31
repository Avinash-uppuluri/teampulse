import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Restricts a route to specific roles. The backend re-verifies the
 * role on every API call — this is a UX guard only, not the source
 * of truth for authorization.
 */
export default function RoleRoute({ allowed = [] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
