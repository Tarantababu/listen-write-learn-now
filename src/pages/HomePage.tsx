
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Headphones, BookOpen, Settings, LogOut } from 'lucide-react';

const HomePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { settings } = useUserSettingsContext();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">ListenWriteLearn</h1>
          <p className="text-muted-foreground">
            Improve your language skills using the dictation method
          </p>
        </header>

        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Welcome, {user?.email}</CardTitle>
              <CardDescription>
                You're currently learning {settings.learningLanguages.map((lang) => 
                  lang.charAt(0).toUpperCase() + lang.slice(1)
                ).join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Dictation practice is a powerful method for improving language skills. Listen to the audio, 
                write what you hear, and improve your comprehension and spelling.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                <CardTitle>Practice</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Start practicing with dictation exercises and track your progress
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/dashboard/exercises">Go to Exercises</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <CardTitle>Vocabulary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review your vocabulary collection and practice words you've saved
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/dashboard/vocabulary">View Vocabulary</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Update your languages and customize your learning experience
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link to="/dashboard/settings">Manage Settings</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-muted-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
