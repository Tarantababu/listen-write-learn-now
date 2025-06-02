
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { preachingService } from '@/services/preachingService';
import type { Noun, PatternDrill, DrillAttempt, PreachingDifficulty } from '@/types/preaching';
import type { Language } from '@/types';

interface DrillingStepProps {
  nouns: Noun[];
  difficulty: PreachingDifficulty;
  language: Language;
  onComplete: (data: { attempts: DrillAttempt[] }) => void;
}

const DrillingStep: React.FC<DrillingStepProps> = ({ nouns, difficulty, language, onComplete }) => {
  const [currentDrill, setCurrentDrill] = useState<PatternDrill | null>(null);
  const [attempts, setAttempts] = useState<DrillAttempt[]>([]);
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [userSpeech, setUserSpeech] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [usedPatterns, setUsedPatterns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const targetAttempts = difficulty === 'simple' ? 3 : difficulty === 'normal' ? 5 : 7;

  useEffect(() => {
    generateNewDrill();
    initializeSpeechRecognition();
  }, []);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Set language based on the selected language
      switch (language) {
        case 'german':
          recognitionRef.current.lang = 'de-DE';
          break;
        case 'spanish':
          recognitionRef.current.lang = 'es-ES';
          break;
        case 'french':
          recognitionRef.current.lang = 'fr-FR';
          break;
        case 'italian':
          recognitionRef.current.lang = 'it-IT';
          break;
        default:
          recognitionRef.current.lang = 'de-DE';
      }
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserSpeech(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast.error('Speech recognition failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  };

  const generateNewDrill = async () => {
    setLoading(true);
    try {
      const drill = await preachingService.generatePatternDrill(nouns, difficulty, language, usedPatterns);
      setCurrentDrill(drill);
      setUsedPatterns(prev => [...prev, drill.pattern]);
    } catch (error) {
      console.error('Failed to generate drill:', error);
      toast.error('Failed to generate practice drill');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in your browser');
      return;
    }

    setIsRecording(true);
    setUserSpeech('');
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const evaluateAnswer = async () => {
    if (!currentDrill || !userSpeech.trim()) return;

    setIsEvaluating(true);
    try {
      const expectedAnswer = currentDrill.expectedAnswers[0]; // Use first expected answer as reference
      const evaluation = await preachingService.evaluateSpeech(
        expectedAnswer,
        userSpeech,
        currentDrill.pattern,
        language
      );

      const attempt: DrillAttempt = {
        pattern: currentDrill.pattern,
        expectedAnswer,
        userSpeech,
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback,
        corrections: evaluation.corrections
      };

      setAttempts(prev => [...prev, attempt]);
      setCurrentResult(evaluation);
      setShowResult(true);
    } catch (error) {
      console.error('Failed to evaluate speech:', error);
      toast.error('Failed to evaluate your answer');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    if (currentAttemptIndex < targetAttempts - 1) {
      setCurrentAttemptIndex(currentAttemptIndex + 1);
      setShowResult(false);
      setUserSpeech('');
      setCurrentResult(null);
      generateNewDrill();
    } else {
      onComplete({ attempts });
    }
  };

  const speakPattern = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Set language based on the selected language
      switch (language) {
        case 'german':
          utterance.lang = 'de-DE';
          break;
        case 'spanish':
          utterance.lang = 'es-ES';
          break;
        case 'french':
          utterance.lang = 'fr-FR';
          break;
        case 'italian':
          utterance.lang = 'it-IT';
          break;
        default:
          utterance.lang = 'de-DE';
      }
      speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Generating practice drill...</span>
      </div>
    );
  }

  const correctAttempts = attempts.filter(a => a.isCorrect).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Speaking Practice</h3>
        <Badge variant="outline">
          {currentAttemptIndex + 1} of {targetAttempts}
        </Badge>
      </div>

      {/* Progress */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>Completed: {attempts.length}</span>
        <span>•</span>
        <span>Correct: {correctAttempts}</span>
        <span>•</span>
        <span>Accuracy: {attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0}%</span>
      </div>

      {/* Current Drill */}
      {currentDrill && (
        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">Complete this sentence pattern:</p>
              <div className="text-3xl font-bold text-blue-600">
                {currentDrill.pattern}
              </div>
              <Button
                variant="outline"
                onClick={() => speakPattern(currentDrill.expectedAnswers[0])}
                size="sm"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Hear Example
              </Button>
            </div>

            {/* Voice Input */}
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Your Response:</p>
                <div className="min-h-[60px] p-4 bg-gray-50 rounded-lg">
                  {userSpeech || (isRecording ? 'Listening...' : 'Click the microphone to speak')}
                </div>
              </div>

              <div className="space-x-4">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={showResult || isEvaluating}
                  size="lg"
                  className={isRecording ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-5 w-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>

                {userSpeech && !showResult && (
                  <Button
                    onClick={evaluateAnswer}
                    disabled={isEvaluating}
                    size="lg"
                    variant="outline"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      'Check Answer'
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Result */}
            {showResult && currentResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${currentResult.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="text-center space-y-2">
                    <p className={`font-medium ${currentResult.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                      {currentResult.isCorrect ? '✓ Excellent!' : '✗ Not quite right'}
                    </p>
                    <p className={currentResult.isCorrect ? 'text-green-700' : 'text-red-700'}>
                      {currentResult.feedback}
                    </p>
                  </div>
                </div>

                {!currentResult.isCorrect && currentResult.corrections.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-blue-900 mb-2">Corrections:</p>
                    <ul className="list-disc list-inside text-blue-700 space-y-1">
                      {currentResult.corrections.map((correction, index) => (
                        <li key={index}>{correction}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-center">
                  <Button onClick={handleNext} size="lg">
                    {currentAttemptIndex < targetAttempts - 1 ? 'Next Pattern' : 'See Results'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Example Answers */}
      {currentDrill && !showResult && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Example completions:</p>
            <div className="space-y-1">
              {currentDrill.expectedAnswers.slice(0, 3).map((example, index) => (
                <p key={index} className="text-sm text-gray-600">
                  • {example}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DrillingStep;
