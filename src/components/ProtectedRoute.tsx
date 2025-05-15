
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/use-admin';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  // Add debug logging
  useEffect(() => {
    if (requireAdmin) {
      console.log('Protected route requires admin:', requireAdmin);
      console.log('Current admin status:', isAdmin);
      console.log('Admin loading state:', adminLoading);
      console.log('Current user:', user);
    }
  }, [requireAdmin, isAdmin, adminLoading, user]);

  // Notify user when they're redirected due to authentication
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "default"
      });
    }
  }, [authLoading, user]);

  // Show loading state while checking authentication and admin status
  if (authLoading || (requireAdmin && adminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in at all, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires admin access but user is not admin
  if (requireAdmin && !isAdmin) {
    console.error('Admin access denied. User does not have admin privileges.');
    
    // Redirect to dashboard with access denied message
    return <Navigate to="/dashboard" state={{ 
      accessDenied: true, 
      message: "You don't have permission to access the admin area" 
    }} replace />;
  }

  // If children exist, render them, otherwise render the Outlet
  return <>{children ? children : <Outlet />}</>;
};

export default ProtectedRoute;
