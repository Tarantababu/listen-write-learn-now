import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExerciseContent, RoadmapNode } from '@/features/roadmap/types';
import { useToast } from '@/hooks/use-toast';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { convertToLanguageCode } from '@/utils/languageConverter';

interface RoadmapExerciseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  node: RoadmapNode;
  exerciseContent: ExerciseContent | null;
  onComplete: (transcript: string) => Promise<void>;
  isLoading: boolean;
}

const RoadmapExerciseModal: React.FC<RoadmapExerciseModalProps> = ({
  isOpen,
  onOpenChange,
  node,
  exerciseContent,
  onComplete,
  isLoading
}) => {
  const { toast } = useToast();
  const { settings } = useUserSettingsContext();
  const { user } = useAuth();
  const [exerciseText, setExerciseText] = useState('');
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechToText();

  useEffect(() => {
    if (exerciseContent) {
      setExerciseText(exerciseContent.text);
    }
  }, [exerciseContent]);

  useEffect(() => {
    if (transcript && exerciseText) {
      const correct = transcript.trim() === exerciseText.trim();
      setIsCorrect(correct);
      setShowFeedback(true);
      setFeedback(correct ? 'Great job!' : 'Not quite, try again.');
    }
  }, [transcript, exerciseText]);

  const handleSubmit = async (transcript: string) => {
    if (!user) {
      toast({
        title: 'You must be logged in to complete this exercise.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Fix the language conversion
      const currentLanguage = node.language || 'en';

      // Fix the date conversion
      const nodeUpdatedAt = node.updatedAt 
        ? new Date(node.updatedAt).toISOString() 
        : new Date().toISOString();

      await onComplete(transcript);
      toast({
        title: 'Exercise completed!',
        description: 'Great job, keep going!',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing exercise:', error);
      toast({
        title: 'Something went wrong.',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartListening = () => {
    resetTranscript();
    startListening();
    setIsCorrect(false);
    setShowFeedback(false);
    setFeedback('');
  };

  const handleStopListening = () => {
    stopListening();
    setTranscript(textareaRef.current?.value || '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{node.title}</DialogTitle>
          <DialogDescription>
            Practice dictation to improve your listening skills.
          </DialogDescription>
        </DialogHeader>
        
        {exerciseContent ? (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-text">Exercise Text</Label>
              <Textarea
                id="exercise-text"
                value={exerciseText}
                disabled
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transcript">Your Transcript</Label>
              <Textarea
                id="transcript"
                placeholder="Start listening and your transcript will appear here."
                className="min-h-[100px]"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                ref={textareaRef}
              />
            </div>

            {showFeedback && (
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Badge variant={isCorrect ? 'success' : 'destructive'}>
                  {feedback}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            {isLoading ? (
              <p>Loading exercise content...</p>
            ) : (
              <p>No exercise content available.</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button 
            type="button"
            variant="secondary"
            onClick={() => setIsTextVisible(!isTextVisible)}
          >
            {isTextVisible ? 'Hide Text' : 'Show Text'}
          </Button>
          
          {browserSupportsSpeechRecognition ? (
            <>
              <Button
                type="button"
                variant={isListening ? 'destructive' : 'outline'}
                onClick={isListening ? handleStopListening : handleStartListening}
                disabled={isLoading}
              >
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </Button>
              <Button 
                type="button" 
                onClick={() => handleSubmit(transcript)} 
                disabled={!transcript || isLoading || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </>
          ) : (
            <p>Speech recognition not supported in this browser.</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
