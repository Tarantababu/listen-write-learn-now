
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

// Simple progress type for the component
interface SimpleProgress {
  correct: number;
  total: number;
}

export const OptimizedSentenceMiningSection: React.FC<OptimizedSentenceMiningSectionProps> = ({
  language,
  difficulty,
  onDifficultyChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use state from the enhanced hook instead of managing our own
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

  // Local state for exercises history and session tracking
  const [exercises, setExercises] = useState<SentenceMiningExercise[]>([]);
  const [sessionActive, setSessionActive] = useState(false);

  // Update session active state based on currentSession
  useEffect(() => {
    setSessionActive(!!currentSession);
  }, [currentSession]);

  // Update exercises when a new exercise is generated
  useEffect(() => {
    if (currentExercise) {
      setExercises(prev => {
        const exists = prev.find(ex => ex.id === currentExercise.id);
        return exists ? prev : [...prev, currentExercise];
      });
    }
  }, [currentExercise]);

  const handleStartSession = useCallback(async () => {
    if (!user) {
      toast({
        title: "Not authenticated.",
        description: "You must be logged in to start a session.",
      })
      return;
    }

    try {
      await startSession(difficulty);
      setExercises([]);
      
      toast({
        title: "Session started!",
        description: "Let's start learning.",
      })
    } catch (error) {
      console.error("Failed to start session:", error);
      toast({
        title: "Session start failed.",
        description: "Please try again.",
      })
    }
  }, [user, startSession, difficulty, toast]);

  const handleGenerateExercise = useCallback(async () => {
    if (!sessionActive) {
      toast({
        title: "No active session.",
        description: "Please start a session first.",
      })
      return;
    }

    try {
      await nextExercise();
      
      toast({
        title: "New exercise generated!",
        description: "Complete the sentence below.",
      })
    } catch (error) {
      console.error("Failed to generate exercise:", error);
      toast({
        title: "Exercise generation failed.",
        description: "Please try again.",
      })
    }
  }, [sessionActive, nextExercise, toast]);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!currentExercise) {
      toast({
        title: "No active exercise.",
        description: "Please generate an exercise first.",
      })
      return;
    }

    try {
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
        title: updatedExercise.isCorrect ? "Correct!" : "Incorrect.",
        description: updatedExercise.isCorrect ? "Great job!" : "Try again next time.",
      })
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  }, [currentExercise, submitAnswer, toast]);

  const handleEndSession = useCallback(async () => {
    if (!currentSession) {
      toast({
        title: "No active session.",
        description: "Please start a session first.",
      })
      return;
    }

    try {
      await endSession();
      setExercises([]);
      toast({
        title: "Session ended!",
        description: "See you next time.",
      })
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  }, [currentSession, endSession, toast]);

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
            <Button onClick={handleStartSession} disabled={loading}>
              {loading ? "Starting Session..." : "Start Session"}
            </Button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
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
                    disabled={loading}
                  />
                </>
              ) : (
                <Button onClick={handleGenerateExercise} disabled={loading}>
                  {loading ? "Generating Exercise..." : "Generate Exercise"}
                </Button>
              )}
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </CardContent>
          </Card>

          <Button onClick={handleEndSession} disabled={loading} variant="destructive">
            {loading ? "Ending Session..." : "End Session"}
          </Button>
        </div>
      )}
    </div>
  );
};
