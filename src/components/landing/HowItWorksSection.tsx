
import React from 'react';
import { Check, Edit } from 'lucide-react';

export function HowItWorksSection() {
  return (
    <section className="py-16 bg-primary/5">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">How It Works — Step by Step</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            A structured approach to language mastery
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-primary/10 rounded-full p-3 shrink-0">
                <span className="text-primary font-bold text-xl">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Choose an Exercise</h3>
                <p className="text-muted-foreground">
                  Select a foundational or personal text based on your target language and level.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-primary/10 rounded-full p-3 shrink-0">
                <span className="text-primary font-bold text-xl">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Analyze Before You Practice (Optional)</h3>
                <p className="text-muted-foreground">
                  Activate Reading Analysis to walk through the text:
                </p>
                <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-muted-foreground">
                  <li>Sentence structure</li>
                  <li>Cognates and root meanings</li>
                  <li>Grammatical markers</li>
                  <li>Pattern recognition</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-primary/10 rounded-full p-3 shrink-0">
                <span className="text-primary font-bold text-xl">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Start Dictation Practice</h3>
                <p className="text-muted-foreground">
                  Listen to 2–5 words → Pause → Write what you hear.
                </p>
                <div className="mt-2 bg-muted/50 p-4 rounded-lg border">
                  <p className="font-semibold">Important:</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside text-sm">
                    <li>Don't write while listening.</li>
                    <li>Don't rewind. Leave gaps if unsure.</li>
                    <li>Stop after 3–5 sentences if it feels too hard — quality over quantity.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 4-7 */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-primary/10 rounded-full p-3 shrink-0">
                <span className="text-primary font-bold text-xl">4</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Compare and Correct</h3>
                <p className="text-muted-foreground">
                  Click Compare to check your work.
                </p>
                <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-muted-foreground">
                  <li>Fix mistakes</li>
                  <li>Fill missed words</li>
                  <li>Listen once more and read along</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-primary/10 rounded-full p-3 shrink-0">
                <span className="text-primary font-bold text-xl">5</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Add Vocabulary</h3>
                <p className="text-muted-foreground">
                  From the Compare view, save any unknown words directly to your Vocabulary.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-primary/10 rounded-full p-3 shrink-0">
                <span className="text-primary font-bold text-xl">6</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Repeat Vocabulary with Audio</h3>
                <p className="text-muted-foreground">
                  Go to the Vocabulary page and listen to words in real sentences.
                  Repetition with comprehension builds permanent recall.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-primary/10 rounded-full p-3 shrink-0">
                <span className="text-primary font-bold text-xl">7</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Export to Flashcards (Optional)</h3>
                <p className="text-muted-foreground">
                  Export saved words into audio flashcards for Anki or Quizlet.
                  Practice on the go — spaced repetition made easy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
