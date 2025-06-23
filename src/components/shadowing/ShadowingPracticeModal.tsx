
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, Mic, Square } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useShadowingExercises } from '@/hooks/useShadowingExercises';
import { toast } from 'sonner';

interface ShadowingPracticeModalProps {
  exercise: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShadowingPracticeModal: React.FC<ShadowingPracticeModalProps> = ({
  exercise,
  isOpen,
  onOpenChange,
}) => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const { isPlaying, isLoading, playText, stopAudio } = useAudioPlayer();
  const { updateProgress } = useShadowingExercises();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sentences = exercise?.sentences || [];
  const currentSentence = sentences[currentSentenceIndex];
  const progress = sentences.length > 0 ? ((currentSentenceIndex + 1) / sentences.length) * 100 : 0;

  const handlePlaySentence = async () => {
    if (!currentSentence) return;
    
    try {
      if (isPlaying) {
        stopAudio();
      } else {
        await playText(currentSentence.text, exercise.language);
      }
    } catch (error) {
      console.error('Error playing sentence:', error);
      toast.error('Failed to play audio');
    }
  };

  const handleNextSentence = async () => {
    if (currentSentenceIndex < sentences.length - 1) {
      const newIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(newIndex);
      
      // Update progress
      try {
        await updateProgress(exercise.id, newIndex, sentences.length);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  const handlePreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Here you could upload the recording or process it further
        console.log('Recording completed:', audioBlob);
        
        // Clean up the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    // Reset when modal opens
    if (isOpen) {
      setCurrentSentenceIndex(0);
      setIsRecording(false);
    }
    
    // Cleanup when modal closes
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopAudio();
    };
  }, [isOpen, stopAudio]);

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{exercise.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sentence {currentSentenceIndex + 1} of {sentences.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Current Sentence */}
          <div className="bg-muted/50 p-6 rounded-lg">
            <p className="text-lg leading-relaxed text-center">
              {currentSentence?.text || 'No sentence available'}
            </p>
          </div>

          {/* Audio Controls */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousSentence}
              disabled={currentSentenceIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              size="icon"
              onClick={handlePlaySentence}
              disabled={isLoading}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextSentence}
              disabled={currentSentenceIndex === sentences.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center gap-4">
            <Button
              variant={isRecording ? "destructive" : "secondary"}
              onClick={handleRecordingToggle}
              className="flex items-center gap-2"
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50/50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How to Practice:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Click play to hear the sentence</li>
              <li>Start recording and repeat the sentence while listening</li>
              <li>Try to match the rhythm and pronunciation</li>
              <li>Move to the next sentence when ready</li>
            </ol>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {currentSentenceIndex === sentences.length - 1 ? (
              <Button onClick={() => onOpenChange(false)}>
                Complete
              </Button>
            ) : (
              <Button onClick={handleNextSentence}>
                Next Sentence
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
