
import React from 'react';
import { LandingHeader } from './LandingHeader';
import { Hero } from './Hero';
import { Features } from './Features';
import { AudienceSection } from './AudienceSection';
import { CTASection } from './CTASection';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow">
        <Hero />
        <Features />
        <AudienceSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
