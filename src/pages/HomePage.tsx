
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, PlayCircle, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Headphones className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">ListenWriteLearn</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Improve your language skills with the dictation method.
          Listen, write, and learn effectively.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-card rounded-lg p-6 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <PlayCircle className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-medium mb-2">Practice Dictation</h2>
          <p className="text-muted-foreground mb-4">
            Listen to exercises and improve your language comprehension skills by writing what you hear.
          </p>
          <Button 
            onClick={() => navigate('/exercises')}
            className="w-full"
          >
            Start Practicing
          </Button>
        </div>
        
        <div className="bg-card rounded-lg p-6 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-medium mb-2">Build Vocabulary</h2>
          <p className="text-muted-foreground mb-4">
            Save words and phrases to your vocabulary list and review them with audio examples.
          </p>
          <Button 
            onClick={() => navigate('/vocabulary')}
            className="w-full"
          >
            View Vocabulary
          </Button>
        </div>
        
        <div className="bg-card rounded-lg p-6 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <Settings className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-medium mb-2">Personalize Settings</h2>
          <p className="text-muted-foreground mb-4">
            Customize your learning experience by selecting languages and preferences.
          </p>
          <Button 
            onClick={() => navigate('/settings')}
            className="w-full"
          >
            Settings
          </Button>
        </div>
      </div>
      
      <div className="bg-muted p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">About the Dictation Method</h2>
        <p className="mb-4">
          The dictation method is a powerful technique for language learning that combines listening and writing skills. 
          By listening to native speakers and attempting to write what you hear, you train multiple aspects of language acquisition simultaneously.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div>
            <h3 className="font-medium mb-2">Improves Listening</h3>
            <p className="text-sm text-muted-foreground">
              Train your ear to recognize words, phrases, and natural speech patterns.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Enhances Writing</h3>
            <p className="text-sm text-muted-foreground">
              Practice spelling, grammar, and punctuation in a practical context.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Builds Focus</h3>
            <p className="text-sm text-muted-foreground">
              Develops concentration and attention to linguistic details.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-16">
        <Button onClick={() => navigate('/exercises')} size="lg">
          Get Started Now
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
