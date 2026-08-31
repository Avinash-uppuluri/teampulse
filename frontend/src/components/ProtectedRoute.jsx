import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingState from "./LoadingState.jsx";

/** Blocks access to any nested route unless the user is authenticated. */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
