
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, BookOpen, Book, CreditCard, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const TutorialPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center">
          <HelpCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
          Step-by-Step Tutorial
        </h1>
        <p className="text-muted-foreground text-sm">
          How to learn a language with LWLnow
        </p>
      </div>

      <div className="space-y-6">
        <Card className="gradient-card animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">How I Learn a Language with the App</CardTitle>
            <CardDescription>
              Follow these steps to maximize your language learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-card/50 animate-fade-in">
                <h3 className="font-semibold text-md flex items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">1</span>
                  Generate a Simple Paragraph
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create a short paragraph in your target language that's suitable for your level. I usually use ChatGPT for this right now, but soon the app will have this feature built in, so you won't need to leave the app to get level-appropriate content.
                </p>
                <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                  <p className="italic font-medium">Example (Beginner A1 - Topic: Introductions):</p>
                  <p className="mt-1">Hola, me llamo Ana. Soy de México y tengo treinta años. Vivo en Madrid con mi familia. Me gusta leer libros y escuchar música.</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card/50 animate-fade-in">
                <h3 className="font-semibold text-md flex items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">2</span>
                  Copy the Paragraph into the App
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Go to lwlnow.com, paste the paragraph, and create a new dictation exercise.
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

              <div className="p-4 rounded-lg border bg-card/50 animate-fade-in">
                <h3 className="font-semibold text-md flex items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">3</span>
                  Do the Dictation Exercise
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Listen to the audio and try to type exactly what you hear. Repeat this exercise until you pass it three times with at least 95% accuracy. The app tracks this automatically - it comes from 100 hours of experience.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card/50 animate-fade-in">
                <h3 className="font-semibold text-md flex items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">4</span>
                  Compare Your Answer with the Original
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  After each try, you can see where you made mistakes and what you got right.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card/50 animate-fade-in">
                <h3 className="font-semibold text-md flex items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">5</span>
                  Save New Words or Phrases
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  If you don't know a word, click on it in the Vocabulary tab and create a flashcard for future review.
                </p>
                <div className="mt-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/vocabulary">
                      <Book className="mr-2 h-4 w-4" />
                      Go to Vocabulary
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card/50 animate-fade-in">
                <h3 className="font-semibold text-md flex items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">6</span>
                  Listen to Flashcards Anytime
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The flashcards you save are added to a personal playlist that you can listen to during daily activities—great for passive learning.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card/50 animate-fade-in">
                <h3 className="font-semibold text-md flex items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">7</span>
                  Track Progress Toward B2 or C1
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The app shows your progress and word range. By clicking the (?) icon you can see what vocabulary level you're reaching.
                </p>
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

            <div className="pt-2">
              <h3 className="font-semibold mb-2">Ready to get started?</h3>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/dashboard/exercises">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Create an Exercise
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dashboard/subscription">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Upgrade for More Features
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
