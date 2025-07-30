
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Trophy, BookOpen, Loader2 } from 'lucide-react';
import { useSentenceMining } from '@/hooks/use-sentence-mining';
import { DifficultyLevel } from '@/types/sentence-mining';
import { SimpleClozeExercise } from './SimpleClozeExercise';
import { ProgressTracker } from './ProgressTracker';
import { VocabularyStats } from './VocabularyStats';
import { SessionStats } from './SessionStats';

export const SentenceMiningSection: React.FC = () => {
  const {
    currentSession,
    currentExercise,
    userResponse,
    showResult,
    isCorrect,
    loading,
    progress,
    showTranslation,
    isGeneratingNext,
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
    submitAnswer(userResponse);
  };

  // Show session selection if no active session
  if (!currentSession) {
    return (
      <div className="space-y-8">
        {/* Progress Overview */}
        {progress && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VocabularyStats stats={progress.vocabularyStats} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Sessions</span>
                    <Badge variant="outline">{progress.totalSessions}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Exercises Completed</span>
                    <Badge variant="outline">{progress.totalExercises}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Accuracy</span>
                    <Badge variant={progress.averageAccuracy >= 70 ? 'default' : 'secondary'}>
                      {progress.averageAccuracy}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Streak</span>
                    <Badge variant="outline">{progress.streak} days</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Difficulty Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Start New Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Choose your difficulty level to begin practicing with cloze exercises.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleStartSession('beginner')}
                  disabled={loading}
                  className="h-20 flex flex-col gap-2"
                >
                  <BookOpen className="h-6 w-6" />
                  <span className="font-medium">Beginner</span>
                  <span className="text-xs text-muted-foreground">Simple sentences</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleStartSession('intermediate')}
                  disabled={loading}
                  className="h-20 flex flex-col gap-2"
                >
                  <Brain className="h-6 w-6" />
                  <span className="font-medium">Intermediate</span>
                  <span className="text-xs text-muted-foreground">Moderate complexity</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleStartSession('advanced')}
                  disabled={loading}
                  className="h-20 flex flex-col gap-2"
                >
                  <Trophy className="h-6 w-6" />
                  <span className="font-medium">Advanced</span>
                  <span className="text-xs text-muted-foreground">Complex sentences</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while generating exercise
  if (!currentExercise && isGeneratingNext) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Generating your next exercise...</p>
        </div>
      </div>
    );
  }

  // Show active session
  return (
    <div className="space-y-8">
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Active Session</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {currentSession.difficulty_level}
            </Badge>
            <Badge variant="secondary">
              Exercise {currentSession.total_exercises + 1}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={endSession}
          className="text-red-600 hover:text-red-700"
        >
          End Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Exercise Area */}
        <div className="lg:col-span-2">
          {currentExercise ? (
            <SimpleClozeExercise
              exercise={currentExercise}
              userResponse={userResponse}
              showResult={showResult}
              isCorrect={isCorrect}
              loading={loading}
              onResponseChange={updateUserResponse}
              onSubmit={handleSubmitAnswer}
              onNext={nextExercise}
              showTranslation={showTranslation}
              onToggleTranslation={toggleTranslation}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-muted-foreground">Loading exercise...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SessionStats session={currentSession} />
          <ProgressTracker progress={progress} currentSession={currentSession} />
        </div>
      </div>
    </div>
  );
};
