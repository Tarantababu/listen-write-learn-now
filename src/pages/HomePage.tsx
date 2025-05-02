import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { Headphones, BookOpen, Settings, LogOut, Award } from 'lucide-react';
import UserStatistics from '@/components/UserStatistics';
import { Progress } from '@/components/ui/progress';
import { getUserLevel, getWordsToNextLevel, getLevelProgress, formatNumber } from '@/utils/levelSystem';
import LevelBadge from '@/components/LevelBadge';
const HomePage: React.FC = () => {
  const {
    user,
    signOut
  } = useAuth();
  const {
    settings
  } = useUserSettingsContext();
  const {
    exercises
  } = useExerciseContext();

  // Calculate mastered words count
  const masteredWords = React.useMemo(() => {
    const currentLanguage = settings.selectedLanguage;
    const masteredSet = new Set<string>();
    exercises.forEach(exercise => {
      if (exercise.language !== currentLanguage || !exercise.isCompleted) return;

      // Words from completed exercises are considered mastered
      const words = exercise.text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, '').replace(/\s+/g, ' ').trim().split(' ');
      words.forEach(word => masteredSet.add(word));
    });
    return masteredSet.size;
  }, [exercises, settings.selectedLanguage]);

  // Get level information
  const userLevel = getUserLevel(masteredWords);
  const wordsToNextLevel = getWordsToNextLevel(masteredWords);
  const levelProgress = getLevelProgress(masteredWords);
  return <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">ListenWriteLearn</h1>
          <p className="text-muted-foreground">
            Improve your language skills using the dictation method
          </p>
        </header>

        <div className="mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Welcome, {user?.email}</CardTitle>
                <CardDescription>
                  You're currently learning {settings.learningLanguages.map(lang => lang.charAt(0).toUpperCase() + lang.slice(1)).join(', ')}
                </CardDescription>
              </div>
              <div className={`p-2 rounded-full ${userLevel.color}`}>
                <Award className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            
          </Card>
        </div>
        
        {/* User Statistics */}
        <div className="mb-8">
          <UserStatistics />
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
          <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>;
};
export default HomePage;