
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, BarChart3, BookOpen, Settings, Brain, TrendingUp } from 'lucide-react';
import { DifficultyLevel } from '@/types/sentence-mining';
import { useEnhancedSentenceMining } from '@/hooks/use-enhanced-sentence-mining';
import { ClozeExercise } from './exercises/ClozeExercise';
import { EnhancedVocabularyStats } from './EnhancedVocabularyStats';
import { VocabularyProgressIndicator } from './VocabularyProgressIndicator';
import { EnhancedDifficultySelector } from './EnhancedDifficultySelector';
import { EnhancedExerciseDisplay } from './EnhancedExerciseDisplay';
import { EnhancedProgressTracker } from './EnhancedProgressTracker';
import { WordMasteryIndicator, calculateMasteryLevel } from './WordMasteryIndicator';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { capitalizeLanguage } from '@/utils/languageUtils';

export const SentenceMiningSection: React.FC = () => {
  const { settings } = useUserSettingsContext();
  const mining = useEnhancedSentenceMining();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('beginner');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

  const handleStartSession = async (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    setIsStartingSession(true);
    
    try {
      console.log('[SentenceMiningSection] Starting session with difficulty:', difficulty);
      
      // Start the session first
      const session = await mining.startSession(difficulty);
      console.log('[SentenceMiningSection] Session created:', session.id);
      
      // Then generate the first exercise using the new session
      console.log('[SentenceMiningSection] Generating first exercise...');
      await mining.nextExercise(session);
      console.log('[SentenceMiningSection] First exercise generated successfully');
      
    } catch (error) {
      console.error('[SentenceMiningSection] Failed to start session and generate exercise:', error);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleSubmitAnswer = async () => {
    await mining.submitAnswer(mining.userResponse);
  };

  const handleNextExercise = async () => {
    if (!mining.currentSession) {
      console.error('[SentenceMiningSection] No active session for next exercise');
      return;
    }

    setIsGeneratingNext(true);
    
    try {
      console.log('[SentenceMiningSection] Generating next exercise for session:', mining.currentSession.id);
      await mining.nextExercise(mining.currentSession);
      console.log('[SentenceMiningSection] Next exercise generated successfully');
    } catch (error) {
      console.error('[SentenceMiningSection] Failed to generate next exercise:', error);
    } finally {
      setIsGeneratingNext(false);
    }
  };

  const handleSkip = async () => {
    await mining.submitAnswer('', [], true);
  };

  const isLoading = mining.loading || isStartingSession || isGeneratingNext;

  // Generate mock session metrics for the progress tracker
  const getSessionMetrics = () => {
    if (!mining.currentSession) {
      return {
        currentStreak: 0,
        sessionAccuracy: 0,
        averageComplexity: 50,
        wordsEncountered: 0,
        newWordsLearned: 0,
        difficulty: selectedDifficulty,
        totalExercises: 0,
        correctExercises: 0
      };
    }

    const sessionAccuracy = mining.currentSession.totalAttempts > 0 
      ? (mining.currentSession.totalCorrect / mining.currentSession.totalAttempts) * 100 
      : 0;

    return {
      currentStreak: mining.currentSession.totalCorrect,
      sessionAccuracy,
      averageComplexity: mining.currentSession.difficulty === 'advanced' ? 85 : 
                        mining.currentSession.difficulty === 'intermediate' ? 65 : 45,
      wordsEncountered: mining.currentSession.totalAttempts,
      newWordsLearned: Math.floor(mining.currentSession.totalAttempts * 0.6),
      difficulty: mining.currentSession.difficulty_level as DifficultyLevel,
      totalExercises: mining.currentSession.totalAttempts,
      correctExercises: mining.currentSession.totalCorrect
    };
  };

  // Generate mock difficulty progress for the selector
  const getDifficultyProgress = () => {
    if (!mining.progress) return undefined;
    
    return {
      beginner: { attempted: 25, correct: 22, accuracy: 88 },
      intermediate: { attempted: 15, correct: 11, accuracy: 73 },
      advanced: { attempted: 8, correct: 5, accuracy: 62 }
    };
  };

  if (isLoading && !mining.currentSession) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isStartingSession ? 'Starting session and generating first exercise...' : 'Loading sentence mining...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="practice" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="practice" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Practice
          </TabsTrigger>
          <TabsTrigger value="vocabulary" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Vocabulary
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="space-y-6">
          {!mining.currentSession ? (
            <div className="space-y-6">
              {/* Vocabulary Progress Overview */}
              {mining.vocabularyStats && (
                <VocabularyProgressIndicator vocabularyStats={mining.vocabularyStats} />
              )}

              {/* Enhanced Difficulty Selection */}
              <EnhancedDifficultySelector
                onSelectDifficulty={handleStartSession}
                progress={getDifficultyProgress()}
                recommendedDifficulty="intermediate"
                confidenceScore={0.8}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Session Header with Progress Tracker */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">
                            {capitalizeLanguage(mining.currentSession.language)}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {mining.currentSession.difficulty}
                          </Badge>
                          {mining.currentExercise?.targetWord && (
                            <WordMasteryIndicator
                              word={mining.currentExercise.targetWord}
                              masteryLevel={calculateMasteryLevel(3, 2)}
                              encounters={3}
                              correctCount={2}
                              showProgress={false}
                            />
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={mining.endSession}
                        >
                          End Session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <EnhancedProgressTracker 
                  metrics={getSessionMetrics()}
                  className="lg:col-span-1"
                />
              </div>

              {/* Current Exercise */}
              {mining.currentExercise ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ClozeExercise
                      exercise={mining.currentExercise}
                      userResponse={mining.userResponse}
                      showResult={mining.showResult}
                      isCorrect={mining.isCorrect}
                      loading={isGeneratingNext}
                      onResponseChange={mining.updateUserResponse}
                      onSubmit={handleSubmitAnswer}
                      onNext={handleNextExercise}
                      onSkip={handleSkip}
                      showTranslation={mining.showTranslation}
                      onToggleTranslation={mining.toggleTranslation}
                    />
                  </div>
                  
                  <div className="lg:col-span-1">
                    <EnhancedExerciseDisplay
                      exercise={mining.currentExercise}
                      showTranslation={mining.showTranslation}
                      onToggleTranslation={mining.toggleTranslation}
                    />
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                      {isGeneratingNext ? 'Generating next exercise...' : 'Generating personalized exercise...'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vocabulary" className="space-y-6">
          <EnhancedVocabularyStats />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {mining.progress && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mining.progress.totalSessions}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Exercises Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mining.progress.totalExercises}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mining.progress.averageAccuracy}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Words Learned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mining.progress.vocabularyStats.totalWordsEncountered}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
