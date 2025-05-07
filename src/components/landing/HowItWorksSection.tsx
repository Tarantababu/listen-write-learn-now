
import React from 'react';
import { Pen, ClipboardCheck, PlayCircle, PenTool, Bookmark, Headphones, ExternalLink } from 'lucide-react';

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">✍️ How It Works — Step by Step</h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary/10 p-4 rounded-full">
                <PlayCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">1. Choose an Exercise</h3>
                <p>Select a foundational or personal text based on your target language and level.</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary/10 p-4 rounded-full">
                <ClipboardCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">2. Analyze Before You Practice (Optional)</h3>
                <p>Activate Reading Analysis to walk through the text:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside ml-4">
                  <li>Sentence structure</li>
                  <li>Cognates and root meanings</li>
                  <li>Grammatical markers</li>
                  <li>Pattern recognition</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary/10 p-4 rounded-full">
                <Headphones className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">3. Start Dictation Practice</h3>
                <p>Listen to 2–5 words → Pause → Write what you hear.</p>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                  <p className="font-semibold">Important:</p>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Don't write while listening.</li>
                    <li>Don't rewind. Leave gaps if unsure.</li>
                    <li>Stop after 3–5 sentences if it feels too hard — quality over quantity.</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary/10 p-4 rounded-full">
                <PenTool className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">4. Compare and Correct</h3>
                <p>Click Compare to check your work.</p>
                <ul className="mt-2 space-y-1 list-disc list-inside ml-4">
                  <li>Fix mistakes</li>
                  <li>Fill missed words</li>
                  <li>Listen once more and read along</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary/10 p-4 rounded-full">
                <Bookmark className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">5. Add Vocabulary</h3>
                <p>From the Compare view, save any unknown words directly to your Vocabulary.</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary/10 p-4 rounded-full">
                <Headphones className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">6. Repeat Vocabulary with Audio</h3>
                <p>Go to the Vocabulary page and listen to words in real sentences. Repetition with comprehension builds permanent recall.</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary/10 p-4 rounded-full">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">7. Export to Flashcards (Optional)</h3>
                <p>Export saved words into audio flashcards for Anki or Quizlet. Practice on the go — spaced repetition made easy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
