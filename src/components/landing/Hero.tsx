import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Globe, Play, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { SampleDictationModal } from './SampleDictationModal';
import { FlagIcon, FlagIconCode } from "react-flag-kit";
import { useGTM } from '@/hooks/use-gtm';

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(8px)',
      y: 20
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.2,
        duration: 0.8
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

const features = [
  "Focused Dictation Practice", 
  "Bidirectional Translation", 
  "Growing Exercise Library", 
  "Word-Level Accuracy", 
  "Progress Tracking", 
  "Vocabulary Building"
];

const steps = [{
  number: 1,
  title: "Choose an exercise",
  description: "Select from our curated exercises for your level."
}, {
  number: 2,
  title: "Listen and write",
  description: "Listen to native speakers and write what you hear."
}, {
  number: 3,
  title: "Compare and learn",
  description: "Get immediate feedback and see improvements."
}, {
  number: 4,
  title: "Track progress",
  description: "Build skills and watch comprehension improve."
}];

export function Hero() {
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { trackCTAClick, trackFeatureUsed } = useGTM();

  const handleOpenSample = () => {
    setSampleModalOpen(true);
    trackFeatureUsed({
      feature_name: 'sample_dictation_modal',
      feature_category: 'other'
    });
  };

  const handleStartFreeClick = () => {
    trackCTAClick({
      cta_type: 'signup',
      cta_location: 'hero_section',
      cta_text: 'Start Free Today'
    });
  };

  const handleStartLearningClick = () => {
    trackCTAClick({
      cta_type: 'signup',
      cta_location: 'cta_section',
      cta_text: 'Start Learning Now'
    });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return <>
    {/* Hero Section */}
    <section className="pt-16 pb-24 md:pt-20 md:pb-32 bg-white relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 pointer-events-none"></div>
      
      <div className="container px-6 md:px-8 lg:px-12 mx-auto relative z-10 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <AnimatedGroup variants={transitionVariants}>
              <div className="space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  Proven Learning Method
                </div>

                {/* Main Heading */}
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none">
                    <span className="text-slate-900">Master Any</span>
                    <br />
                    <span className="text-slate-900">Language</span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      3X Faster
                    </span>
                  </h1>
                  <p className="text-xl text-slate-600 font-medium">
                    From Beginner to Fluent in Months, Not Years
                  </p>
                </div>

                {/* Description */}
                <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
                  Train your ear, sharpen your memory, and improve your writing—all in one immersive experience.
                </p>

                {/* Language Chips */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  {languages.slice(0, 5).map((lang, i) => (
                    <div key={`${lang.flag}-${i}`} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all duration-200 group">
                      <FlagIcon code={lang.flag} size={16} />
                      <span className="text-sm font-medium text-slate-700">{lang.name}</span>
                      <span className="text-xs text-slate-400 ml-1">{lang.level}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-xl">
                    <Globe size={16} />
                    <span className="text-sm font-medium">+5 more</span>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  <Button 
                    size="lg" 
                    className="group bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                    onClick={handleStartFreeClick}
                    data-gtm-cta-type="signup"
                    data-gtm-cta-location="hero_section"
                    data-gtm-cta-text="Start Free Today"
                  >
                    <Link to="/language-selection" className="flex items-center gap-3">
                      Start Free Today
                      <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            </AnimatedGroup>
          </div>

          {/* Right Column - Demo */}
          <div className="flex justify-center lg:justify-end">
            <AnimatedGroup variants={transitionVariants}>
              <div className="relative max-w-md w-full">
                {/* Main demo container */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
                  {!imageError ? (
                    <div className="relative overflow-hidden rounded-xl bg-slate-50">
                      <img 
                        src="./demo.gif" 
                        alt="Language learning demonstration" 
                        className="w-full h-auto rounded-xl transition-transform duration-300 hover:scale-102"
                        onError={handleImageError}
                      />
                    </div>
                  ) : (
                    /* Interactive demo mockup */
                    <div className="space-y-4">
                      {/* Audio player */}
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Volume2 size={16} className="text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">Listen</span>
                        </div>
                        <div className="bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-600 h-full w-3/4 rounded-full"></div>
                        </div>
                      </div>

                      {/* Typing interface */}
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="text-sm text-slate-600 mb-2">Type what you hear:</div>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 bg-white min-h-[50px] flex items-center">
                          <span className="text-slate-400">The weather is beautiful...</span>
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <div className="flex items-center gap-2">
                          <Check size={16} className="text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-800">95% accuracy</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating stats - simplified */}
                <div className="absolute -top-3 -left-3 bg-white border border-slate-200 rounded-xl p-3 shadow-md">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">10K+</div>
                    <div className="text-xs text-slate-500">Learners</div>
                  </div>
                </div>

                <div className="absolute -bottom-3 -right-3 bg-white border border-slate-200 rounded-xl p-3 shadow-md">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">4.9★</div>
                    <div className="text-xs text-slate-500">Rating</div>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </div>

        {/* Social Proof - Simplified */}
        <div className="mt-20">
          <AnimatedGroup variants={transitionVariants}>
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-8">Featured on</p>
              <div className="flex justify-center gap-8 flex-wrap opacity-60 hover:opacity-100 transition-opacity">
                <a 
                  href="https://www.producthunt.com/posts/lwlnow?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-lwlnow" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:scale-105 transition-transform"
                >
                  <img 
                    src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=961139&theme=light&t=1746390894369" 
                    alt="lwlnow - Learn languages by listening, typing, and mastering." 
                    width="150" 
                    height="32" 
                    className="rounded" 
                  />
                </a>
                
                <a 
                  href="https://fazier.com/launches/www.lwlnow.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform"
                >
                  <img 
                    src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=light" 
                    width="150" 
                    alt="Fazier badge" 
                    className="rounded"
                  />
                </a>
              </div>
            </div>
          </AnimatedGroup>
        </div>
      </div>
    </section>

    {/* Features - Minimalist Grid */}
    <section className="py-20 bg-slate-50">
      <div className="container px-6 md:px-8 lg:px-12 mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Our Approach
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Scientifically designed features that accelerate learning
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="text-center group">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
                <div className="w-8 h-8 bg-slate-100 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                </div>
                <p className="font-medium text-slate-900 text-sm">{feature}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* How it works - Clean Timeline */}
    <section className="py-20 bg-white">
      <div className="container px-6 md:px-8 lg:px-12 mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-600">
            Simple steps, powerful results
          </p>
        </div>
        
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 items-start group">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">
                {step.number}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Benefits - Clean Cards */}
    <section className="py-20 bg-slate-50">
      <div className="container px-6 md:px-8 lg:px-12 mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Why It Works
          </h2>
          <p className="text-lg text-slate-600">
            Science-backed benefits of our method
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: "Improves Listening",
              description: "Train your ears to recognize natural speech patterns"
            },
            {
              title: "Strengthens Writing", 
              description: "Master spelling and grammar through practice"
            },
            {
              title: "Builds Vocabulary",
              description: "Learn words naturally in proper context"
            },
            {
              title: "Creates Connections",
              description: "Engage multiple learning pathways for retention"
            }
          ].map((benefit, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA - Clean and Bold */}
    <section className="py-20 bg-slate-900 text-white">
      <div className="container px-6 md:px-8 lg:px-12 mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Transform Your Language Journey?
        </h2>
        <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
          Join thousands of learners who have improved their skills with our proven method.
        </p>
        
        <Button 
          size="lg" 
          className="group bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0"
          onClick={handleStartLearningClick}
          data-gtm-cta-type="signup"
          data-gtm-cta-location="cta_section"
          data-gtm-cta-text="Start Learning Now"
        >
          <Link to="/language-selection" className="flex items-center gap-3">
            Start Learning Now
            <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center gap-6 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <Check size={14} />
            <span>Free to start</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>

    {/* Sample dictation modal */}
    <SampleDictationModal open={sampleModalOpen} onOpenChange={setSampleModalOpen} />
  </>;
}