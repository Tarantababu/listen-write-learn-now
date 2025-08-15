
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, BarChart3, BookOpen } from 'lucide-react';
import { DifficultyLevel } from '@/types/sentence-mining';
import { useEnhancedSentenceMining } from '@/hooks/use-enhanced-sentence-mining';
import { MinimalistClozeExercise } from './exercises/MinimalistClozeExercise';
import { EnhancedVocabularyStats } from './EnhancedVocabularyStats';
import { VocabularyProgressIndicator } from './VocabularyProgressIndicator';
import { EnhancedDifficultySelector } from './EnhancedDifficultySelector';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

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
      console.log('[SentenceMiningSection] Starting enhanced session with difficulty:', difficulty);
      
      const session = await mining.startSession(difficulty);
      console.log('[SentenceMiningSection] Enhanced session created:', session?.id);
      
      console.log('[SentenceMiningSection] Generating first exercise...');
      await mining.nextExercise(session);
      console.log('[SentenceMiningSection] First exercise generated successfully');
      
    } catch (error) {
      console.error('[SentenceMiningSection] Failed to start enhanced session:', error);
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
      console.log('[SentenceMiningSection] Generating next enhanced exercise');
      await mining.nextExercise(mining.currentSession);
      console.log('[SentenceMiningSection] Next enhanced exercise generated successfully');
    } catch (error) {
      console.error('[SentenceMiningSection] Failed to generate next enhanced exercise:', error);
    } finally {
      setIsGeneratingNext(false);
    }
  };

  const handleSkip = async () => {
    await mining.submitAnswer('', [], true);
  };

  const isLoading = mining.loading || isStartingSession || isGeneratingNext;

  // Simplified loading state
  if (isLoading && !mining.currentSession) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {isStartingSession ? 'Starting your session...' : 'Loading...'}
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
            <div className="space-y-8">
              {/* Minimalist Difficulty Selection */}
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Choose Your Level</h2>
                  <p className="text-muted-foreground">Start practicing with {settings.selectedLanguage}</p>
                </div>
                
                <div className="space-y-3">
                  {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map(level => (
                    <Button
                      key={level}
                      variant={level === selectedDifficulty ? 'default' : 'outline'}
                      className="w-full py-3 text-left justify-start capitalize"
                      onClick={() => handleStartSession(level)}
                      disabled={isLoading}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Current Exercise - Minimalist Design
            <div className="w-full">
              {mining.currentExercise ? (
                <MinimalistClozeExercise
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
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                      {isGeneratingNext ? 'Preparing next exercise...' : 'Generating personalized exercise...'}
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
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{mining.progress.totalSessions}</div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{mining.progress.totalExercises}</div>
                  <p className="text-sm text-muted-foreground">Exercises Completed</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{mining.progress.averageAccuracy}%</div>
                  <p className="text-sm text-muted-foreground">Average Accuracy</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {mining.progress.vocabularyStats.totalWordsEncountered}
                  </div>
                  <p className="text-sm text-muted-foreground">Words Learned</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
