
import React from 'react';
import { SentenceMiningSection } from '@/components/sentence-mining/SentenceMiningSection';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';

export const SentenceMiningPage: React.FC = () => {
  return (
    <Layout>
      <SEO 
        title="Sentence Mining - Learn Languages Naturally"
        description="Practice language learning through contextual sentence completion exercises"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Sentence Mining</h1>
            <p className="text-muted-foreground text-lg">
              Learn vocabulary naturally through contextual sentence completion
            </p>
          </div>
          <SentenceMiningSection />
        </div>
      </div>
    </Layout>
  );
};
