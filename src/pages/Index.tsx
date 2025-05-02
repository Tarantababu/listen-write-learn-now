
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Headphones } from 'lucide-react';

const Index: React.FC = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect to the home page
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-24">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Headphones className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">ListenWriteLearn</h1>
          </div>
        </nav>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="lg:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Improve your language skills through dictation
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md">
              Listen, write, and learn with our unique dictation-based approach that enhances your comprehension, spelling, and vocabulary skills.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-25"></div>
              <div className="relative bg-card border rounded-lg shadow-xl p-6 md:p-8 aspect-video flex items-center justify-center">
                <div className="flex flex-col gap-3 items-center text-center">
                  <Headphones className="h-16 w-16 text-primary mb-2" />
                  <h3 className="text-xl font-medium">Dictation Practice</h3>
                  <p className="text-muted-foreground">
                    Listen to audio clips and write what you hear to improve your language skills
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg shadow-sm p-6 text-center">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Listen</h3>
              <p className="text-muted-foreground">
                Listen to carefully selected audio clips in your target language
              </p>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm p-6 text-center">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Write</h3>
              <p className="text-muted-foreground">
                Transcribe what you hear to practice spelling and grammar
              </p>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm p-6 text-center">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Learn</h3>
              <p className="text-muted-foreground">
                Build your vocabulary with words you encounter in exercises
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to improve your language skills?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of language learners who are improving their skills through our dictation-based approach.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="font-semibold">
            <Link to="/signup">Create Account</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">Log In</Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ListenWriteLearn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
