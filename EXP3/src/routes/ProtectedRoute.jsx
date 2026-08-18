import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

/**
 * Guards a route by authentication and, optionally, by role.
 * - Not logged in            -> redirect to /login
 * - Logged in, wrong role    -> redirect to /unauthorized
 * - Logged in, allowed role  -> render children
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
