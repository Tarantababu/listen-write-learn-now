
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Play, X, Loader2 } from 'lucide-react';
import { ExerciseTypeSelector } from './ExerciseTypeSelector';
import { TranslationExercise } from './exercises/TranslationExercise';
import { MultipleChoiceExercise } from './exercises/MultipleChoiceExercise';
import { VocabularyMarkingExercise } from './exercises/VocabularyMarkingExercise';
import { ClozeExercise } from './exercises/ClozeExercise';
import { ProgressTracker } from './ProgressTracker';
import { useSentenceMining } from '@/hooks/use-sentence-mining';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import { ExerciseType, DifficultyLevel } from '@/types/sentence-mining';

export const SentenceMiningSection: React.FC = () => {
  const isMobile = useIsMobile();
  const { settings } = useUserSettingsContext();
  const [audioLoading, setAudioLoading] = useState(false);
  
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
    toggleTranslation,
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
    if (currentExercise?.exerciseType === 'vocabulary_marking') {
      submitAnswer('', selectedWords);
    } else {
      submitAnswer(userResponse, selectedWords);
    }
  };

  const handleStartSession = (exerciseType: ExerciseType, difficulty: DifficultyLevel) => {
    startSession(exerciseType, difficulty);
  };

  if (loading && !currentExercise) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating your exercise...</p>
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

  const renderExercise = () => {
    if (!currentExercise) return null;

    const commonProps = {
      exercise: currentExercise,
      showResult,
      isCorrect,
      loading,
      onPlayAudio: handlePlayAudio,
      audioLoading,
      showTranslation,
      onToggleTranslation: toggleTranslation,
    };

    switch (currentExercise.exerciseType) {
      case 'translation':
        return (
          <TranslationExercise
            {...commonProps}
            userResponse={userResponse}
            onResponseChange={updateUserResponse}
            onSubmit={handleSubmitAnswer}
            onNext={nextExercise}
          />
        );
        
      case 'multiple_choice':
        return (
          <MultipleChoiceExercise
            {...commonProps}
            userResponse={userResponse}
            onResponseChange={updateUserResponse}
            onSubmit={handleSubmitAnswer}
            onNext={nextExercise}
          />
        );
        
      case 'vocabulary_marking':
        return (
          <VocabularyMarkingExercise
            {...commonProps}
            selectedWords={selectedWords}
            onWordSelect={toggleWord}
            onSubmit={handleSubmitAnswer}
            onNext={nextExercise}
          />
        );
        
      default: // cloze
        return (
          <ClozeExercise
            {...commonProps}
            userResponse={userResponse}
            onResponseChange={updateUserResponse}
            onSubmit={handleSubmitAnswer}
            onNext={nextExercise}
          />
        );
    }
  };

  return (
    <div className="space-y-6 min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 md:h-8 md:w-8" />
          Smart Sentence Mining
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Master vocabulary through intelligent exercises. Each sentence is crafted to challenge you at just the right level.
        </p>
      </div>

      {/* Progress Tracker */}
      {progress && (
        <ProgressTracker progress={progress} currentSession={currentSession} />
      )}

      {/* Main Content */}
      {!currentSession ? (
        // Exercise Type Selection
        <div className="max-w-5xl mx-auto">
          <ExerciseTypeSelector
            onSelectType={handleStartSession}
            progress={progress?.exerciseTypeProgress}
          />
        </div>
      ) : (
        // Active Session - Full screen exercise
        <div className="w-full">
          {/* Session Header - smaller, less prominent */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {currentExercise?.exerciseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Exercise
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={endSession}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
                End Session
              </Button>
            </div>
          </div>

          {/* Exercise Display */}
          {renderExercise()}
        </div>
      )}

      {/* Help Section - only show when not in active session */}
      {!currentSession && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Enhanced Smart Sentence Mining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold">🔤 Translation Exercises</h4>
                <p className="text-sm text-muted-foreground">
                  Translate complete sentences to build comprehensive understanding and improve fluency.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">✅ Multiple Choice</h4>
                <p className="text-sm text-muted-foreground">
                  Choose the correct word from options, with detailed explanations for grammar rules.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">📚 Vocabulary Marking</h4>
                <p className="text-sm text-muted-foreground">
                  Click on unknown words to mark them for review and get instant definitions.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">🧩 Fill in the Blank</h4>
                <p className="text-sm text-muted-foreground">
                  Complete sentences by filling in missing words based on context clues.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
