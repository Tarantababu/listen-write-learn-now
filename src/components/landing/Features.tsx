
import React from 'react';
import { Link } from 'react-router-dom';
import { SampleDictationModal } from './SampleDictationModal';
import { Check } from 'lucide-react';
import { AnimatedGroup } from '@/components/ui/animated-group';

const transitionVariants = {
  container: {
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3,
      },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(8px)',
      y: 24,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export function Features() {
  return (
    <section id="features" className="relative py-24 overflow-hidden bg-gradient-to-b from-background to-background/80">
      <div className="container relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground">
            A simple but powerful method that trains multiple skills at once
          </p>
        </div>

        <div className="mt-16">
          <AnimatedGroup
            variants={transitionVariants}
            className="mx-auto max-w-3xl">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">Listen, Write, Learn</h3>
              <p className="text-lg text-muted-foreground">
                Our dictation method combines listening practice with writing, reinforcing both skills simultaneously and creating stronger neural connections.
              </p>
            </div>

            <ul className="space-y-6 mt-10">
              <li className="flex gap-4">
                <Check className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Improved Listening Comprehension</p>
                  <p className="text-muted-foreground mt-1">
                    Train your ears to pick up natural speech patterns, accents and intonation.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Check className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Enhanced Spelling & Grammar</p>
                  <p className="text-muted-foreground mt-1">
                    Develop correct spelling habits and grammatical intuition through repeated practice.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Check className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Expanded Vocabulary</p>
                  <p className="text-muted-foreground mt-1">
                    Learn new words in context, making them easier to remember and use in conversation.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Check className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Real-Time Feedback</p>
                  <p className="text-muted-foreground mt-1">
                    Get immediate corrections and accuracy scores to track your improvement over time.
                  </p>
                </div>
              </li>
            </ul>

            <div className="pt-6">
              <Link 
                to="/signup" 
                className="inline-flex items-center text-lg font-semibold text-primary hover:text-primary/80 transition-colors">
                Start practicing
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>

            {/* --- ADD UPDATED FRAZIER BADGE HERE --- */}
            <div className="flex justify-center mt-8">
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
            {/* ---------------------- */}
          </AnimatedGroup>
          
          {/* Hidden for now as per design */}
          <div className="hidden">
            <SampleDictationModal embedded={true} open={false} onOpenChange={() => {}} />
          </div>
        </div>
      </div>
    </section>
  );
}
