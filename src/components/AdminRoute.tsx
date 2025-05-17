
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/use-admin';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, loading } = useAdmin();
  const location = useLocation();

  // While checking admin status, show nothing (could add a loading spinner here)
  if (loading) return null;

  // If not admin, redirect to home with an access denied message
  if (!isAdmin) {
    return <Navigate to="/" state={{ accessDenied: true, message: "You need administrator access" }} />;
  }

  // If admin, render the protected content
  return <>{children}</>;
};

export default AdminRoute;
