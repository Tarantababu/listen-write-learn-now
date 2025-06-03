
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
      <main className="flex-grow">
        <div className="container mx-auto px-4">
          <PromotionalBanner />
        </div>
        <Hero />
        <VideoExplanation />
      </main>
      <Footer />
    </div>
  );
}
