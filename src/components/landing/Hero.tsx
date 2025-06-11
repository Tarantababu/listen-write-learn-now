import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { SampleDictationModal } from './SampleDictationModal';
import { FlagIcon, FlagIconCode } from "react-flag-kit";
import { useGTM } from '@/hooks/use-gtm';

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

const features = ["🎯 Focused Dictation Practice", "🧠 Bidirectional Translation", "📚 Growing Exercise Library", "🔍 Word-Level Accuracy Feedback", "📊 Progress Tracking", "📝 Vocabulary Building"];

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

  return <>
    <section className="pt-8 pb-20 md:pt-12 relative overflow-hidden bg-gradient-to-br from-white to-brand-light/10">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            <AnimatedGroup variants={transitionVariants}>
              <div className="mb-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-brand-dark">
                  Master Any Language <span className="text-brand-primary">3X Faster</span>
                </h1>
                <p className="text-lg md:text-xl font-medium text-brand-dark mt-4">
                  From Beginner to Fluent in Months, Not Years
                </p>
              </div>
              
              <p className="mt-6 text-xl text-muted-foreground max-w-2xl lg:mx-0 mx-auto">
                Train your ear, sharpen your memory, and improve your writing—all in one immersive experience.
              </p>

              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
                {languages.slice(0, 6).map((lang, i) => (
                  <div key={`${lang.flag}-${i}`} className="language-chip flex items-center gap-2 bg-white p-2 rounded-full shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0">
                      <FlagIcon code={lang.flag} size={20} />
                    </div>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </div>
                ))}
                <div className="language-chip flex items-center gap-2 bg-white p-2 rounded-full shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <Globe size={20} className="text-brand-primary" />
                  <span className="text-sm font-medium">+ more</span>
                </div>
              </div>
              
              <div className="mt-10 flex flex-col items-center lg:items-start">
                <Button 
                  size="lg" 
                  className="bg-brand-primary hover:bg-brand-secondary rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  onClick={handleStartFreeClick}
                  data-gtm-cta-type="signup"
                  data-gtm-cta-location="hero_section"
                  data-gtm-cta-text="Start Free Today"
                >
                  <Link to="/language-selection" className="flex items-center gap-2">
                    Start Free Today
                    <ArrowRight size={20} />
                  </Link>
                </Button>
              </div>
            </AnimatedGroup>
          </div>

          {/* Right Column - Demo GIF */}
          <div className="text-center lg:text-right">
            <AnimatedGroup variants={transitionVariants}>
              <div className="relative">
                <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-100">
                  <img 
                    src="/demo.gif" 
                    alt="Language learning demonstration" 
                    className="w-full h-auto rounded-lg"
                    loading="lazy"
                  />
                </div>
                
                {/* Optional: Try Sample button overlay */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <Button
                    onClick={handleOpenSample}
                    variant="outline"
                    className="bg-white shadow-lg hover:shadow-xl border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all rounded-full px-6 py-2"
                  >
                    Try Sample Exercise
                  </Button>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </div>

        {/* Featured On Section */}
        <div className="mt-20">
          <AnimatedGroup variants={transitionVariants}>
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-700 mb-8">Featured on</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                <a 
                  href="https://www.producthunt.com/posts/lwlnow?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-lwlnow" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:scale-105 transition-transform shadow-lg rounded-lg bg-white p-2 border border-gray-200 hover:shadow-xl"
                >
                  <img 
                    src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=961139&theme=light&t=1746390894369" 
                    alt="lwlnow - Learn languages by listening, typing, and mastering." 
                    width="200" 
                    height="43" 
                    className="rounded" 
                  />
                </a>
                
                <a 
                  href="https://fazier.com/launches/www.lwlnow.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform shadow-lg rounded-lg bg-white p-2 border border-gray-200 hover:shadow-xl"
                >
                  <img 
                    src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=light" 
                    width="200" 
                    alt="Fazier badge" 
                    className="rounded"
                  />
                </a>
              
                <a 
                  href="https://startupfa.me/s/lwlnow?utm_source=lwlnow.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform shadow-lg rounded-lg bg-white p-2 border border-gray-200 hover:shadow-xl"
                >
                  <img 
                    src="https://startupfa.me/badges/featured/default.webp" 
                    alt="Featured on Startup Fame" 
                    width="171" 
                    height="54" 
                    className="rounded"
                  />
                </a>
              
                <a 
                  href="https://twelve.tools" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform shadow-lg rounded-lg bg-white p-2 border border-gray-200 hover:shadow-xl"
                >
                  <img 
                    src="https://twelve.tools/badge3-light.svg" 
                    alt="Featured on Twelve Tools" 
                    width="200" 
                    height="54" 
                    className="rounded"
                  />
                </a>
              </div>
            </div>
          </AnimatedGroup>
        </div>
      </div>
    </section>

    {/* Features grid */}
    <section className="py-20 bg-gray-50/50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-brand-dark">Our Unique Approach</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="feature-card bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <p className="text-lg text-center font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* How it works section */}
    <section className="py-20">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-brand-dark">How It Works</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-lg">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-dark mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Benefits */}
    <section className="py-20 bg-gray-50/50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-brand-dark">Why It Works</h2>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <Check className="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg text-brand-dark mb-1">Improves Listening Comprehension</p>
                  <p className="text-muted-foreground">Train your ears to recognize natural speech patterns and accents</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Check className="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg text-brand-dark mb-1">Strengthens Writing Skills</p>
                  <p className="text-muted-foreground">Master spelling, grammar, and sentence structure through practice</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Check className="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg text-brand-dark mb-1">Builds Vocabulary in Context</p>
                  <p className="text-muted-foreground">Learn new words naturally in proper context, not as isolated flashcards</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Check className="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg text-brand-dark mb-1">Creates Deeper Neural Connections</p>
                  <p className="text-muted-foreground">Engage multiple learning pathways simultaneously for better retention</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-brand-dark">Ready to Transform Your Language Journey?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join thousands of learners who have improved their language skills with our method.</p>
          
          <Button 
            size="lg" 
            className="bg-brand-primary hover:bg-brand-secondary rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={handleStartLearningClick}
            data-gtm-cta-type="signup"
            data-gtm-cta-location="cta_section"
            data-gtm-cta-text="Start Learning Now"
          >
            <Link to="/language-selection" className="flex items-center gap-2">
              Start Learning Now
              <ArrowRight size={20} />
            </Link>
          </Button>
        </div>
      </div>
    </section>

    {/* Sample dictation modal */}
    <SampleDictationModal open={sampleModalOpen} onOpenChange={setSampleModalOpen} />
  </>;
}