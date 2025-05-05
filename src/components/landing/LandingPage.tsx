
import React, { useEffect } from 'react';
import { LandingHeader } from './LandingHeader';
import { Hero } from './Hero';
import { Features } from './Features';
import { VideoExplanation } from './VideoExplanation';
import { AudienceSection } from './AudienceSection';
import { CTASection } from './CTASection';
import { Footer } from './Footer';
import { trackPageView } from '@/utils/visitorTracking';

export function LandingPage() {
  useEffect(() => {
    // Track landing page view when component mounts
    trackPageView('landing_page');
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow">
        <Hero />
        <VideoExplanation />
        <Features />
        <AudienceSection />
        <CTASection />
        
        {/* Product Hunt Badge */}
        <div className="flex justify-center py-12 bg-background">
          <a 
            href="https://www.producthunt.com/posts/lwlnow?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-lwlnow" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="View lwlnow on Product Hunt"
          >
            <img 
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=961139&theme=light&t=1746390894369" 
              alt="lwlnow - Learn languages by listening, typing, and mastering." 
              style={{ width: '250px', height: '54px' }} 
              width="250" 
              height="54" 
            />
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
