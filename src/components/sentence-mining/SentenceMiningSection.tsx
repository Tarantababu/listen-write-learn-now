
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain, Play, X, Loader2, BookOpen, Award, TrendingUp, Settings, BarChart3 } from 'lucide-react';
import { DifficultySelector } from './DifficultySelector';
import { EnhancedExerciseRenderer } from './exercises/EnhancedExerciseRenderer';
import { ProgressTracker } from './ProgressTracker';
import { ExerciseTypeStats } from './ExerciseTypeStats';
import { SessionInsights } from './SessionInsights';
import { SentenceMiningSettings } from './SentenceMiningSettings';
import { useSentenceMining } from '@/hooks/use-sentence-mining';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import { DifficultyLevel } from '@/types/sentence-mining';

export const SentenceMiningSection: React.FC = () => {
  const isMobile = useIsMobile();
  const { settings } = useUserSettingsContext();
  const [audioLoading, setAudioLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('practice');
  
  const {
    currentSession,
    currentExercise,
    userResponse,
    selectedWords,
    showResult,
    isCorrect,
    loading,
    error,
    progress,
    showHint,
    showTranslation,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleWord,
    toggleHint,
    toggleTranslation
  } = useSentenceMining();

  const handlePlayAudio = async () => {
    if (!currentExercise) return;
    
    try {
      setAudioLoading(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: currentExercise.sentence,
          language: settings.selectedLanguage
        }
      });

      if (error) throw error;

      if (data?.audio_url || data?.audioUrl) {
        const audio = new Audio(data.audio_url || data.audioUrl);
        audio.play();
      } else {
        toast.error('Audio generation failed');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
    } finally {
      setAudioLoading(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (currentExercise?.exerciseType === 'vocabulary_marking') {
      submitAnswer('', selectedWords);
    } else {
      submitAnswer(userResponse, selectedWords);
    }
  };

  const handleStartSession = (difficulty: DifficultyLevel) => {
    startSession(difficulty);
  };

  if (loading && !currentExercise) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating your personalized exercise...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={() => window.location.reload()} className="transition-transform duration-200 hover:scale-105 active:scale-95">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Sentence Mining</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Learn vocabulary through context using the n+1 method. Each exercise introduces just the right number of new words based on your current knowledge.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Practice
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Practice Tab */}
          <TabsContent value="practice" className="space-y-6">
            {/* Progress Overview */}
            {progress && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Words Learned</p>
                        <p className="text-2xl font-bold">{progress.wordsLearned || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Sessions</p>
                        <p className="text-2xl font-bold">{progress.totalSessions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <p className="text-2xl font-bold">{progress.averageAccuracy}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content */}
            {!currentSession ? (
              <div className="max-w-4xl mx-auto">
                <DifficultySelector onSelectDifficulty={handleStartSession} progress={progress?.difficultyProgress} />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Session Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    <span className="font-semibold">
                      {currentExercise?.exerciseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Exercise
                    </span>
                    {currentSession && (
                      <span className="text-sm text-muted-foreground">
                        ({currentSession.correct_exercises}/{currentSession.total_exercises})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={showSettings} onOpenChange={setShowSettings}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Settings
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Exercise Settings</DialogTitle>
                        </DialogHeader>
                        <SentenceMiningSettings />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={endSession} className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      End Session
                    </Button>
                  </div>
                </div>

                {/* Enhanced Exercise Display */}
                {currentExercise && (
                  <EnhancedExerciseRenderer
                    exercise={currentExercise}
                    userResponse={userResponse}
                    selectedWords={selectedWords}
                    showResult={showResult}
                    isCorrect={isCorrect}
                    loading={loading}
                    onPlayAudio={handlePlayAudio}
                    audioLoading={audioLoading}
                    showTranslation={showTranslation}
                    onToggleTranslation={toggleTranslation}
                    onResponseChange={updateUserResponse}
                    onWordSelect={toggleWord}
                    onSubmit={handleSubmitAnswer}
                    onNext={nextExercise}
                  />
                )}
              </div>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <ProgressTracker progress={progress} currentSession={currentSession} />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            {progress && <ExerciseTypeStats progress={progress} />}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {progress && <SessionInsights progress={progress} currentSession={currentSession} />}
          </TabsContent>
        </Tabs>
      </div>

      {/* Help Section */}
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            How Sentence Mining Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Our sentence mining system uses the proven n+1 methodology, where each sentence contains mostly words you know plus just a few new words to learn.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Translation</h4>
                <p className="text-muted-foreground">Translate sentences between languages to build comprehension</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Vocabulary Marking</h4>
                <p className="text-muted-foreground">Identify and mark unknown words for focused learning</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cloze Exercises</h4>
                <p className="text-muted-foreground">Fill in blanks to practice word usage in context</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Multiple Choice</h4>
                <p className="text-muted-foreground">Choose correct meanings to test comprehension</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
