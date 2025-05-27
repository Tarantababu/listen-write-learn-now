
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/landing/LandingPage';
import SEO from '@/components/SEO';

const Index: React.FC = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect to the dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <SEO
        title="lwlnow - Master Languages with Dictation-Based Learning"
        description="Learn languages through dictation, repetition, and deep understanding — not memorization. Start your language learning journey with our unique dictation-based approach."
        keywords="language learning, dictation learning, foreign language practice, vocabulary building, audio learning, language skills, education, online learning"
        url="https://lwlnow.com/"
      />
      <LandingPage />
    </>
  );
};

export default Index;
