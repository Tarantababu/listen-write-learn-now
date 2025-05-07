
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StartNowSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center">
          <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">Start Now</h2>
          
          <div className="mt-8 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-2">
              <span className="text-primary text-2xl">🎧</span>
              <p>Choose a foundational exercise</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary text-2xl">✍️</span>
              <p>Write what you hear</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary text-2xl">🧠</span>
              <p>Understand what you missed</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary text-2xl">🔁</span>
              <p>Repeat with clarity</p>
            </div>
          </div>
          
          <div className="mt-10">
            <p className="text-xl font-medium">Learn with focus. Practice with intent.</p>
            <p className="text-xl mt-2">Experience fluency — one sentence at a time.</p>
          </div>
          
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="rounded-xl px-6">
              <Link to="/signup">
                Start Practicing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl px-6">
              <Link to="/signup">
                View Exercises
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
