
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
    <section id="features" className="py-20 overflow-hidden">
      <div className="container max-w-6xl px-4 md:px-6 mx-auto">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground text-lg">
            A simple but powerful method that trains multiple skills at once
          </p>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <AnimatedGroup
            variants={transitionVariants}
            className="space-y-8 lg:max-w-xl">
            <div>
              <h3 className="text-2xl font-bold">Listen, Write, Learn</h3>
              <p className="mt-2 text-muted-foreground">
                Our dictation method combines listening practice with writing, reinforcing both skills simultaneously and creating stronger neural connections.
              </p>
            </div>

            <ul className="space-y-4">
              <li className="flex gap-3">
                <Check className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Improved Listening Comprehension</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Train your ears to pick up natural speech patterns, accents and intonation.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Check className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Enhanced Spelling & Grammar</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Develop correct spelling habits and grammatical intuition through repeated practice.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Check className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Expanded Vocabulary</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Learn new words in context, making them easier to remember and use in conversation.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Check className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Real-Time Feedback</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get immediate corrections and accuracy scores to track your improvement over time.
                  </p>
                </div>
              </li>
            </ul>

            <div className="pt-4">
              <Link to="/signup" className="text-primary font-medium inline-flex items-center">
                Start practicing
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
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
          </AnimatedGroup>
          
          <AnimatedGroup
            variants={transitionVariants}
            className="lg:max-w-xl mx-auto">
            {/* Embedded sample dictation component */}
            <SampleDictationModal embedded={true} open={false} onOpenChange={() => {}} />
          </AnimatedGroup>
        </div>
      </div>
    </section>
  );
}
