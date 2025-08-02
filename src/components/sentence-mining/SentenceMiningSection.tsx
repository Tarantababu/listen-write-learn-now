
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Trophy, BookOpen, Loader2, Target, Zap } from 'lucide-react';
import { DifficultyLevel } from '@/types/sentence-mining';
import { SimpleClozeExercise } from './SimpleClozeExercise';
import { useFullyAdaptiveSentenceMining } from '@/hooks/use-fully-adaptive-sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { FlagIcon } from 'react-flag-kit';
import { getLanguageFlagCode, capitalizeLanguage } from '@/utils/languageUtils';
import { AdaptiveLearningInsights } from './AdaptiveLearningInsights';
import { PersonalizedInsights } from './PersonalizedInsights';

// Import new minimalist components
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

  // Enhanced session starter that supports recommendation-based focus
  const handleRecommendationAction = async (
    difficulty?: DifficultyLevel,
    focusOptions?: {
      focusWords?: string[];
      focusArea?: string;
      reviewMode?: boolean;
    }
  ) => {
    const sessionDifficulty = difficulty || sessionConfig?.suggestedDifficulty || 'intermediate';
    
    if (focusOptions) {
      console.log('[SentenceMiningSection] Focus options will be applied:', focusOptions);
    }
    
    await startAdaptiveSession(sessionDifficulty as DifficultyLevel);
  };

  // Show session selection if no active session
  if (!currentSession) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Simplified Overview Section */}
        {progress && (
          <div className="space-y-6">
            <MinimalistOverviewCards progress={progress} language={settings.selectedLanguage} />
            
            {/* Personalized Insights - More focused */}
            {user && (
              <PersonalizedInsights 
                userId={user.id}
                language={settings.selectedLanguage}
                progress={progress}
                onRecommendationAction={handleRecommendationAction}
              />
            )}
          </div>
        )}

        {/* Minimalist Keyboard Shortcuts */}
        <MinimalistKeyboardHints />

        {/* Streamlined Session Starter */}
        <MinimalistSessionStarter
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
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div className="absolute -inset-4 border border-primary/20 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Creating your next exercise...</p>
            <p className="text-sm text-muted-foreground">AI is personalizing the content for you</p>
          </div>
        </div>
      </div>
    );
  }

  // Show active session with improved layout
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Simplified Session Header */}
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
              Exercise {exerciseCount + 1}
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
        {/* Main Exercise Area - Takes more space */}
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

        {/* Compact Sidebar */}
        <div className="space-y-4">
          <MinimalistProgressCard 
            session={currentSession} 
            isGeneratingNext={isGeneratingNext}
          />
          
          <MinimalistInsightsCard 
            vocabularyProfile={vocabularyProfile}
            exerciseCount={exerciseCount}
          />
          
          {/* Compact Adaptive Learning Insights */}
          <AdaptiveLearningInsights 
            language={settings.selectedLanguage}
            sessionId={currentSession.id}
          />
        </div>
      </div>
    </div>
  );
};
