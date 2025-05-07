
import React, { useEffect } from 'react';
import { LandingHeader } from './LandingHeader';
import { Hero } from './Hero';
import { Features } from './Features';
import { VideoExplanation } from './VideoExplanation';
import { AudienceSection } from './AudienceSection';
import { CTASection } from './CTASection';
import { Footer } from './Footer';
import { MethodSection } from './MethodSection';
import { HowItWorksSection } from './HowItWorksSection';
import { WhyItWorksSection } from './WhyItWorksSection';
import { ToolsSection } from './ToolsSection';
import { StartNowSection } from './StartNowSection';
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
        <MethodSection />
        <VideoExplanation />
        <HowItWorksSection />
        <WhyItWorksSection />
        <ToolsSection />
        <Features />
        <AudienceSection />
        <StartNowSection />
        <CTASection />
        
        {/* Product Hunt Badge */}
        
      </main>
      <Footer />
    </div>
  );
}
