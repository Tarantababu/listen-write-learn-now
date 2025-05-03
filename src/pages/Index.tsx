
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/landing/LandingPage';

const Index: React.FC = () => {
  const { user } = useAuth();

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // If user is already logged in, redirect to the dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bg-accent-beige/30 min-h-screen">
      <LandingPage />
    </div>
  );
};

export default Index;
