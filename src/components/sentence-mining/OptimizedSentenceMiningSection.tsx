
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

  const [currentSession, setCurrentSession] = useState<SentenceMiningSession | null>(null);
  const [exercises, setExercises] = useState<SentenceMiningExercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<SentenceMiningExercise | null>(null);
  const [progress, setProgress] = useState<SimpleProgress>({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const {
    generateExercise,
    submitAnswer,
    startNewSession,
    endSession
  } = useEnhancedSentenceMining(language, difficulty);

  const handleStartSession = useCallback(async () => {
    if (!user) {
      toast({
        title: "Not authenticated.",
        description: "You must be logged in to start a session.",
      })
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newSession = await startNewSession();
      if (newSession) {
        setCurrentSession(newSession);
        setExercises([]);
        setCurrentExercise(null);
        setProgress({ correct: 0, total: 0 });
        setSessionActive(true);
        toast({
          title: "Session started!",
          description: "Let's start learning.",
        })
      } else {
        toast({
          title: "Session start failed.",
          description: "Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to start session:", error);
      setError("Failed to start session. Please try again.");
      toast({
        title: "Session start failed.",
        description: "Please try again.",
      })
    } finally {
      setLoading(false);
    }
  }, [user, startNewSession, toast]);

  const handleGenerateExercise = useCallback(async () => {
    if (!sessionActive) {
      toast({
        title: "No active session.",
        description: "Please start a session first.",
      })
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newExercise = await generateExercise();
      if (newExercise) {
        setCurrentExercise(newExercise);
        setExercises(prev => {
          const exists = prev.find(ex => ex.id === newExercise.id);
          return exists ? prev : [...prev, newExercise];
        });
      } else {
        toast({
          title: "Exercise generation failed.",
          description: "Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to generate exercise:", error);
      setError("Failed to generate exercise. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sessionActive, generateExercise, toast]);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!currentExercise) {
      toast({
        title: "No active exercise.",
        description: "Please generate an exercise first.",
      })
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const isCorrect = await submitAnswer(currentExercise, answer);
      if (isCorrect !== null) {
        const updatedExercise: SentenceMiningExercise = {
          ...currentExercise,
          isCorrect: isCorrect,
          userAnswer: answer,
          attempts: currentExercise.attempts + 1
        };

        // Update the exercise in the exercises array
        setExercises(prevExercises =>
          prevExercises.map(ex => (ex.id === updatedExercise.id ? updatedExercise : ex))
        );
        setCurrentExercise(null);

        // Update progress
        setProgress(prevProgress => {
          const newTotal = prevProgress.total + 1;
          const newCorrect = isCorrect ? prevProgress.correct + 1 : prevProgress.correct;
          return { correct: newCorrect, total: newTotal };
        });

        toast({
          title: isCorrect ? "Correct!" : "Incorrect.",
          description: isCorrect ? "Great job!" : "Try again next time.",
        })
      } else {
        toast({
          title: "Answer submission failed.",
          description: "Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setError("Failed to submit answer. Please try again.");
    } finally {
      setLoading(false);
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
      setLoading(true);
      setError(null);

      await endSession(currentSession);
      setCurrentSession(null);
      setExercises([]);
      setCurrentExercise(null);
      setProgress({ correct: 0, total: 0 });
      setSessionActive(false);
      toast({
        title: "Session ended!",
        description: "See you next time.",
      })
    } catch (error) {
      console.error("Failed to end session:", error);
      setError("Failed to end session. Please try again.");
    } finally {
      setLoading(false);
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
              <ProgressBar progress={progress} />
              <div className="mt-2 text-sm">
                Correct: {progress.correct} / Total: {progress.total}
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
