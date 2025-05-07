
import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ToolsSection() {
  const tools = [
    "Foundational Text Library (1000/3000/7000 word-based)",
    "Dictation Player with precise control",
    "Vocabulary Saving + Audio Review",
    "Reading Analysis Engine", 
    "Progress Dashboard + Streak Tracking",
    "Flashcard Export Tool (audio ready)"
  ];

  return (
    <section className="py-16 bg-primary/5">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10">
          <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">Built-In Tools That Support Your Progress</h2>
        </div>
        
        <div className="max-w-4xl mx-auto grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {tools.map((tool, i) => (
            <Card key={i} className="gradient-card">
              <CardContent className="p-6">
                <p>{tool}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <p className="text-center mt-10 text-lg max-w-3xl mx-auto">
          Everything is designed to work together — helping you get from passive input to active comprehension.
        </p>
      </div>
    </section>
  );
}
