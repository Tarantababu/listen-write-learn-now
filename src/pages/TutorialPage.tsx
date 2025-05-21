
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
                  Start by selecting a text that matches your current level:
                </p>
                <ul className="list-disc list-outside pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li><strong>Use our ready-made curriculum</strong> based on CEFR levels (A1, A2, B1, etc.).</li>
                  <li><strong>Or create your own content.</strong> A simple paragraph or a few sentences is enough. 
                    I often generate one using ChatGPT.</li>
                </ul>
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="font-medium">Example (Level A1 – Topic: Introductions):</p>
                  <blockquote className="mt-2 border-l-2 pl-3 italic">
                    Hola, me llamo Ana.<br />
                    Soy de México y tengo treinta años.<br />
                    Vivo en Madrid con mi familia.<br />
                    Me gusta leer libros y escuchar música.
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
                Do a Dictation Exercise
              </h2>
              <div className="pl-8">
                <ul className="list-disc list-outside pl-5 space-y-1 text-muted-foreground">
                  <li>Listen to the audio.</li>
                  <li>Type what you hear, as accurately as possible.</li>
                  <li>Repeat the exercise until you get <strong>at least 95% accuracy three times.</strong></li>
                </ul>
                <p className="mt-2 text-sm text-muted-foreground">
                  The app tracks your attempts automatically—this method is based on 100+ hours of real learner experience.
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
            
            {/* Step 3 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">3</span>
                Review Your Mistakes
              </h2>
              <div className="pl-8">
                <p className="text-muted-foreground">
                  After each try, you'll see a detailed comparison between your answer and the original. Learn from your errors and improve with each attempt.
                </p>
              </div>
            </div>
            
            <Separator />
            
            {/* Step 4 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">4</span>
                Save New Words and Phrases
              </h2>
              <div className="pl-8">
                <ul className="list-disc list-outside pl-5 space-y-1 text-muted-foreground">
                  <li>Click on unfamiliar words to add them to your <strong>Vocabulary</strong>.</li>
                  <li>Easily create flashcards for future review.</li>
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
                Listen to Your Flashcards Anytime
              </h2>
              <div className="pl-8">
                <p className="text-muted-foreground">
                  All saved flashcards are automatically added to a <strong>personal audio playlist</strong>.
                  Perfect for learning while walking, commuting, or relaxing—ideal for <strong>passive listening</strong>.
                </p>
              </div>
            </div>
            
            <Separator />
            
            {/* Step 6 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">6</span>
                Track Your Progress
              </h2>
              <div className="pl-8">
                <p className="text-muted-foreground">
                  Monitor your growth toward <strong>B1</strong>, <strong>B2</strong>, or <strong>C1</strong>:
                </p>
                <ul className="list-disc list-outside pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li>See your known word range.</li>
                  <li>Click the <strong>(?) icon</strong> for insights on what vocabulary level you're currently reaching.</li>
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
              <p className="font-medium">This method works because it's <strong>simple, consistent, and proven</strong>.</p>
              <p>Start now and build your fluency step by step.</p>
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
