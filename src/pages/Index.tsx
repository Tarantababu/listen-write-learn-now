
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HeroSectionDemo } from '@/components/landing/HeroSectionDemo';
import { Features } from '@/components/landing/Features';
import { AudienceSection } from '@/components/landing/AudienceSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

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
      <HeroSectionDemo />
      <Features />
      <AudienceSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
