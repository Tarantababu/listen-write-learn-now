
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Play, X, Loader2 } from 'lucide-react';
import { DifficultySelector } from './DifficultySelector';
import { SentenceDisplay } from './SentenceDisplay';
import { UserResponse } from './UserResponse';
import { ProgressTracker } from './ProgressTracker';
import { useSentenceMining } from '@/hooks/use-sentence-mining';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';

export const SentenceMiningSection: React.FC = () => {
  const isMobile = useIsMobile();
  const { settings } = useUserSettingsContext();
  const [audioLoading, setAudioLoading] = useState(false);
  
  const {
    currentSession,
    currentExercise,
    userResponse,
    showResult,
    isCorrect,
    loading,
    error,
    progress,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
  } = useSentenceMining();

  const handlePlayAudio = async () => {
    if (!currentExercise) return;

    try {
      setAudioLoading(true);
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: currentExercise.sentence,
          language: settings.selectedLanguage,
        },
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
    submitAnswer(userResponse);
  };

  if (loading && !currentExercise) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating your sentence...</p>
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
            <Button onClick={() => window.location.reload()}>
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
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 md:h-8 md:w-8" />
          Smart Sentence Mining
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Master vocabulary through intelligent cloze deletion exercises. Each sentence is crafted to challenge you at just the right level.
        </p>
      </div>

      {/* Progress Tracker */}
      {progress && (
        <ProgressTracker progress={progress} currentSession={currentSession} />
      )}

      {/* Main Content */}
      {!currentSession ? (
        // Difficulty Selection
        <div className="max-w-5xl mx-auto">
          <DifficultySelector
            onSelectDifficulty={startSession}
            progress={progress?.difficultyProgress}
          />
        </div>
      ) : (
        // Active Session
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Session Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <span className="font-semibold">Active Session</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={endSession}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              End Session
            </Button>
          </div>

          {/* Exercise Display */}
          {currentExercise && (
            <div className="space-y-4">
              <SentenceDisplay
                exercise={currentExercise}
                onPlayAudio={handlePlayAudio}
                audioLoading={audioLoading}
              />
              
              <UserResponse
                userResponse={userResponse}
                onResponseChange={updateUserResponse}
                onSubmit={handleSubmitAnswer}
                onNext={nextExercise}
                showResult={showResult}
                isCorrect={isCorrect}
                correctAnswer={currentExercise.targetWord}
                loading={loading}
              />
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">How Smart Sentence Mining Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Intelligent Generation</h4>
              <p className="text-sm text-muted-foreground">
                AI creates sentences with carefully selected vocabulary based on your chosen difficulty level.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. Contextual Learning</h4>
              <p className="text-sm text-muted-foreground">
                Learn words in meaningful contexts rather than isolated vocabulary lists.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. Progressive Mastery</h4>
              <p className="text-sm text-muted-foreground">
                Track your progress across difficulty levels and build lasting vocabulary knowledge.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
