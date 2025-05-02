
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HeroSection } from '@/components/ui/hero-section';

const Index: React.FC = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect to the home page
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <HeroSection />;
};

export default Index;
