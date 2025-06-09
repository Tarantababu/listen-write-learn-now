
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { SampleDictationModal } from './SampleDictationModal';
import { FlagIcon, FlagIconCode } from "react-flag-kit";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5
      }
    }
  }
};

const languages = [{
  name: 'English',
  flag: 'US' as FlagIconCode,
  level: 'C1'
}, {
  name: 'German',
  flag: 'DE' as FlagIconCode,
  level: 'B2'
}, {
  name: 'Spanish',
  flag: 'ES' as FlagIconCode,
  level: 'B1'
}, {
  name: 'French',
  flag: 'FR' as FlagIconCode,
  level: 'A2'
}, {
  name: 'Italian',
  flag: 'IT' as FlagIconCode,
  level: 'A1'
}, {
  name: 'Portuguese',
  flag: 'PT' as FlagIconCode,
  level: 'B1'
}, {
  name: 'Dutch',
  flag: 'NL' as FlagIconCode,
  level: 'A2'
}, {
  name: 'Turkish',
  flag: 'TR' as FlagIconCode,
  level: 'B1'
}, {
  name: 'Swedish',
  flag: 'SE' as FlagIconCode,
  level: 'A1'
}];

const features = ["🎯 Focused Dictation Practice", "🧠 Deep Learning Method", "📚 Growing Exercise Library", "🔍 Word-Level Accuracy Feedback", "📊 Progress Tracking", "📝 Vocabulary Building"];
const steps = [{
  number: 1,
  title: "Choose an exercise",
  description: "Select from our library of carefully curated exercises for your level."
}, {
  number: 2,
  title: "Listen and write",
  description: "Listen to native speakers and write what you hear, one phrase at a time."
}, {
  number: 3,
  title: "Compare and learn",
  description: "Get immediate word-by-word feedback and see where you need improvement."
}, {
  number: 4,
  title: "Track your progress",
  description: "Build your skills with each session and watch your comprehension improve."
}];

export function Hero() {
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const handleOpenSample = () => {
    setSampleModalOpen(true);
  };
  return <>
      <section className="pt-8 pb-20 md:pt-12 relative overflow-hidden bg-gradient-to-br from-white to-brand-light/10">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              <AnimatedGroup variants={transitionVariants}>
                <div className="mb-4">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-brand-dark">
                    Master Any Language <span className="text-brand-primary">3X Faster</span>
                  </h1>
                  <p className="text-lg md:text-xl font-medium text-brand-dark mt-2">
                    From Beginner to Fluent in Months, Not Years
                  </p>
                </div>
                
                <p className="mt-6 text-xl text-muted-foreground max-w-2xl lg:mx-0 mx-auto">
                  Train your ear, sharpen your memory, and improve your writing—all in one immersive experience.
                </p>

                <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
                  {languages.slice(0, 6).map((lang, i) => <div key={`${lang.flag}-${i}`} className="language-chip flex items-center gap-2 bg-white p-2 rounded-full shadow-sm border border-gray-100">
                      <div className="flex-shrink-0">
                        <FlagIcon code={lang.flag} size={24} />
                      </div>
                      <span>{lang.name}</span>
                      
                    </div>)}
                  <div className="language-chip flex items-center gap-2 bg-white p-2 rounded-full shadow-sm border border-gray-100">
                    <Globe size={24} className="text-brand-primary" />
                    <span>+ more</span>
                  </div>
                </div>
                
                <div className="mt-10 flex flex-col items-center justify-center lg:justify-start">
                  <Button size="lg" className="bg-brand-primary hover:bg-brand-secondary rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                    <Link to="/language-selection" className="flex items-center gap-2">
                      Start My Free Trial
                      <ArrowRight size={20} />
                    </Link>
                  </Button>
                </div>
                
                {/* Product Hunt badge */}
                <div className="mt-10 flex justify-center">
                  <a href="https://www.producthunt.com/posts/lwlnow?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-lwlnow" target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform shadow-lg rounded-lg bg-white p-2 border border-gray-200 hover:shadow-xl">
                    <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=961139&theme=light&t=1746390894369" alt="lwlnow - Learn languages by listening, typing, and mastering." width="200" height="43" className="rounded" />
                  </a>
                </div>
              </AnimatedGroup>
            </div>

            {/* Right Column - Hero Image with Arrow */}
            <div className="flex justify-center lg:justify-end relative">
              <AnimatedGroup variants={transitionVariants}>
                <div className="max-w-md w-full relative">
                  {/* Curved Arrow pointing to the image */}
                  <div className="absolute -left-16 top-8 hidden lg:block animate-pulse">
                    <svg 
                      width="80" 
                      height="60" 
                      viewBox="0 0 80 60" 
                      fill="none" 
                      className="text-brand-primary"
                    >
                      <path 
                        d="M10 50 Q40 10 70 30" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path 
                        d="M65 25 L70 30 L65 35" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="text-brand-primary font-semibold text-sm mt-1 ml-2">
                      Try it now!
                    </div>
                  </div>
                  
                  <img 
                    src="https://i.postimg.cc/kMzwjjDG/lwlnow-how-to-exercise-landing.gif" 
                    alt="Language learning through dictation - animated demonstration of the exercise interface"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </AnimatedGroup>
            </div>
          </div>

          {/* Features grid */}
          <div className="mt-24 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-brand-dark">Our Unique Approach</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {features.map((feature, i) => <div key={i} className="feature-card">
                  <p className="text-lg text-center font-normal">{feature}</p>
                </div>)}
            </div>
          </div>

          {/* How it works section */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-brand-dark">How It Works</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {steps.map((step, i) => <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-dark">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground">{step.description}</p>
                  </div>
                </div>)}
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-brand-dark">Why It Works</h2>
            
            <div className="bg-brand-light/5 rounded-xl p-8 border border-brand-light/20">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-lg">Improves Listening Comprehension</p>
                    <p className="text-muted-foreground">Train your ears to recognize natural speech patterns and accents</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-lg">Strengthens Writing Skills</p>
                    <p className="text-muted-foreground">Master spelling, grammar, and sentence structure through practice</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-lg">Builds Vocabulary in Context</p>
                    <p className="text-muted-foreground">Learn new words naturally in proper context, not as isolated flashcards</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-lg">Creates Deeper Neural Connections</p>
                    <p className="text-muted-foreground">Engage multiple learning pathways simultaneously for better retention</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-center mb-6 text-brand-dark">Ready to Transform Your Language Journey?</h2>
            <p className="text-xl text-muted-foreground mb-8">Join thousands of learners who have improved their language skills with our method.</p>
            
            <div className="flex flex-col items-center justify-center">
              <Button size="lg" className="bg-brand-primary hover:bg-brand-secondary rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                <Link to="/language-selection" className="flex items-center gap-2">
                  Start Learning Now
                  <ArrowRight size={20} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sample dictation modal */}
      <SampleDictationModal open={sampleModalOpen} onOpenChange={setSampleModalOpen} />
    </>;
}
