
import React from 'react';
import { Sparkles } from 'lucide-react';

export function MethodSection() {
  return (
    <section id="method" className="py-16 bg-primary/5">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">The Method: Language Learning that Actually Works</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            We believe fluency is built from the bottom up, not the top down.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="flex flex-col p-6 bg-background rounded-xl border">
            <div className="mb-4 text-3xl">📥</div>
            <h3 className="text-xl font-bold mb-2">Dictation-Based Input</h3>
            <p className="text-sm text-muted-foreground">Listen and write, sentence by sentence.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Strengthens listening comprehension</li>
              <li>• Improves spelling and grammar awareness</li>
              <li>• Helps absorb natural sentence structures</li>
            </ul>
          </div>
          
          <div className="flex flex-col p-6 bg-background rounded-xl border">
            <div className="mb-4 text-3xl">🔁</div>
            <h3 className="text-xl font-bold mb-2">Repetition With Comprehension</h3>
            <p className="text-sm text-muted-foreground">Notice what you missed. Refine.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Fill in gaps without rewinding</li>
              <li>• Compare your writing to the original</li>
              <li>• Build confidence through improvement</li>
            </ul>
          </div>
          
          <div className="flex flex-col p-6 bg-background rounded-xl border">
            <div className="mb-4 text-3xl">📚</div>
            <h3 className="text-xl font-bold mb-2">Contextual Vocabulary</h3>
            <p className="text-sm text-muted-foreground">Learn words in real sentences.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Save unknown words with one click</li>
              <li>• Hear them in context</li>
              <li>• Review with audio flashcards</li>
            </ul>
          </div>
          
          <div className="flex flex-col p-6 bg-background rounded-xl border">
            <div className="mb-4 text-3xl">🧠</div>
            <h3 className="text-xl font-bold mb-2">Reading Analysis</h3>
            <p className="text-sm text-muted-foreground">Understand before you practice.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Grammar breakdowns</li>
              <li>• Etymology and language connections</li>
              <li>• Pattern recognition</li>
            </ul>
          </div>
        </div>
        
        <div className="text-center mt-10">
          <p className="text-lg">You don't study rules — you absorb them through real input.</p>
        </div>
      </div>
    </section>
  );
}
