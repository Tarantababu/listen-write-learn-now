
import React, { useEffect } from 'react';
import { LandingHeader } from './LandingHeader';
import { Hero } from './Hero';
import { VideoExplanation } from './VideoExplanation';
import { Footer } from './Footer';
import { PromotionalBanner } from '@/components/PromotionalBanner';
import { trackPageView } from '@/utils/visitorTracking';

export function LandingPage() {
  useEffect(() => {
    // Track landing page view when component mounts
    trackPageView('landing_page');
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LandingHeader />
      <div className="container mx-auto px-4 py-2 flex flex-col items-center gap-4">
        <PromotionalBanner />
        {/* Removed Frazier badge from here as per user request */}
      </div>
      <main className="flex-grow">
        <Hero />
        <VideoExplanation />
      </main>
      <Footer />
    </div>
  );
}
