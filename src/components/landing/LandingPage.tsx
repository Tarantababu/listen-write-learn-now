
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
    
    // Smooth scroll for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.hash && link.hash.startsWith('#')) {
        e.preventDefault();
        const id = link.hash.substring(1);
        const element = document.getElementById(id);
        
        if (element) {
          window.scrollTo({
            top: element.offsetTop - 100,
            behavior: 'smooth'
          });
        }
      }
    };
    
    document.addEventListener('click', handleAnchorClick);
    
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
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
      </main>
      <Footer />
    </div>
  );
}
