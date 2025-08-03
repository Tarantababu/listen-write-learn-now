
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useOptimizedSentenceMining } from '@/hooks/use-optimized-sentence-mining';
import { DifficultyLevel } from '@/types/sentence-mining';
import { Loader2, Zap, Target, Clock, TrendingUp } from 'lucide-react';

export const OptimizedSentenceMiningSection = () => {
  const {
    currentSession,
    currentExercise,
    userResponse,
    showResult,
    isCorrect,
    loading,
    error,
    showTranslation,
    showHint,
    isGeneratingNext,
    exerciseCount,
    averageResponseTime,
    sessionQuality,
    preloadStatus,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleTranslation,
    toggleHint,
    getPerformanceMetrics
  } = useOptimizedSentenceMining();

  const handleStartSession = (difficulty: DifficultyLevel) => {
    startSession(difficulty);
  };

  const handleSubmitAnswer = () => {
    submitAnswer(userResponse.trim());
  };

  const handleSkip = () => {
    submitAnswer('', [], true);
  };

  const performanceMetrics = getPerformanceMetrics();

  if (!currentSession) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="h-8 w-8 text-blue-500" />
              <CardTitle className="text-2xl">Optimized Sentence Mining</CardTitle>
            </div>
            <CardDescription className="text-lg">
              Enhanced AI-powered language learning with smart preloading and performance optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold">Smart Word Selection</h3>
                <p className="text-sm text-muted-foreground">AI analyzes your progress</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold">Instant Exercises</h3>
                <p className="text-sm text-muted-foreground">Preloaded for speed</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <h3 className="font-semibold">Performance Tracking</h3>
                <p className="text-sm text-muted-foreground">Real-time metrics</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => handleStartSession('beginner')}
                disabled={loading}
                variant="outline"
                className="flex-1 max-w-xs"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Beginner
              </Button>
              <Button 
                onClick={() => handleStartSession('intermediate')}
                disabled={loading}
                variant="outline" 
                className="flex-1 max-w-xs"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Intermediate
              </Button>
              <Button 
                onClick={() => handleStartSession('advanced')}
                disabled={loading}
                variant="outline"
                className="flex-1 max-w-xs"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Advanced
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Performance Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <div className="text-sm text-muted-foreground">Exercises</div>
          <div className="text-2xl font-bold">{exerciseCount}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
          <div className="text-sm text-muted-foreground">Avg Speed</div>
          <div className="text-2xl font-bold">{averageResponseTime}ms</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
          <div className="text-sm text-muted-foreground">Quality</div>
          <div className="text-2xl font-bold">{Math.round(sessionQuality)}%</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
          <div className="text-sm text-muted-foreground">Preload</div>
          <div className="flex items-center gap-1">
            <Badge 
              variant={preloadStatus === 'ready' ? 'default' : preloadStatus === 'loading' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {preloadStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Exercise Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">
                {currentSession.language.charAt(0).toUpperCase() + currentSession.language.slice(1)} - {currentSession.difficulty}
              </CardTitle>
              <CardDescription>
                Complete the sentence by filling in the blank
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{currentExercise?.targetWord || 'Loading...'}</Badge>
              {preloadStatus === 'ready' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Zap className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {currentExercise ? (
            <>
              {/* Exercise Sentence */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                <p className="text-xl md:text-2xl font-medium leading-relaxed">
                  {currentExercise.clozeSentence}
                </p>
                {showTranslation && currentExercise.translation && (
                  <p className="text-sm text-muted-foreground mt-3 italic">
                    {currentExercise.translation}
                  </p>
                )}
              </div>

              {/* Answer Input */}
              <div className="space-y-3">
                <Input
                  value={userResponse}
                  onChange={(e) => updateUserResponse(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={showResult || loading || isGeneratingNext}
                  className="text-center text-lg py-3"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !showResult && userResponse.trim()) {
                      handleSubmitAnswer();
                    }
                  }}
                />

                {/* Hints */}
                {showHint && currentExercise.hints && currentExercise.hints.length > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm">💡 <strong>Hint:</strong> {currentExercise.hints[0]}</p>
                  </div>
                )}

                {/* Result */}
                {showResult && (
                  <div className={`p-4 rounded-lg border ${
                    isCorrect 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  }`}>
                    <p className={`text-center font-semibold ${
                      isCorrect 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                    </p>
                    {!isCorrect && (
                      <p className="text-center text-sm mt-2">
                        The correct answer is: <strong>{currentExercise.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                {!showResult ? (
                  <>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={!userResponse.trim() || loading}
                      className="px-8"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit
                    </Button>
                    <Button variant="outline" onClick={handleSkip} disabled={loading}>
                      Skip
                    </Button>
                    <Button variant="ghost" onClick={toggleHint}>
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </Button>
                    <Button variant="ghost" onClick={toggleTranslation}>
                      {showTranslation ? 'Hide Translation' : 'Show Translation'}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={nextExercise} 
                    disabled={isGeneratingNext}
                    className="px-8"
                  >
                    {isGeneratingNext && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {preloadStatus === 'ready' ? 'Next Exercise' : 'Generate Next'}
                  </Button>
                )}
              </div>

              {/* Context */}
              {currentExercise.context && (
                <div className="text-center text-sm text-muted-foreground">
                  <p><strong>Context:</strong> {currentExercise.context}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Generating your first optimized exercise...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Controls */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={endSession} disabled={loading}>
          End Session
        </Button>
      </div>
    </div>
  );
};
