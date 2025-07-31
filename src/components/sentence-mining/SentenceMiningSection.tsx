
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Trophy, BookOpen, Loader2, Keyboard, Target } from 'lucide-react';
import { DifficultyLevel } from '@/types/sentence-mining';
import { SimpleClozeExercise } from './SimpleClozeExercise';
import { EnhancedProgressIndicator } from './EnhancedProgressIndicator';
import { VocabularyStats } from './VocabularyStats';
import { AdaptiveDifficultyIndicator } from './AdaptiveDifficultyIndicator';
import { PersonalizedInsights } from './PersonalizedInsights';
import { AdaptiveSessionStarter } from './AdaptiveSessionStarter';
import { useFullyAdaptiveSentenceMining } from '@/hooks/use-fully-adaptive-sentence-mining';

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
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleTranslation,
    vocabularyProfile,
    sessionConfig,
    loadingOptimalDifficulty,
    isInitializingSession,
    startAdaptiveSession,
    exerciseCount
  } = useFullyAdaptiveSentenceMining();

  const handleSubmitAnswer = () => {
    submitAnswer(userResponse);
  };

  // Show session selection if no active session
  if (!currentSession) {
    return (
      <div className="space-y-8">
        {/* Progress Overview with Personalized Insights */}
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

        {/* Personalized Insights */}
        {progress && (
          <PersonalizedInsights 
            userId={""} // Will be set by the component
            language={""} // Will be set by the component  
            progress={progress}
          />
        )}

        {/* Keyboard Shortcuts Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Check Answer</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded text-xs">Enter</kbd>
                    <span className="text-muted-foreground">or</span>
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded text-xs">Ctrl+Enter</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Toggle Translation</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded text-xs">Space</kbd>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Next Exercise</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded text-xs">Enter</kbd>
                </div>
                <div className="text-xs text-muted-foreground">
                  Use these shortcuts to practice more efficiently!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adaptive Session Starter - Replaces manual difficulty selection */}
        <AdaptiveSessionStarter
          sessionConfig={sessionConfig}
          loadingOptimalDifficulty={loadingOptimalDifficulty}
          isInitializingSession={isInitializingSession}
          onStartSession={startAdaptiveSession}
        />
      </div>
    );
  }

  // Show loading state while generating exercise
  if (!currentExercise && isGeneratingNext) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <div className="absolute -inset-4 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-pulse opacity-30" />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground font-medium">Generating your next adaptive exercise...</p>
            <p className="text-xs text-muted-foreground">AI is personalizing the content for you</p>
          </div>
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
          <h2 className="text-2xl font-bold">Adaptive Session</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {currentSession.difficulty_level}
            </Badge>
            <Badge variant="secondary">
              Exercise {exerciseCount + 1}
            </Badge>
            <Badge variant="outline" className="text-purple-600">
              <Brain className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            {loading && (
              <Badge variant="outline" className="text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Processing
              </Badge>
            )}
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
              isGeneratingNext={isGeneratingNext}
              onResponseChange={updateUserResponse}
              onSubmit={handleSubmitAnswer}
              onNext={nextExercise}
              showTranslation={showTranslation}
              onToggleTranslation={toggleTranslation}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <div className="absolute -inset-4 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-pulse opacity-30" />
                </div>
                <p className="text-muted-foreground">Loading adaptive exercise...</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Sidebar with Adaptive Features */}
        <div className="space-y-6">
          <EnhancedProgressIndicator 
            session={currentSession} 
            isGeneratingNext={isGeneratingNext}
          />
          
          {/* Real-time Vocabulary Insights */}
          {vocabularyProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4" />
                  Adaptive Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Session exercises</span>
                    <Badge variant="outline">{exerciseCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Struggling words</span>
                    <Badge variant="outline" className="text-yellow-600">
                      {vocabularyProfile.strugglingWords.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mastered words</span>
                    <Badge variant="outline" className="text-green-600">
                      {vocabularyProfile.masteredWords.length}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Target className="h-3 w-3" />
                      AI adapts difficulty in real-time
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
