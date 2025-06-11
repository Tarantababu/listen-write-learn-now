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
    <section className="pt-8 pb-20 md:pt-12 relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            <AnimatedGroup variants={transitionVariants}>
              <div className="mb-6">
                <div className="flex items-center justify-center lg:justify-start mb-4">
                  <span className="bg-gradient-to-r from-brand-primary to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    🚀 Proven Learning Method
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    Master Any Language
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-brand-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    3X Faster
                  </span>
                </h1>
                <p className="text-lg md:text-xl font-medium text-gray-700 mt-6 leading-relaxed">
                  From Beginner to Fluent in Months, Not Years
                </p>
              </div>
              
              <p className="mt-6 text-xl text-gray-600 max-w-2xl lg:mx-0 mx-auto leading-relaxed">
                Train your ear, sharpen your memory, and improve your writing—all in one immersive experience.
              </p>

              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
                {languages.slice(0, 6).map((lang, i) => (
                  <div key={`${lang.flag}-${i}`} className="group language-chip flex items-center gap-2 bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-white">
                    <div className="flex-shrink-0">
                      <FlagIcon code={lang.flag} size={20} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{lang.name}</span>
                  </div>
                ))}
                <div className="group language-chip flex items-center gap-2 bg-gradient-to-r from-brand-primary to-purple-600 text-white p-3 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <Globe size={20} className="animate-spin-slow" />
                  <span className="text-sm font-medium">+ 3 more</span>
                </div>
              </div>
              
              <div className="mt-10 flex flex-col items-center lg:items-start">
                <Button 
                  size="lg" 
                  className="group bg-gradient-to-r from-brand-primary to-purple-600 hover:from-purple-600 hover:to-brand-primary text-white rounded-2xl px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0"
                  onClick={handleStartFreeClick}
                  data-gtm-cta-type="signup"
                  data-gtm-cta-location="hero_section"
                  data-gtm-cta-text="Start Free Today"
                >
                  <Link to="/language-selection" className="flex items-center gap-3">
                    Start Free Today
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </AnimatedGroup>
          </div>

          {/* Right Column - Demo Visualization */}
          <div className="text-center lg:text-right">
            <AnimatedGroup variants={transitionVariants}>
              <div className="relative">
                {/* Main demo container */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-white/50 hover:shadow-3xl transition-all duration-500">
                  {!imageError ? (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                      <img 
                        src="./demo.gif" 
                        alt="Language learning demonstration" 
                        className="w-full h-auto rounded-2xl max-w-md mx-auto transition-transform duration-300 hover:scale-105"
                        onError={handleImageError}
                      />
                      {/* Overlay play button for visual appeal */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/10 rounded-2xl">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                          <Play size={32} className="text-brand-primary" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Fallback interactive demo mockup */
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 max-w-md mx-auto">
                      <div className="space-y-6">
                        {/* Mock audio player */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-brand-primary/10 p-2 rounded-full">
                              <Volume2 size={20} className="text-brand-primary" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Listen to native speaker</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-brand-primary to-purple-600 h-full w-3/4 rounded-full animate-pulse"></div>
                          </div>
                        </div>

                        {/* Mock typing interface */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                          <div className="text-sm text-gray-600 mb-2">Type what you hear:</div>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 min-h-[60px] bg-gray-50">
                            <span className="text-gray-400 animate-pulse">The weather is beautiful today...</span>
                          </div>
                        </div>

                        {/* Mock feedback */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Check size={16} className="text-green-500" />
                            <span className="text-sm font-medium text-green-700">Great job! 95% accuracy</span>
                          </div>
                          <div className="text-xs text-gray-500">Keep practicing to improve listening skills</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating stats */}
                <div className="absolute -top-4 -left-4 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-xl border border-white/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-primary">10K+</div>
                    <div className="text-xs text-gray-600">Active Learners</div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-xl border border-white/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">4.9★</div>
                    <div className="text-xs text-gray-600">User Rating</div>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </div>

        {/* Featured On Section */}
        <div className="mt-24">
          <AnimatedGroup variants={transitionVariants}>
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-600 mb-8">Trusted by thousands, featured on</h3>
              <div className="flex justify-center gap-6 flex-wrap">
                <a 
                  href="https://www.producthunt.com/posts/lwlnow?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-lwlnow" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group hover:scale-105 transition-all duration-300 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm p-4 border border-white/50 hover:shadow-2xl hover:bg-white"
                >
                  <img 
                    src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=961139&theme=light&t=1746390894369" 
                    alt="lwlnow - Learn languages by listening, typing, and mastering." 
                    width="200" 
                    height="43" 
                    className="rounded-lg group-hover:scale-105 transition-transform" 
                  />
                </a>
                
                <a 
                  href="https://fazier.com/launches/www.lwlnow.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group hover:scale-105 transition-all duration-300 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm p-4 border border-white/50 hover:shadow-2xl hover:bg-white"
                >
                  <img 
                    src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=light" 
                    width="200" 
                    alt="Fazier badge" 
                    className="rounded-lg group-hover:scale-105 transition-transform"
                  />
                </a>
              
                <a 
                  href="https://startupfa.me/s/lwlnow?utm_source=lwlnow.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group hover:scale-105 transition-all duration-300 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm p-4 border border-white/50 hover:shadow-2xl hover:bg-white"
                >
                  <img 
                    src="https://startupfa.me/badges/featured/default.webp" 
                    alt="Featured on Startup Fame" 
                    width="171" 
                    height="54" 
                    className="rounded-lg group-hover:scale-105 transition-transform"
                  />
                </a>
              
                <a 
                  href="https://twelve.tools" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group hover:scale-105 transition-all duration-300 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm p-4 border border-white/50 hover:shadow-2xl hover:bg-white"
                >
                  <img 
                    src="https://twelve.tools/badge3-light.svg" 
                    alt="Featured on Twelve Tools" 
                    width="200" 
                    height="54" 
                    className="rounded-lg group-hover:scale-105 transition-transform"
                  />
                </a>
              </div>
            </div>
          </AnimatedGroup>
        </div>
      </div>
    </section>

    {/* Features grid */}
    <section className="py-24 bg-gradient-to-b from-gray-50/80 to-white">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Our Unique Approach
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Scientifically designed features that accelerate your language learning journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group feature-card bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-white/50 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:bg-white">
                <div className="text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.split(' ')[0]}
                  </div>
                  <p className="text-lg font-semibold text-gray-800 leading-relaxed">
                    {feature.substring(feature.indexOf(' ') + 1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* How it works section */}
    <section className="py-24 bg-white">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps, powerful results. Start your learning journey today.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {steps.map((step, i) => (
              <div key={i} className="group flex gap-6 p-6 rounded-3xl hover:bg-gray-50/50 transition-all duration-300">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-r from-brand-primary to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-brand-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Benefits */}
    <section className="py-24 bg-gradient-to-b from-gray-50/80 to-white">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Why It Works
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Science-backed benefits that make our method incredibly effective
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/50">
            <div className="space-y-8">
              {[
                {
                  title: "Improves Listening Comprehension",
                  description: "Train your ears to recognize natural speech patterns and accents",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  title: "Strengthens Writing Skills", 
                  description: "Master spelling, grammar, and sentence structure through practice",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  title: "Builds Vocabulary in Context",
                  description: "Learn new words naturally in proper context, not as isolated flashcards",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  title: "Creates Deeper Neural Connections",
                  description: "Engage multiple learning pathways simultaneously for better retention",
                  gradient: "from-orange-500 to-red-500"
                }
              ].map((benefit, i) => (
                <div key={i} className="group flex items-start gap-6 p-6 rounded-2xl hover:bg-white/50 transition-all duration-300">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-r ${benefit.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-xl text-gray-900 mb-2 group-hover:text-brand-primary transition-colors">
                      {benefit.title}
                    </p>
                    <p className="text-gray-600 text-lg leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-24 bg-gradient-to-br from-brand-primary via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
      </div>
      
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
            Ready to Transform Your Language Journey?
          </h2>
          <p className="text-xl text-white/90 mb-12 leading-relaxed max-w-2xl mx-auto">
            Join thousands of learners who have improved their language skills with our proven method.
          </p>
          
            <Button 
              size="lg" 
              className="group bg-white text-brand-primary hover:bg-gray-50 rounded-2xl px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0"
              onClick={handleStartLearningClick}
              data-gtm-cta-type="signup"
              data-gtm-cta-location="cta_section"
              data-gtm-cta-text="Start Learning Now"
            >
              <Link to="/language-selection" className="flex items-center gap-3">
                Start Learning Now
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

          {/* Trust indicators */}
          <div className="mt-12 flex items-center justify-center gap-8 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Sample dictation modal */}
    <SampleDictationModal open={sampleModalOpen} onOpenChange={setSampleModalOpen} />
  </>;
}