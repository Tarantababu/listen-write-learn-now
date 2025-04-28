
import React, { useState, useEffect, useCallback } from 'react';
import { Exercise } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AudioPlayer from '@/components/AudioPlayer';

interface DictationPracticeProps {
  exercise: Exercise;
  onComplete: (accuracy: number) => void;
}

const DictationPractice: React.FC<DictationPracticeProps> = ({
  exercise,
  onComplete
}) => {
  const [userInput, setUserInput] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  // Calculate the similarity between user input and exercise text
  const calculateAccuracy = useCallback(() => {
    if (!userInput.trim()) return 0;
    
    // Normalize both texts for comparison (lowercase, remove punctuation)
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalizedOriginal = normalizeText(exercise.text);
    const normalizedInput = normalizeText(userInput);
    
    // Split into words for comparison
    const originalWords = normalizedOriginal.split(' ');
    const inputWords = normalizedInput.split(' ');
    
    // Calculate word-level accuracy
    let correctWords = 0;
    
    inputWords.forEach((word, index) => {
      if (index < originalWords.length && word === originalWords[index]) {
        correctWords++;
      }
    });
    
    // Calculate percentage
    const totalWords = originalWords.length;
    return Math.round((correctWords / totalWords) * 100);
  }, [exercise.text, userInput]);
  
  const handleSubmit = () => {
    const calculatedAccuracy = calculateAccuracy();
    setAccuracy(calculatedAccuracy);
    setShowResults(true);
    onComplete(calculatedAccuracy);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  const handleTryAgain = () => {
    setUserInput('');
    setShowResults(false);
    setAccuracy(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">Instructions</h3>
        <p className="text-sm">
          Listen to the audio and type what you hear in the box below. 
          Use Ctrl+Enter or Command+Enter to submit when you're done.
        </p>
      </div>
      
      <div className="flex justify-center">
        <AudioPlayer 
          audioUrl={exercise.audioUrl} 
          demoMode={!exercise.audioUrl} 
        />
      </div>
      
      {!showResults ? (
        <div className="space-y-4">
          <div>
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type what you hear..."
              className="min-h-40"
              disabled={showResults}
            />
            <p className="text-xs mt-1 text-muted-foreground">
              Press Ctrl+Enter or Command+Enter to submit
            </p>
          </div>
          
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!userInput.trim()}
          >
            Check My Answer
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Your Answer:</h3>
            <p className="text-sm whitespace-pre-wrap">{userInput}</p>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Original Text:</h3>
            <p className="text-sm whitespace-pre-wrap">{exercise.text}</p>
          </div>
          
          <div className="bg-muted p-4 rounded-md text-center">
            <h3 className="font-medium mb-1">Accuracy</h3>
            <div className={`text-2xl font-bold ${
              accuracy && accuracy >= 95 
                ? 'text-success' 
                : accuracy && accuracy >= 70 
                  ? 'text-amber-500' 
                  : 'text-destructive'
            }`}>
              {accuracy}%
            </div>
            
            {accuracy && accuracy >= 95 ? (
              <p className="text-sm text-success mt-2">
                Great job! {exercise.completionCount + 1 >= 3 
                  ? "You've mastered this exercise!" 
                  : `${3 - exercise.completionCount - 1} more successful attempts until mastery.`}
              </p>
            ) : (
              <p className="text-sm mt-2">
                Keep practicing to improve your accuracy
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleTryAgain}
              variant="outline"
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DictationPractice;
