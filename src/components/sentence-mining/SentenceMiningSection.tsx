
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Trophy, BookOpen, Loader2, Target, Zap } from 'lucide-react';
import { DifficultyLevel } from '@/types/sentence-mining';
import { SimpleClozeExercise } from './SimpleClozeExercise';
import { useReliableSentenceMining } from '@/hooks/use-reliable-sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { FlagIcon } from 'react-flag-kit';
import { getLanguageFlagCode, capitalizeLanguage } from '@/utils/languageUtils';

// Import minimalist components
import { MinimalistSessionStarter } from './MinimalistSessionStarter';
import { MinimalistProgressCard } from './MinimalistProgressCard';
import { MinimalistInsightsCard } from './MinimalistInsightsCard';
import { MinimalistOverviewCards } from './MinimalistOverviewCards';
import { MinimalistKeyboardHints } from './MinimalistKeyboardHints';

export const SentenceMiningSection: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
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
    error,
    exerciseCount,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleTranslation,
    startSession
  } = useReliableSentenceMining();

  const handleSubmitAnswer = () => {
    submitAnswer(userResponse);
  };

  // Simple session starter that just takes difficulty
  const handleStartSession = async (difficulty: DifficultyLevel) => {
    try {
      await startSession(difficulty);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  // Show session selection if no active session
  if (!currentSession) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Show error if present */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Simplified Overview Section */}
        {progress && (
          <div className="space-y-6">
            <MinimalistOverviewCards progress={progress} language={settings.selectedLanguage} />
          </div>
        )}

        {/* Minimalist Keyboard Shortcuts */}
        <MinimalistKeyboardHints />

        {/* Simple Session Starter */}
        <div className="bg-card border rounded-lg p-6">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Start Learning</h2>
              <p className="text-muted-foreground">
                Choose your difficulty level to begin sentence mining practice
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => handleStartSession('beginner')}
                disabled={loading}
                variant="outline"
                size="lg"
                className="min-w-32"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Beginner
              </Button>
              <Button
                onClick={() => handleStartSession('intermediate')}
                disabled={loading}
                size="lg"
                className="min-w-32"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Intermediate
              </Button>
              <Button
                onClick={() => handleStartSession('advanced')}
                disabled={loading}
                variant="outline"
                size="lg"
                className="min-w-32"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Advanced
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while generating exercise
  if (!currentExercise && isGeneratingNext) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div className="absolute -inset-4 border border-primary/20 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Creating your exercise...</p>
            <p className="text-sm text-muted-foreground">AI is generating personalized content</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if exercise generation failed
  if (!currentExercise && error) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-destructive mb-2">Exercise Generation Failed</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={endSession} variant="outline">
              End Session
            </Button>
            <Button onClick={() => handleStartSession(currentSession.difficulty_level)}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show active session with improved layout
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FlagIcon code={getLanguageFlagCode(settings.selectedLanguage)} size={24} />
            <h1 className="text-2xl font-bold">
              {capitalizeLanguage(settings.selectedLanguage)} Practice
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="capitalize">
              {currentSession.difficulty_level}
            </Badge>
            <Badge variant="outline">
              Exercise {exerciseCount}
            </Badge>
            <Badge variant="outline" className="text-primary">
              <Brain className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={endSession}
          className="text-muted-foreground hover:text-foreground"
        >
          End Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Exercise Area */}
        <div className="lg:col-span-3">
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
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Loading exercise...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <MinimalistProgressCard 
            session={currentSession} 
            isGeneratingNext={isGeneratingNext}
          />
          
          <MinimalistInsightsCard 
            vocabularyProfile={null}
            exerciseCount={exerciseCount}
          />
        </div>
      </div>
    </div>
  );
};
