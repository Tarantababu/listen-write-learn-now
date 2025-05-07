
import React from 'react';
import { Check } from 'lucide-react';

export function WhyItWorksSection() {
  return (
    <section id="why-it-works" className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">Why It Works</h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Traditional language learning focuses on memorization.
              ListenWriteLearn focuses on recognition, comprehension, and habit-building.
            </p>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 text-primary mt-1" />
                <p>You internalize grammar</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 text-primary mt-1" />
                <p>You recognize patterns</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 text-primary mt-1" />
                <p>You build usable vocabulary</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 text-primary mt-1" />
                <p>You learn to hear before you speak</p>
              </div>
            </div>
            
            <p className="mt-6 font-medium text-xl">The result? Fluency that feels natural.</p>
          </div>
          
          <div className="md:w-1/2">
            <div className="bg-primary/5 p-8 rounded-xl border">
              <h3 className="text-2xl font-bold mb-6">🎯 Who It's For</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Learners at A1–B2 levels looking to strengthen foundations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Anyone struggling with understanding native audio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Learners who want to stop translating and start thinking in the language</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Fans of immersion and input-based learning</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
