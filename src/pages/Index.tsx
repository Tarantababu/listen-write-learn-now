
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/landing/LandingPage';
import { Helmet } from 'react-helmet-async';

const Index: React.FC = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect to the dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>lwlnow - Master Languages with Dictation-Based Learning</title>
        <meta name="description" content="Improve your language skills through dictation, repetition, and deep understanding. A unique approach to language learning focused on listening and writing." />
        <meta name="keywords" content="language learning, dictation, language skills, vocabulary, audio learning, language practice" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://lwlnow.com/" />
        <meta property="og:title" content="lwlnow - Master Languages with Dictation-Based Learning" />
        <meta property="og:description" content="Learn languages through dictation, repetition, and deep understanding — not memorization." />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="lwlnow - Master Languages with Dictation-Based Learning" />
        <meta name="twitter:description" content="Learn languages through dictation, repetition, and deep understanding — not memorization." />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://lwlnow.com/" />
      </Helmet>
      <LandingPage />
    </>
  );
};

export default Index;
