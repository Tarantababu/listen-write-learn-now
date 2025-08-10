
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@/contexts/AuthContext';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise } from '@/types/sentence-mining';
import { ExerciseDisplay } from './ExerciseDisplay';
import { ExerciseInput } from './ExerciseInput';
import { ProgressBar } from './ProgressBar';
import { useEnhancedSentenceMining } from '@/hooks/use-enhanced-sentence-mining';
import { WordDiversityMonitor } from './WordDiversityMonitor';

interface OptimizedSentenceMiningSectionProps {
  language: string;
  difficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
}

export const OptimizedSentenceMiningSection: React.FC<OptimizedSentenceMiningSectionProps> = ({
  language,
  difficulty,
  onDifficultyChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use the enhanced hook
  const {
    currentSession,
    currentExercise,
    progress,
    loading,
    error,
    startSession,
    submitAnswer,
    endSession,
    nextExercise
  } = useEnhancedSentenceMining();

  // Local state for exercises history
  const [exercises, setExercises] = useState<SentenceMiningExercise[]>([]);
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);

  // Update exercises when a new exercise is generated
  useEffect(() => {
    if (currentExercise) {
      console.log('[OptimizedSentenceMining] New exercise received:', currentExercise.id);
      setExercises(prev => {
        const exists = prev.find(ex => ex.id === currentExercise.id);
        return exists ? prev : [...prev, currentExercise];
      });
      setIsGeneratingExercise(false);
    }
  }, [currentExercise]);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      console.error('[OptimizedSentenceMining] Error occurred:', error);
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
      setIsGeneratingExercise(false);
    }
  }, [error, toast]);

  const handleStartSession = useCallback(async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to start a session.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[OptimizedSentenceMining] Starting session with difficulty:', difficulty);
      
      const session = await startSession(difficulty);
      
      if (session) {
        setExercises([]);
        
        // Generate first exercise immediately after session creation
        console.log('[OptimizedSentenceMining] Session created, generating first exercise...');
        setIsGeneratingExercise(true);
        
        // Call nextExercise to generate the first exercise
        await nextExercise();
        
        toast({
          title: "Session started!",
          description: "Generating your first exercise...",
        });
      }
    } catch (error) {
      console.error('[OptimizedSentenceMining] Failed to start session:', error);
      toast({
        title: "Session start failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
      setIsGeneratingExercise(false);
    }
  }, [user, startSession, difficulty, toast, nextExercise]);

  const handleGenerateExercise = useCallback(async () => {
    if (!currentSession) {
      toast({
        title: "No active session",
        description: "Please start a session first.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[OptimizedSentenceMining] Generating new exercise for session:', currentSession.id);
      setIsGeneratingExercise(true);
      
      await nextExercise();
      
      console.log('[OptimizedSentenceMining] Exercise generation completed');
    } catch (error) {
      console.error('[OptimizedSentenceMining] Failed to generate exercise:', error);
      toast({
        title: "Exercise generation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
      setIsGeneratingExercise(false);
    }
  }, [currentSession, nextExercise, toast]);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!currentExercise) {
      toast({
        title: "No active exercise",
        description: "Please generate an exercise first.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[OptimizedSentenceMining] Submitting answer for exercise:', currentExercise.id);
      
      await submitAnswer(answer);
      
      // Update the exercise in the exercises array
      const updatedExercise: SentenceMiningExercise = {
        ...currentExercise,
        isCorrect: answer.toLowerCase().trim() === currentExercise.correctAnswer?.toLowerCase().trim(),
        userAnswer: answer,
        attempts: currentExercise.attempts + 1
      };

      setExercises(prevExercises =>
        prevExercises.map(ex => (ex.id === updatedExercise.id ? updatedExercise : ex))
      );

      toast({
        title: updatedExercise.isCorrect ? "Correct!" : "Incorrect",
        description: updatedExercise.isCorrect ? "Great job!" : "Try again next time.",
      });
    } catch (error) {
      console.error('[OptimizedSentenceMining] Failed to submit answer:', error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  }, [currentExercise, submitAnswer, toast]);

  const handleEndSession = useCallback(async () => {
    if (!currentSession) {
      toast({
        title: "No active session",
        description: "Please start a session first.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[OptimizedSentenceMining] Ending session:', currentSession.id);
      
      await endSession();
      setExercises([]);
      setIsGeneratingExercise(false);
      
      toast({
        title: "Session ended!",
        description: "See you next time.",
      });
    } catch (error) {
      console.error('[OptimizedSentenceMining] Failed to end session:', error);
      toast({
        title: "Failed to end session",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  }, [currentSession, endSession, toast]);

  const isLoadingOrGenerating = loading || isGeneratingExercise;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sentence Mining</h2>
        <div className="flex items-center space-x-4">
          <Label htmlFor="difficulty" className="text-sm font-medium">Difficulty:</Label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as DifficultyLevel)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled={!!currentSession}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {!currentSession && (
        <Card>
          <CardHeader>
            <CardTitle>Start a New Session</CardTitle>
            <CardDescription>Click the button below to begin a new sentence mining session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStartSession} disabled={isLoadingOrGenerating}>
              {isLoadingOrGenerating ? "Starting Session..." : "Start Session"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Word Diversity Monitor */}
      {currentSession && exercises.length > 0 && (
        <WordDiversityMonitor
          language={language}
          sessionId={currentSession.id}
          exercises={exercises.map(e => ({
            targetWord: e.targetWord,
            createdAt: e.createdAt
          }))}
        />
      )}

      {currentSession && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Progress</CardTitle>
              <CardDescription>Track your progress in this session.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressBar progress={progress || { correct: 0, total: 0 }} />
              <div className="mt-2 text-sm">
                Correct: {progress?.correct || 0} / Total: {progress?.total || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Exercise</CardTitle>
              <CardDescription>Complete the sentence by filling in the blank.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentExercise ? (
                <>
                  <ExerciseDisplay exercise={currentExercise} />
                  <ExerciseInput
                    onSubmit={handleSubmitAnswer}
                    disabled={isLoadingOrGenerating}
                  />
                </>
              ) : (
                <div className="space-y-4">
                  {isGeneratingExercise ? (
                    <div className="text-center p-4">
                      <div className="text-lg text-muted-foreground">
                        Generating personalized exercise...
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        This may take a few moments
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleGenerateExercise} disabled={isLoadingOrGenerating}>
                      {isLoadingOrGenerating ? "Generating Exercise..." : "Generate Exercise"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleEndSession} disabled={isLoadingOrGenerating} variant="destructive">
            {isLoadingOrGenerating ? "Ending Session..." : "End Session"}
          </Button>
        </div>
      )}
    </div>
  );
};
