
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { SampleDictationModal } from './SampleDictationModal';

export function CTASection() {
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  
  const handleOpenSample = () => {
    setSampleModalOpen(true);
  };
  
  return (
    <section id="cta" className="py-20 bg-primary/5">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Start Practicing Smarter Today</h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-lg">Just sign-up and start dictating.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="rounded-xl px-6">
              <Link to="/signup">
                <span className="text-nowrap">Get Started Now</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-xl px-6" 
              onClick={handleOpenSample}
            >
              <span className="text-nowrap">Try a Sample</span>
            </Button>
          </div>
        </div>
      </div>

      <SampleDictationModal open={sampleModalOpen} onOpenChange={setSampleModalOpen} />
    </section>
  );
}
