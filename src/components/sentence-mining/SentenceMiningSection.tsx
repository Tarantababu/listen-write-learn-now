
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProgressiveSentenceMining } from '@/hooks/use-progressive-sentence-mining';
import { useFullyAdaptiveSentenceMining } from '@/hooks/use-fully-adaptive-sentence-mining';
import { EnhancedDifficultySelector } from './EnhancedDifficultySelector';
import { EnhancedExerciseDisplay } from './EnhancedExerciseDisplay';
import { EnhancedProgressTracker } from './EnhancedProgressTracker';
import { ExerciseInput } from './ExerciseInput';
import { UserResponse } from './UserResponse';
import { DifficultyLevel } from '@/types/sentence-mining';
import { Brain, TrendingUp, Lightbulb, Zap } from 'lucide-react';

export const SentenceMiningSection: React.FC = () => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeMode, setActiveMode] = useState<'progressive' | 'adaptive'>('progressive');
  
  // Progressive sentence mining hook
  const progressiveMining = useProgressiveSentenceMining();
  
  // Adaptive sentence mining hook (existing)
  const adaptiveMining = useFullyAdaptiveSentenceMining();
  
  // Choose which system to use based on active mode
  const activeMining = activeMode === 'progressive' ? progressiveMining : adaptiveMining;

  useEffect(() => {
    if (activeMode === 'progressive' && progressiveMining.progressionInsights === null) {
      progressiveMining.getProgressionInsights();
    }
  }, [activeMode]);

  const handleStartSession = async (difficulty: DifficultyLevel) => {
    if (activeMode === 'progressive') {
      await progressiveMining.startProgressiveSession(difficulty);
    } else {
      await adaptiveMining.startAdaptiveSession(difficulty);
    }
  };

  const handleSubmitAnswer = async (response: string) => {
    await activeMining.submitAnswer(response);
  };

  const handleNextExercise = async () => {
    await activeMining.nextExercise();
  };

  const handleEndSession = async () => {
    await activeMining.endSession();
  };

  const renderSessionSelector = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Choose Learning Mode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'progressive' | 'adaptive')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progressive" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progressive AI
            </TabsTrigger>
            <TabsTrigger value="adaptive" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Adaptive
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="progressive" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Progressive AI Mode</h4>
                  <p className="text-sm text-blue-700">
                    AI analyzes your vocabulary progress and introduces words in optimal learning sequences. 
                    Words progress from simple to advanced based on your mastery patterns.
                  </p>
                </div>
              </div>
              
              {progressiveMining.progressionInsights && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-800">{progressiveMining.progressionInsights.masteredWords}</div>
                    <div className="text-green-600">Mastered</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold text-blue-800">{progressiveMining.progressionInsights.learningWords}</div>
                    <div className="text-blue-600">Learning</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="font-bold text-purple-800">Level {progressiveMining.progressionInsights.currentLevel}</div>
                    <div className="text-purple-600">Current</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="font-bold text-orange-800">{Math.round(progressiveMining.progressionInsights.recommendedComplexity)}%</div>
                    <div className="text-orange-600">Complexity</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="adaptive" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Zap className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900">Adaptive Mode</h4>
                  <p className="text-sm text-purple-700">
                    Dynamic difficulty adjustment based on your real-time performance. 
                    AI recommends optimal difficulty levels for each session.
                  </p>
                </div>
              </div>
              
              {adaptiveMining.sessionConfig && (
                <div className="text-sm">
                  <Badge variant="outline">
                    AI suggests: {adaptiveMining.sessionConfig.suggestedDifficulty} level
                  </Badge>
                  {adaptiveMining.sessionConfig.confidence > 0.7 && (
                    <Badge variant="secondary" className="ml-2">
                      {Math.round(adaptiveMining.sessionConfig.confidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  const renderSessionMetrics = () => {
    if (!activeMining.currentSession) return null;

    const session = activeMining.currentSession;
    const accuracy = session.total_exercises > 0 ? (session.correct_exercises / session.total_exercises) * 100 : 0;

    return (
      <EnhancedProgressTracker
        metrics={{
          currentStreak: session.correct_exercises,
          sessionAccuracy: accuracy,
          averageComplexity: 60, // Could be calculated from exercises
          wordsEncountered: session.new_words_encountered,
          newWordsLearned: session.words_mastered,
          difficulty: session.difficulty_level as DifficultyLevel,
          totalExercises: session.total_exercises,
          correctExercises: session.correct_exercises
        }}
        className="mb-6"
      />
    );
  };

  // If no active session, show difficulty selector
  if (!activeMining.currentSession) {
    return (
      <div className="space-y-6">
        {renderSessionSelector()}
        
        <EnhancedDifficultySelector
          onSelectDifficulty={handleStartSession}
          recommendedDifficulty={adaptiveMining.sessionConfig?.suggestedDifficulty}
          confidenceScore={adaptiveMining.sessionConfig?.confidence}
        />
      </div>
    );
  }

  // Active session view
  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="capitalize">
            {activeMode} Mode
          </Badge>
          <Badge variant="secondary">
            {activeMining.currentSession.difficulty_level} Level
          </Badge>
          {activeMode === 'progressive' && progressiveMining.progressionInsights?.readyForProgression && (
            <Badge variant="default" className="bg-green-600">
              Ready for Progression
            </Badge>
          )}
        </div>
        
        <Button variant="outline" onClick={handleEndSession}>
          End Session
        </Button>
      </div>

      {/* Progress Tracker */}
      {renderSessionMetrics()}

      {/* Current Exercise */}
      {activeMining.currentExercise && (
        <div className="space-y-6">
          <EnhancedExerciseDisplay
            exercise={activeMining.currentExercise}
            showTranslation={showTranslation}
            onToggleTranslation={() => setShowTranslation(!showTranslation)}
          />

          {!activeMining.showResult ? (
            <ExerciseInput
              onSubmit={handleSubmitAnswer}
              disabled={activeMining.loading}
              userResponse={activeMining.userResponse}
              setUserResponse={activeMining.setUserResponse}
            />
          ) : (
            <div className="space-y-4">
              <UserResponse
                exercise={activeMining.currentExercise}
                userResponse={activeMining.userResponse}
                isCorrect={activeMining.isCorrect}
                showTranslation={showTranslation}
              />
              
              <div className="flex justify-center">
                <Button onClick={handleNextExercise} disabled={activeMining.loading}>
                  {activeMining.loading ? 'Generating...' : 'Next Exercise'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {activeMining.loading && !activeMining.currentExercise && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">
                {activeMode === 'progressive' ? 'AI analyzing your progression...' : 'Generating adaptive exercise...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
