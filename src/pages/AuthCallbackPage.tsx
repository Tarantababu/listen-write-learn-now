
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallbackPage: React.FC = () => {
  const { user, loading } = useAuth();

  // Handle the authentication callback from Supabase Auth
  useEffect(() => {
    // The AuthContext will handle the session setup automatically
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Completing authentication...</p>
        </div>
      </div>
    );
  }

  // If the user is authenticated, redirect to the dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If there's an error or no user, redirect to login
  return <Navigate to="/login" replace />;
};

export default AuthCallbackPage;
