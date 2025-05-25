import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Globe, Play } from 'lucide-react';
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

// Sketchy Arrow Component for "Get Started" button
const SketchyArrowGetStarted = () => (
  <div className="absolute -top-12 -left-4 hidden lg:block">
    <svg
      width="80"
      height="50"
      viewBox="0 0 80 50"
      fill="none"
      className="text-brand-primary/60"
      style={{ 
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        animation: 'sketchy-draw 3s ease-in-out infinite alternate'
      }}
    >
      {/* Main curved arrow line pointing to Get Started button */}
      <path
        d="M10 15c8 5 15 8 22 12 6 3 12 6 16 10"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2,3"
        style={{ 
          strokeDashoffset: 0,
          animation: 'dash 4s linear infinite'
        }}
      />
      
      {/* Arrow head pointing toward button */}
      <path
        d="M45 35c2-1 3-2 5-2 1 0 2 1 2 2-1 1-2 2-4 2-1 0-2-1-3-2z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M48 38c-1-2-1-3-2-5 0-1 1-2 2-1 1 1 1 3 1 4 0 1-1 2-1 2z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
    
    {/* Handwritten-style text */}
    <div className="absolute top-1 left-1 transform -rotate-12">
      <span className="text-xs text-brand-primary/70 font-handwriting italic whitespace-nowrap">
        Best choice!
      </span>
    </div>
  </div>
);

// Sketchy Arrow Component for "Try a Demo" button
const SketchyArrowDemo = () => (
  <div className="absolute -top-12 -right-4 hidden lg:block">
    <svg
      width="80"
      height="50"
      viewBox="0 0 80 50"
      fill="none"
      className="text-brand-primary/60"
      style={{ 
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        animation: 'sketchy-draw 3s ease-in-out infinite alternate'
      }}
    >
      {/* Main curved arrow line pointing to Try Demo button */}
      <path
        d="M70 15c-8 5-15 8-22 12-6 3-12 6-16 10"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2,3"
        style={{ 
          strokeDashoffset: 0,
          animation: 'dash 4s linear infinite'
        }}
      />
      
      {/* Arrow head pointing toward button */}
      <path
        d="M35 35c-2-1-3-2-5-2-1 0-2 1-2 2 1 1 2 2 4 2 1 0 2-1 3-2z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M32 38c1-2 1-3 2-5 0-1-1-2-2-1-1 1-1 3-1 4 0 1 1 2 1 2z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
    
    {/* Handwritten-style text */}
    <div className="absolute top-1 right-1 transform rotate-12">
      <span className="text-xs text-brand-primary/70 font-handwriting italic whitespace-nowrap">
        Start here!
      </span>
    </div>
  </div>
);

export function Hero() {
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const handleOpenSample = () => {
    setSampleModalOpen(true);
  };
  return <>
      <section className="pt-24 pb-20 md:pt-36 relative overflow-hidden bg-gradient-to-br from-white to-brand-light/10">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              <AnimatedGroup variants={transitionVariants}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-brand-dark mb-4">
                  Master Languages Through <span className="text-brand-primary">Dictation</span>
                </h1>
                
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
                
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 relative">
                  <div className="relative">
                    <Button size="lg" className="bg-brand-primary hover:bg-brand-secondary rounded-full px-6">
                      <Link to="/language-selection" className="flex items-center gap-2">
                        Get Started Free
                        <ArrowRight size={18} />
                      </Link>
                    </Button>
                    {/* Sketchy Arrow pointing to Get Started button */}
                    <SketchyArrowGetStarted />
                  </div>
                  
                  <div className="relative">
                    <Button variant="outline" size="lg" className="rounded-full px-6 border-brand-primary text-brand-primary" onClick={handleOpenSample}>
                      <Play size={18} className="mr-2" /> Try a Demo
                    </Button>
                    {/* Sketchy Arrow pointing to Try a Demo button */}
                    <SketchyArrowDemo />
                  </div>
                </div>
                
                {/* Product Hunt badge */}
                <div className="mt-10 flex justify-center lg:justify-start">
                  <a href="https://www.producthunt.com/posts/lwlnow?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-lwlnow" target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform shadow-lg rounded-lg bg-white p-2 border border-gray-200 hover:shadow-xl">
                    <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=961139&theme=light&t=1746390894369" alt="lwlnow - Learn languages by listening, typing, and mastering." width="250" height="54" className="rounded" />
                  </a>
                </div>
              </AnimatedGroup>
            </div>

            {/* Right Column - Hero Image */}
            <div className="flex justify-center lg:justify-end">
              <AnimatedGroup variants={transitionVariants}>
                <div className="max-w-md w-full">
                  <img 
                    src="/lovable-uploads/e1e8d5b6-2bcd-4fe7-bf0f-1090e33675da.png" 
                    alt="Language learning through dictation - illustration of person with headphones practicing on laptop"
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
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-brand-primary hover:bg-brand-secondary rounded-full px-6">
                <Link to="/language-selection" className="flex items-center gap-2">
                  Start Learning Now
                  <ArrowRight size={18} />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" className="rounded-full px-6 border-brand-primary text-brand-primary" onClick={handleOpenSample}>
                <Play size={18} className="mr-2" /> Try a Sample Exercise
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sample dictation modal */}
      <SampleDictationModal open={sampleModalOpen} onOpenChange={setSampleModalOpen} />
    </>;
}