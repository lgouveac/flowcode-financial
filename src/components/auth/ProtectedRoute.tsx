
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log authentication state for debugging
    console.log('ProtectedRoute - Auth state:', { user, loading });

    // If not loading and no user, redirect to login
    if (!loading && !user) {
      console.log('ProtectedRoute - No user found, redirecting to login');
      navigate('/auth/login', { state: { from: location }, replace: true });
    }
  }, [user, loading, location, navigate]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login as a fallback
  if (!user) {
    console.log('ProtectedRoute - No user found (fallback), redirecting to login');
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  console.log('ProtectedRoute - User authenticated, rendering children');
  return <>{children}</>;
}
