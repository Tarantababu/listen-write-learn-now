import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Book, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const TutorialPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          How I Learn a Language with <span className="inline-block">lwlnow</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          A simple and effective method to make the most of your language learning journey
        </p>
      </div>

      <div className="space-y-6">
        <Card className="gradient-card animate-fade-in">
          <CardContent className="pt-6 space-y-8">
            {/* Step 1 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">1</span>
                Choose or Create Your Practice Text
              </h2>
              <div className="pl-8">
                <p className="text-muted-foreground">
                  Start by selecting or generating a text suitable for your current level:
                </p>
                <ul className="list-disc list-outside pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li><strong>Use our ready-made curriculum</strong> based on CEFR levels (A1, A2, B1, etc.).</li>
                  <li><strong>Or create your own content.</strong> You can:</li>
                </ul>
                <ul className="list-disc list-outside pl-10 mt-1 space-y-1 text-muted-foreground">
                  <li>Paste in your own material</li>
                  <li>Or generate content directly using AI within the app</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  This text becomes the foundation for your study session.
                </p>
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="font-medium">Example (Level A1 – Topic: Introductions):</p>
                  <blockquote className="mt-2 border-l-2 pl-3 italic">
                    Hola, me llamo Ana. Soy de México y tengo treinta años. Vivo en Madrid con mi familia. Me gusta leer libros y escuchar música.
                  </blockquote>
                </div>
                <div className="mt-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/curriculum">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Browse Curriculum
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Step 2 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">2</span>
                Listen and Read
              </h2>
              <div className="pl-8">
                <p className="text-muted-foreground mb-2">
                  Once you've selected or generated a text, go to the <strong>Exercises &gt; Reading</strong> tab.
                </p>
                <ul className="list-disc list-outside pl-5 space-y-1 text-muted-foreground">
                  <li>Listen to the audio version of the text several times.</li>
                  <li>Focus on understanding both the meaning and pronunciation.</li>
                  <li>You can replay the audio as often as needed—repetition builds recognition and fluency.</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            {/* Step 3 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">3</span>
                Create Dictation and Bidirectional Exercises
              </h2>
              <div className="pl-8">
                <p className="text-muted-foreground mb-2">
                  From the Reading screen, you can now <strong>select part or all of the text</strong> to generate:
                </p>
                <ul className="list-disc list-outside pl-5 space-y-1 text-muted-foreground">
                  <li><strong>Dictation exercises:</strong> Listen and type what you hear</li>
                  <li><strong>Bidirectional translation exercises:</strong> Practice translating between your native and target languages</li>
                </ul>
                <p className="mt-2 text-muted-foreground">
                  These interactive tools allow you to go deeper into the text and reinforce understanding through active recall.
                </p>
                <div className="mt-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/exercises">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Go to Exercises
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Step 4 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">4</span>
                Save Vocabulary from the Text
              </h2>
              <div className="pl-8">
                <p className="text-muted-foreground mb-2">
                  While studying, click on unfamiliar words to save them into your personal <strong>Vocabulary</strong>.
                </p>
                <ul className="list-disc list-outside pl-5 space-y-1 text-muted-foreground">
                  <li>Add definitions and notes</li>
                  <li>Automatically create flashcards for spaced repetition</li>
                  <li>Build your word base directly from the content you're working with</li>
                </ul>
                <div className="mt-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/vocabulary">
                      <Book className="mr-2 h-4 w-4" />
                      Go to Vocabulary
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Step 5 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">5</span>
                Practice Dictation for Mastery
              </h2>
              <div className="pl-8">
                <p className="text-muted-foreground mb-2">
                  Dictation remains a cornerstone exercise. Here's how to use it effectively:
                </p>
                <ul className="list-disc list-outside pl-5 space-y-1 text-muted-foreground">
                  <li>Complete the dictation exercise until you reach <strong>at least 95% accuracy three times</strong>.</li>
                  <li>The app automatically tracks your attempts.</li>
                  <li>This method is based on real learner feedback and over 100+ hours of test-driven improvement.</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            {/* Step 6 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">6</span>
                Listen to Your Flashcards Anytime
              </h2>
              <div className="pl-8">
                <p className="text-muted-foreground">
                  All saved vocabulary flashcards are added to a personal audio playlist.
                </p>
                <ul className="list-disc list-outside pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Review passively while commuting, walking, or relaxing</li>
                  <li>Consistent listening reinforces memory and pronunciation</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            {/* Step 7 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">7</span>
                Track Your Progress
              </h2>
              <div className="pl-8">
                <p className="text-muted-foreground">
                  Monitor your development over time:
                </p>
                <ul className="list-disc list-outside pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li>See how many words you know</li>
                  <li>Check your estimated CEFR vocabulary range</li>
                  <li>Use the <strong>(?) icon</strong> for insights on your current level</li>
                </ul>
                <div className="mt-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <p className="font-medium">This method works because it's <strong>simple</strong>, <strong>consistent</strong>, and <strong>proven</strong>.</p>
              <p>Whether you use AI-generated content or your own material, lwlnow gives you flexible tools to learn actively and deeply.</p>
              <p className="mt-2 font-medium">Start now and build your fluency step by step.</p>
              <div className="mt-4">
                <Button asChild>
                  <Link to="/dashboard">
                    Get Started
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TutorialPage;