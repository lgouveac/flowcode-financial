
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Log authentication state for debugging
    console.log('ProtectedRoute - Auth state:', { user, loading });
  }, [user, loading]);

  if (loading) {
    // Show a loading spinner for a maximum of 3 seconds
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user found, redirecting to login');
    // Redirect to login and remember where the user was trying to go
    return <Navigate to="/auth/login" state={{ from: location }} />;
  }

  console.log('ProtectedRoute - User authenticated, rendering children');
  return <>{children}</>;
}
