
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DifficultySelector } from './DifficultySelector';
import { VocabularyStats } from './VocabularyStats';
import { SimpleClozeExercise } from './SimpleClozeExercise';
import { useSentenceMining } from '@/hooks/use-sentence-mining';
import { DifficultyLevel } from '@/types/sentence-mining';
import { BookOpen, Play, Square } from 'lucide-react';

export const SentenceMiningSection: React.FC = () => {
  const {
    currentSession,
    currentExercise,
    userResponse,
    showResult,
    isCorrect,
    loading,
    error,
    progress,
    showTranslation,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleTranslation
  } = useSentenceMining();

  const handleStartSession = (difficulty: DifficultyLevel) => {
    startSession(difficulty);
  };

  const handleSubmitAnswer = () => {
    submitAnswer(userResponse, []);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Sentence Mining</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Learn vocabulary naturally through context. Complete sentences to master new words.
        </p>
      </div>

      {/* Progress Overview */}
      {progress?.vocabularyStats && (
        <div className="max-w-4xl mx-auto">
          <VocabularyStats stats={progress.vocabularyStats} />
        </div>
      )}

      {/* Session Status */}
      {currentSession && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>Current Session</span>
                  <Badge variant="outline" className="capitalize">
                    {currentSession.difficulty_level}
                  </Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={endSession}
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  End Session
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-6 text-sm">
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
        </div>
      )}

      {/* Main Content */}
      {!currentSession ? (
        <div className="max-w-2xl mx-auto">
          <DifficultySelector 
            onSelectDifficulty={handleStartSession} 
            progress={progress?.difficultyProgress}
          />
        </div>
      ) : currentExercise ? (
        <SimpleClozeExercise
          exercise={currentExercise}
          userResponse={userResponse}
          showResult={showResult}
          isCorrect={isCorrect}
          loading={loading}
          showTranslation={showTranslation}
          onToggleTranslation={toggleTranslation}
          onResponseChange={updateUserResponse}
          onSubmit={handleSubmitAnswer}
          onNext={nextExercise}
        />
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Generating your exercise...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <CardContent className="p-4">
              <p className="text-red-800 dark:text-red-200 text-sm text-center">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
