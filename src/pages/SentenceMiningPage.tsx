
import React from 'react';
import { SentenceMiningSection } from '@/components/sentence-mining/SentenceMiningSection';
import SEO from '@/components/SEO';

export const SentenceMiningPage: React.FC = () => {
  return (
    <>
      <SEO 
        title="Smart Sentence Mining - Learn Languages Naturally"
        description="Practice language learning through AI-powered contextual sentence completion exercises"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Smart Sentence Mining
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Learn vocabulary naturally through AI-powered contextual sentence completion
              </p>
            </div>
            <SentenceMiningSection />
          </div>
        </div>
      </div>
    </>
  );
};
