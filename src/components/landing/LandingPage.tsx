
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
        {/* Updated Frazier badge */}
        <a
          href="https://fazier.com/launches/lwlnow-master-any-language-3x-faster"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2"
        >
          <img
            src="https://fazier.com/api/v1/public/badges/embed_image.svg?launch_id=4638&badge_type=daily&theme=light"
            width="270"
            alt="Fazier badge"
            style={{ display: 'block' }}
          />
        </a>
      </div>
      <main className="flex-grow">
        <Hero />
        <VideoExplanation />
      </main>
      <Footer />
    </div>
  );
}
