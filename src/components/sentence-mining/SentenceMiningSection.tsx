
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DifficultySelector } from './DifficultySelector';
import { ProgressTracker } from './ProgressTracker';
import { SessionInsights } from './SessionInsights';
import { TestingPanel } from './TestingPanel';
import { EnhancedExerciseRenderer } from './exercises/EnhancedExerciseRenderer';
import { useSentenceMining } from '@/hooks/use-sentence-mining';
import { DifficultyLevel } from '@/types/sentence-mining';
import { BookOpen, TestTube, Play, Square } from 'lucide-react';

export const SentenceMiningSection: React.FC = () => {
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
    showTestingPanel,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleWord,
    toggleHint,
    toggleTranslation,
    toggleTestingPanel
  } = useSentenceMining();

  const handleStartSession = (difficulty: DifficultyLevel) => {
    startSession(difficulty);
  };

  const handleSubmitAnswer = () => {
    if (currentExercise?.exerciseType === 'vocabulary_marking') {
      submitAnswer('', selectedWords);
    } else {
      submitAnswer(userResponse, selectedWords);
    }
  };

  if (showTestingPanel) {
    return <TestingPanel onClose={toggleTestingPanel} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Sentence Mining
          </h2>
          <p className="text-muted-foreground">
            Learn vocabulary in context through interactive exercises
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTestingPanel}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Testing Panel
          </Button>
          
          {currentSession && (
            <Button
              variant="outline"
              size="sm"
              onClick={endSession}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              End Session
            </Button>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      {progress && <ProgressTracker progress={progress} currentSession={currentSession} />}

      {/* Session Status */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Session</span>
              <Badge variant="outline" className="capitalize">
                {currentSession.difficulty_level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Exercises: {currentSession.total_exercises}</span>
              <span>Correct: {currentSession.correct_exercises}</span>
              <span>
                Accuracy: {currentSession.total_exercises > 0 
                  ? Math.round((currentSession.correct_exercises / currentSession.total_exercises) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!currentSession ? (
        <div className="space-y-6">
          <DifficultySelector 
            onSelectDifficulty={handleStartSession} 
            progress={progress?.difficultyProgress}
          />
          {progress && <SessionInsights progress={progress} currentSession={currentSession} />}
        </div>
      ) : currentExercise ? (
        <EnhancedExerciseRenderer
          exercise={currentExercise}
          userResponse={userResponse}
          selectedWords={selectedWords}
          showResult={showResult}
          isCorrect={isCorrect}
          loading={loading}
          showTranslation={showTranslation}
          onToggleTranslation={toggleTranslation}
          onResponseChange={updateUserResponse}
          onWordSelect={toggleWord}
          onSubmit={handleSubmitAnswer}
          onNext={nextExercise}
        />
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Generating your first exercise...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
