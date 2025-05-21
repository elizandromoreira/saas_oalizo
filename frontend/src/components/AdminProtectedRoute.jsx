import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Component that protects admin routes, redirecting to dashboard if not an admin
 */
const AdminProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading, checkAuth } = useContext(AuthContext);

  // If loading, show a loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Check if the user is authenticated
  const isAuth = isAuthenticated && checkAuth();

  // If not authenticated, redirect to login
  if (!isAuth) {
    return <Navigate to="/auth/login" />;
  }

  // If authenticated but not a platform admin, redirect to dashboard
  if (!user.isPlatformAdmin) {
    return <Navigate to="/dashboard" />;
  }

  // If authenticated and is a platform admin, render the protected routes
  return children;
};

export default AdminProtectedRoute;
