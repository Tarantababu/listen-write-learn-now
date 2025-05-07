
import React from 'react';
import { Download, Repeat, Book, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MethodSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">The Method: Language Learning that Actually Works</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            We believe fluency is built from the bottom up, not the top down. That's why our method focuses on:
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="gradient-card">
            <CardHeader>
              <Download className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Dictation-Based Input</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You learn by listening and writing, sentence by sentence.</p>
              <ul className="mt-4 space-y-2 list-disc list-inside text-sm">
                <li>Strengthens listening comprehension</li>
                <li>Improves spelling and grammar awareness</li>
                <li>Helps you absorb natural sentence structures intuitively</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardHeader>
              <Repeat className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Repetition With Comprehension</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Repeat what you hear. Notice what you missed. Refine.</p>
              <ul className="mt-4 space-y-2 list-disc list-inside text-sm">
                <li>Fill in gaps without rewinding</li>
                <li>Compare your writing to the original</li>
                <li>Build confidence through visible improvement</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardHeader>
              <Book className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Contextual Vocabulary Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You only learn words in real example sentences.</p>
              <ul className="mt-4 space-y-2 list-disc list-inside text-sm">
                <li>Save unknown words with one click</li>
                <li>Hear them in context</li>
                <li>Review with audio flashcards later</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Reading Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Understand before you practice.</p>
              <ul className="mt-4 space-y-2 list-disc list-inside text-sm">
                <li>See sentence-by-sentence grammar breakdowns</li>
                <li>Learn word etymology and language connections</li>
                <li>Strengthen intuition for patterns and structures</li>
              </ul>
              <p className="mt-4 text-sm italic">You don't study rules — you absorb them through real input.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
