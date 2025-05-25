import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Globe, Play, Volume2 } from 'lucide-react';
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
  title: "Choose your language",
  description: "Select from our library of carefully curated exercises for your level."
}, {
  number: 2,
  title: "Take skill test",
  description: "Quick 5-minute assessment to determine your starting point."
}, {
  number: 3,
  title: "Start learning",
  description: "Begin with personalized dictation exercises that match your level."
}];

// Interactive Demo Component
const InteractiveDemoWidget = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [hasPlayed, setHasPlayed] = useState(false);
  
  const correctText = "Guten Morgen! Wie geht es Ihnen?";
  const placeholder = "Listen and type what you hear...";
  
  const handlePlay = () => {
    setIsPlaying(true);
    setHasPlayed(true);
    // Simulating audio playback
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };
  
  const getAccuracy = () => {
    if (!userInput.trim()) return 0;
    const words = correctText.toLowerCase().split(' ');
    const userWords = userInput.toLowerCase().split(' ');
    let correct = 0;
    
    userWords.forEach((word, index) => {
      if (words[index] && word === words[index]) {
        correct++;
      }
    });
    
    return Math.round((correct / words.length) * 100);
  };
  
  const accuracy = getAccuracy();
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <FlagIcon code="DE" size={24} />
        <span className="font-medium text-gray-800">Try German Dictation</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Beginner</span>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <Button
          onClick={handlePlay}
          disabled={isPlaying}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-secondary"
          size="sm"
        >
          <Volume2 size={16} />
          {isPlaying ? 'Playing...' : 'Play Audio'}
        </Button>
        <div className="text-sm text-gray-600">
          {isPlaying && <span className="animate-pulse">🔊 Playing German phrase...</span>}
        </div>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={hasPlayed ? placeholder : "Click play button first"}
          disabled={!hasPlayed}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
      </div>
      
      {userInput.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Accuracy: {accuracy}%</span>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        Correct answer: "{correctText}"
      </div>
    </div>
  );
};

// Progress Indicator Component
const ProgressIndicator = () => {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
        <span className="text-sm text-gray-600">Choose Language</span>
      </div>
      <div className="w-8 h-0.5 bg-gray-300"></div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <span className="text-sm text-gray-600">Skill Test</span>
      </div>
      <div className="w-8 h-0.5 bg-gray-300"></div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <span className="text-sm text-gray-600">Start Learning</span>
      </div>
    </div>
  );
};

export function Hero() {
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const handleOpenSample = () => {
    setSampleModalOpen(true);
  };
  return <>
      <section className="pt-24 pb-20 md:pt-36 relative overflow-hidden bg-gradient-to-br from-white to-brand-light/10">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              <AnimatedGroup variants={transitionVariants}>
                <div className="mb-4">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-brand-dark">
                    Master Any Language <span className="text-brand-primary">3X Faster</span>
                  </h1>
                  <p className="text-xs text-muted-foreground/70 mt-2 italic">
                    * Dictation transforms passive input into active language mastery.
                  </p>
                </div>
                
                <p className="mt-6 text-xl text-muted-foreground max-w-2xl lg:mx-0 mx-auto">
                  From beginner to fluent in months, not years. Train your ear, sharpen your memory, and master writing—all in one immersive experience.
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
                  
                  <ProgressIndicator />
                  
                  <p className="text-sm text-gray-600 mt-2">Setup takes less than 60 seconds</p>
                  
                  <button 
                    onClick={handleOpenSample}
                    className="mt-4 text-sm text-brand-primary hover:text-brand-secondary underline"
                  >
                    or try a quick demo first
                  </button>
                </div>
                
                {/* Product Hunt badge */}
                <div className="mt-10 flex justify-center lg:justify-start">
                  <a href="https://www.producthunt.com/posts/lwlnow?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-lwlnow" target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform shadow-lg rounded-lg bg-white p-2 border border-gray-200 hover:shadow-xl">
                    <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=961139&theme=light&t=1746390894369" alt="lwlnow - Learn languages by listening, typing, and mastering." width="250" height="54" className="rounded" />
                  </a>
                </div>
              </AnimatedGroup>
            </div>

            {/* Right Column - Interactive Demo */}
            <div className="flex justify-center lg:justify-end">
              <AnimatedGroup variants={transitionVariants}>
                <div className="max-w-md w-full">
                  <InteractiveDemoWidget />
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
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {steps.map((step, i) => <div key={i} className="flex flex-col items-center text-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-lg">
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
            
            <div className="flex flex-col items-center justify-center gap-4">
              <Button size="lg" className="bg-brand-primary hover:bg-brand-secondary rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                <Link to="/language-selection" className="flex items-center gap-2">
                  Start My Free Trial
                  <ArrowRight size={20} />
                </Link>
              </Button>
              
              <button 
                onClick={handleOpenSample}
                className="text-sm text-brand-primary hover:text-brand-secondary underline"
              >
                Try a Sample Exercise First
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sample dictation modal */}
      <SampleDictationModal open={sampleModalOpen} onOpenChange={setSampleModalOpen} />
    </>;
}