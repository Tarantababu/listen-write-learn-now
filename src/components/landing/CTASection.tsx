
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

      {/* Product Hunt badge */}
      <div className="flex justify-center mt-12">
        <a 
          href="https://www.producthunt.com/posts/lwlnow?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-lwlnow" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:scale-105 transition-transform shadow-lg rounded-lg bg-white p-2 border border-gray-200 hover:shadow-xl"
          aria-label="View lwlnow on Product Hunt"
        >
          <img 
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=961139&theme=light&t=1746390894369" 
            alt="lwlnow - Learn languages by listening, typing, and mastering." 
            width="250" 
            height="54" 
            className="rounded"
          />
        </a>
      </div>

      <SampleDictationModal open={sampleModalOpen} onOpenChange={setSampleModalOpen} />
    </section>
  );
}
