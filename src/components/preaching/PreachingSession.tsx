import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mic, Volume2, ChevronRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { preachingService } from '@/services/preachingService';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import type { 
  Noun, 
  PreachingSession as Session, 
  PreachingDifficulty, 
  PreachingStep,
  GenderTest,
  PatternDrill,
  DrillAttempt 
} from '@/types/preaching';
import type { Language } from '@/types';
import MemorizingStep from './MemorizingStep';
import TestingStep from './TestingStep';
import DrillingStep from './DrillingStep';
import FeedbackStep from './FeedbackStep';
import LoadingVisualization from './LoadingVisualization';

interface PreachingSessionProps {
  initialDifficulty?: PreachingDifficulty;
  autoStart?: boolean;
  onComplete?: () => void;
  onExit?: () => void;
}

const PreachingSession: React.FC<PreachingSessionProps> = ({ 
  initialDifficulty,
  autoStart = false,
  onComplete, 
  onExit 
}) => {
  const { settings } = useUserSettings();
  const [session, setSession] = useState<Session | null>(null);
  const [currentStep, setCurrentStep] = useState<PreachingStep>('memorizing');
  const [difficulty, setDifficulty] = useState<PreachingDifficulty>(initialDifficulty || 'simple');
  const [nouns, setNouns] = useState<Noun[]>([]);
  const [genderTests, setGenderTests] = useState<GenderTest[]>([]);
  const [drillAttempts, setDrillAttempts] = useState<DrillAttempt[]>([]);
  const [currentDrill, setCurrentDrill] = useState<PatternDrill | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Get the user's selected language or default to German
  const selectedLanguage: Language = settings?.selectedLanguage || 'german';

  useEffect(() => {
    if (autoStart || initialDifficulty) {
      initializeSession();
    }
  }, [selectedLanguage, autoStart, initialDifficulty]);

  const initializeSession = async () => {
    setLoading(true);
    try {
      const generatedNouns = await preachingService.generateNouns(difficulty, selectedLanguage);
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
      toast.error(`Failed to start ${selectedLanguage} preaching session`);
    } finally {
      setLoading(false);
    }
  };

  const handleNounsUpdate = (updatedNouns: Noun[]) => {
    setNouns(updatedNouns);
    setGenderTests(updatedNouns.map(noun => ({ noun })));
    if (session) {
      setSession({ ...session, nouns: updatedNouns });
    }
  };

  const handleStepComplete = (stepData: any) => {
    // Check if we should skip gender testing for this language
    const shouldSkipTesting = preachingService.shouldSkipGenderTesting(selectedLanguage);
    
    switch (currentStep) {
      case 'memorizing':
        if (shouldSkipTesting) {
          // Skip testing step and go directly to drilling
          setCurrentStep('drilling');
          setProgress(50);
        } else {
          setCurrentStep('testing');
          setProgress(25);
        }
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
    const langName = selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1);
    switch (step) {
      case 'memorizing': return `Learning ${langName} Vocabulary`;
      case 'testing': return `Testing ${langName} Grammar`;
      case 'drilling': return `${langName} Pattern Practice`;
      case 'feedback': return 'Results & Feedback';
    }
  };

  const renderCurrentStep = () => {
    if (loading) {
      return (
        <LoadingVisualization 
          type="session" 
          message={`Preparing your ${selectedLanguage} session...`}
        />
      );
    }

    const shouldSkipTesting = preachingService.shouldSkipGenderTesting(selectedLanguage);

    switch (currentStep) {
      case 'memorizing':
        return (
          <MemorizingStep 
            nouns={nouns} 
            difficulty={difficulty}
            language={selectedLanguage}
            onComplete={() => handleStepComplete({})} 
            onNounsUpdate={handleNounsUpdate}
          />
        );
      case 'testing':
        // Only render testing step if the language has gender
        if (shouldSkipTesting) {
          return null; // This shouldn't happen due to step logic, but safety check
        }
        return (
          <TestingStep 
            nouns={nouns} 
            language={selectedLanguage}
            onComplete={handleStepComplete}
          />
        );
      case 'drilling':
        return (
          <DrillingStep 
            nouns={nouns} 
            difficulty={difficulty}
            language={selectedLanguage}
            onComplete={handleStepComplete}
          />
        );
      case 'feedback':
        return (
          <FeedbackStep 
            genderTests={genderTests}
            drillAttempts={drillAttempts}
            language={selectedLanguage}
            onComplete={() => handleStepComplete({})}
            onRestart={initializeSession}
          />
        );
    }
  };

  if (!session && !autoStart) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Choose Difficulty for {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}</h3>
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
              Start {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)} Practice Session
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
                <Badge variant="outline" className="capitalize">
                  {selectedLanguage}
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
