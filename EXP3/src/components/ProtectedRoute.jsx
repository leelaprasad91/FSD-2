import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../services/permissions';

export default function ProtectedRoute({ children, permission }) {
  const { accessToken, user } = useAuth();
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(user.role, permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
