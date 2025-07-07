import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Play, X, Loader2 } from 'lucide-react';
import { DifficultySelector } from './DifficultySelector';
import { TranslationExercise } from './exercises/TranslationExercise';
import { VocabularyMarkingExercise } from './exercises/VocabularyMarkingExercise';
import { ClozeExercise } from './exercises/ClozeExercise';
import { SentenceDisplay } from './SentenceDisplay';
import { UserResponse } from './UserResponse';
import { ProgressTracker } from './ProgressTracker';
import { useSentenceMining } from '@/hooks/use-sentence-mining';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import { DifficultyLevel } from '@/types/sentence-mining';
import { EnhancedAudioPlayer } from './exercises/EnhancedAudioPlayer';

export const SentenceMiningSection: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    settings
  } = useUserSettingsContext();
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
    toggleTranslation
  } = useSentenceMining();

  const handlePlayAudio = async () => {
    if (!currentExercise) return;
    
    try {
      setAudioLoading(true);
      
      // The EnhancedAudioPlayer will handle Norwegian optimization automatically
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
    return <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating your exercise...</p>
        </div>
      </div>;
  }

  if (error) {
    return <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={() => window.location.reload()} className="transition-transform duration-200 hover:scale-105 active:scale-95">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>;
  }

  const renderExercise = () => {
    if (!currentExercise) return null;
    
    // For exercises that don't have built-in audio handling, use EnhancedAudioPlayer
    const commonProps = {
      exercise: currentExercise,
      showResult,
      isCorrect,
      loading,
      onPlayAudio: handlePlayAudio,
      audioLoading,
      showTranslation,
      onToggleTranslation: toggleTranslation
    };

    switch (currentExercise.exerciseType) {
      case 'translation':
        return <TranslationExercise {...commonProps} userResponse={userResponse} onResponseChange={updateUserResponse} onSubmit={handleSubmitAnswer} onNext={nextExercise} />;
      case 'vocabulary_marking':
        return <VocabularyMarkingExercise {...commonProps} selectedWords={selectedWords} onWordSelect={toggleWord} onSubmit={handleSubmitAnswer} onNext={nextExercise} />;
      case 'cloze':
        return <ClozeExercise {...commonProps} userResponse={userResponse} onResponseChange={updateUserResponse} onSubmit={handleSubmitAnswer} onNext={nextExercise} />;
      default:
        return <div className="space-y-4">
            <SentenceDisplay exercise={currentExercise} onPlayAudio={handlePlayAudio} audioLoading={audioLoading} userResponse={userResponse} onResponseChange={updateUserResponse} showResult={showResult} isCorrect={isCorrect} />
            
            <UserResponse onSubmit={handleSubmitAnswer} onNext={nextExercise} showResult={showResult} isCorrect={isCorrect} correctAnswer={currentExercise.targetWord} loading={loading} explanation={currentExercise.explanation} />
          </div>;
    }
  };

  return <div className="space-y-6">
      {/* Header */}
      

      {/* Progress Tracker */}
      {progress && <ProgressTracker progress={progress} currentSession={currentSession} />}

      {/* Main Content */}
      {!currentSession ?
    // Difficulty Selection
    <div className="max-w-4xl mx-auto">
          <DifficultySelector onSelectDifficulty={handleStartSession} progress={progress?.difficultyProgress} />
        </div> :
    // Active Session
    <div className="max-w-4xl mx-auto space-y-6">
          {/* Session Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <span className="font-semibold">
                {currentExercise?.exerciseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Exercise
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={endSession} className="flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95">
              <X className="h-4 w-4" />
              End Session
            </Button>
          </div>

          {/* Exercise Display */}
          {renderExercise()}
        </div>}

      {/* Help Section */}
      
    </div>;
};
