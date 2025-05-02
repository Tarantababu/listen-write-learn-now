
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/landing/LandingPage';

const Index: React.FC = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect to the dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
};

export default Index;
