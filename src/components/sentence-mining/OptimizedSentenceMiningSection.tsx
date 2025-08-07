import React from 'react';
import { DifficultyLevel } from '@/types/sentence-mining';
import { useOptimizedSentenceMining } from '@/hooks/use-optimized-sentence-mining';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, TrendingUp, BarChart3, Lightbulb, RefreshCw } from 'lucide-react';
import { EnhancedDiversityInsights } from './EnhancedDiversityInsights';

export const OptimizedSentenceMiningSection: React.FC = () => {
  const {
    currentSession,
    currentExercise,
    userResponse,
    showResult,
    isCorrect,
    loading,
    error,
    progress,
    showHint,
    showTranslation,
    isGeneratingNext,
    exerciseCount,
    averageResponseTime,
    sessionQuality,
    preloadStatus,
    diversityMetrics,
    wordPoolStats,
    diversityInsights,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleTranslation,
    toggleHint,
    getPerformanceMetrics,
    getDiversityInsights,
    getWordPoolInfo
  } = useOptimizedSentenceMining();

  const handleStartSession = (difficulty: DifficultyLevel) => {
    startSession(difficulty);
  };

  const handleSubmitAnswer = () => {
    submitAnswer(userResponse);
  };

  const handleNextExercise = () => {
    nextExercise();
  };

  const handleEndSession = () => {
    endSession();
  };

  const handleUpdateUserResponse = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateUserResponse(event.target.value);
  };

  if (currentSession && currentExercise) {
    return (
      <div className="space-y-6">
        {/* Enhanced header with diversity info */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Enhanced Sentence Mining
                  <Badge variant="secondary" className="ml-2">
                    {currentSession.difficulty_level}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-powered vocabulary practice with smart diversity
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{exerciseCount}</div>
                <div className="text-xs text-muted-foreground">exercises</div>
              </div>
            </div>

            {/* Enhanced progress indicators */}
            {diversityMetrics && (
              <div className="flex items-center gap-4 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Diversity:</div>
                  <Badge variant={diversityMetrics.overallScore >= 80 ? "default" : diversityMetrics.overallScore >= 60 ? "secondary" : "destructive"}>
                    {diversityMetrics.overallScore}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Quality:</div>
                  <Badge variant="outline">
                    {Math.round(sessionQuality)}%
                  </Badge>
                </div>
                {wordPoolStats && (
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">Available:</div>
                    <Badge variant="outline">
                      {wordPoolStats.availableWords}/{wordPoolStats.totalWords}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            {/* Exercise display */}
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-muted/20 to-muted/10 rounded-lg border">
                <blockquote className="text-lg leading-relaxed">
                  {currentExercise.clozeSentence.split('___').map((part, index, array) => (
                    <React.Fragment key={index}>
                      {part}
                      {index < array.length - 1 && (
                        <span className="inline-block mx-2 px-3 py-1 bg-primary/10 border-2 border-dashed border-primary/30 rounded text-primary font-medium min-w-[80px] text-center">
                          {showResult ? currentExercise.targetWord : '___'}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </blockquote>
              </div>

              {/* Answer input and buttons */}
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={userResponse}
                  onChange={handleUpdateUserResponse}
                  disabled={showResult || loading}
                />
                <div className="flex justify-between">
                  <Button
                    variant="secondary"
                    onClick={toggleHint}
                    disabled={showHint}
                  >
                    {showHint ? 'Hint Shown' : 'Show Hint'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={toggleTranslation}
                    disabled={showTranslation}
                  >
                    {showTranslation ? 'Translation Shown' : 'Show Translation'}
                  </Button>
                </div>
              </div>

              {/* Submit and Next buttons */}
              <div className="flex justify-end gap-2">
                {showResult ? (
                  <Button onClick={handleNextExercise} disabled={loading || isGeneratingNext}>
                    {isGeneratingNext ? 'Generating...' : 'Next Exercise'}
                  </Button>
                ) : (
                  <Button onClick={handleSubmitAnswer} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                )}
              </div>

              {/* Result display */}
              {showResult && (
                <div className={`p-4 rounded-md ${isCorrect ? 'bg-green-100 border border-green-500 text-green-700' : 'bg-red-100 border border-red-500 text-red-700'}`}>
                  {isCorrect ? 'Correct!' : `Incorrect. The correct answer was: ${currentExercise.correctAnswer}`}
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="p-4 rounded-md bg-red-100 border border-red-500 text-red-700">
                  Error: {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Diversity Insights */}
        <EnhancedDiversityInsights
          diversityMetrics={diversityMetrics}
          wordPoolStats={wordPoolStats}
          insights={diversityInsights}
          exerciseCount={exerciseCount}
          sessionQuality={sessionQuality}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced welcome screen */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Brain className="h-6 w-6" />
            Enhanced Sentence Mining
          </CardTitle>
          <p className="text-muted-foreground">
            AI-powered vocabulary learning with intelligent word diversity and smart recommendations
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced features showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 border rounded-lg">
              <Target className="h-5 w-5 mb-2 text-primary" />
              <h3 className="font-medium mb-1">Intelligent Word Selection</h3>
              <p className="text-sm text-muted-foreground">
                AI chooses optimal vocabulary based on your learning progress and word diversity needs
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <RefreshCw className="h-5 w-5 mb-2 text-primary" />
              <h3 className="font-medium mb-1">Smart Cooldown System</h3>
              <p className="text-sm text-muted-foreground">
                Prevents word repetition and ensures varied practice across different contexts
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <BarChart3 className="h-5 w-5 mb-2 text-primary" />
              <h3 className="font-medium mb-1">Diversity Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Real-time analysis of vocabulary variety and learning pattern diversity
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <TrendingUp className="h-5 w-5 mb-2 text-primary" />
              <h3 className="font-medium mb-1">Performance Insights</h3>
              <p className="text-sm text-muted-foreground">
                Detailed analytics on your learning progress and recommendations for improvement
              </p>
            </div>
          </div>

          {/* Difficulty selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/50"
              onClick={() => startSession('beginner')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🌱</div>
                <h3 className="font-medium mb-1">Beginner</h3>
                <p className="text-sm text-muted-foreground">Essential vocabulary and common words</p>
                <Badge variant="outline" className="mt-2">A1-A2 Level</Badge>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/50"
              onClick={() => startSession('intermediate')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="font-medium mb-1">Intermediate</h3>
                <p className="text-sm text-muted-foreground">Complex expressions and nuanced vocabulary</p>
                <Badge variant="outline" className="mt-2">B1-B2 Level</Badge>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/50"
              onClick={() => startSession('advanced')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-medium mb-1">Advanced</h3>
                <p className="text-sm text-muted-foreground">Sophisticated and specialized terminology</p>
                <Badge variant="outline" className="mt-2">C1-C2 Level</Badge>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Progress overview with enhanced metrics */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Your Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{progress.totalSessions}</div>
                <div className="text-sm text-muted-foreground">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{progress.totalExercises}</div>
                <div className="text-sm text-muted-foreground">Exercises</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{progress.averageAccuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{progress.totalCorrect}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
