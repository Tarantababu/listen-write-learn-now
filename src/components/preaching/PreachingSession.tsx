
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mic, Volume2, ChevronRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { preachingService } from '@/services/preachingService';
import type { 
  Noun, 
  PreachingSession as Session, 
  PreachingDifficulty, 
  PreachingStep,
  GenderTest,
  PatternDrill,
  DrillAttempt 
} from '@/types/preaching';
import MemorizingStep from './MemorizingStep';
import TestingStep from './TestingStep';
import DrillingStep from './DrillingStep';
import FeedbackStep from './FeedbackStep';

interface PreachingSessionProps {
  onComplete?: () => void;
  onExit?: () => void;
}

const PreachingSession: React.FC<PreachingSessionProps> = ({ onComplete, onExit }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentStep, setCurrentStep] = useState<PreachingStep>('memorizing');
  const [difficulty, setDifficulty] = useState<PreachingDifficulty>('simple');
  const [nouns, setNouns] = useState<Noun[]>([]);
  const [genderTests, setGenderTests] = useState<GenderTest[]>([]);
  const [drillAttempts, setDrillAttempts] = useState<DrillAttempt[]>([]);
  const [currentDrill, setCurrentDrill] = useState<PatternDrill | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    setLoading(true);
    try {
      const generatedNouns = await preachingService.generateNouns(difficulty);
      setNouns(generatedNouns);
      setGenderTests(generatedNouns.map(noun => ({ noun })));
      
      const newSession: Session = {
        id: `session_${Date.now()}`,
        userId: 'current_user', // Replace with actual user ID
        nouns: generatedNouns,
        currentStep: 'memorizing',
        difficulty,
        score: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        createdAt: new Date()
      };
      
      setSession(newSession);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      toast.error('Failed to start preaching session');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = (stepData: any) => {
    switch (currentStep) {
      case 'memorizing':
        setCurrentStep('testing');
        setProgress(25);
        break;
      case 'testing':
        setGenderTests(stepData.tests);
        setCurrentStep('drilling');
        setProgress(50);
        break;
      case 'drilling':
        setDrillAttempts(stepData.attempts);
        setCurrentStep('feedback');
        setProgress(100);
        break;
      case 'feedback':
        onComplete?.();
        break;
    }
  };

  const getStepTitle = (step: PreachingStep): string => {
    switch (step) {
      case 'memorizing': return 'Memorizing Gender';
      case 'testing': return 'Testing Gender';
      case 'drilling': return 'Pattern Drill';
      case 'feedback': return 'Feedback & Results';
    }
  };

  const renderCurrentStep = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Preparing your session...</span>
        </div>
      );
    }

    switch (currentStep) {
      case 'memorizing':
        return (
          <MemorizingStep 
            nouns={nouns} 
            onComplete={() => handleStepComplete({})} 
          />
        );
      case 'testing':
        return (
          <TestingStep 
            nouns={nouns} 
            onComplete={handleStepComplete}
          />
        );
      case 'drilling':
        return (
          <DrillingStep 
            nouns={nouns} 
            difficulty={difficulty}
            onComplete={handleStepComplete}
          />
        );
      case 'feedback':
        return (
          <FeedbackStep 
            genderTests={genderTests}
            drillAttempts={drillAttempts}
            onComplete={() => handleStepComplete({})}
            onRestart={initializeSession}
          />
        );
    }
  };

  if (!session) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Choose Difficulty</h3>
            <div className="space-y-2">
              {(['simple', 'normal', 'complex'] as PreachingDifficulty[]).map((level) => (
                <Button
                  key={level}
                  variant={difficulty === level ? 'default' : 'outline'}
                  onClick={() => setDifficulty(level)}
                  className="w-full capitalize"
                >
                  {level}
                </Button>
              ))}
            </div>
            <Button onClick={initializeSession} className="w-full">
              Start Preaching Session
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{getStepTitle(currentStep)}</span>
                <Badge variant="secondary" className="capitalize">
                  {difficulty}
                </Badge>
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={onExit}>
              Exit
            </Button>
          </div>
          <Progress value={progress} className="mt-3" />
        </CardHeader>
      </Card>

      {/* Current Step Content */}
      <Card>
        <CardContent className="pt-6">
          {renderCurrentStep()}
        </CardContent>
      </Card>
    </div>
  );
};

export default PreachingSession;
