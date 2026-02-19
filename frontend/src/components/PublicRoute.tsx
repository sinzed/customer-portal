/**
 * Public Route Component
 * 
 * Wraps routes that should only be accessible when not authenticated.
 * Redirects to portal if user is already authenticated.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p>Lade...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/documents" replace />;
  }

  return <>{children}</>;
}
