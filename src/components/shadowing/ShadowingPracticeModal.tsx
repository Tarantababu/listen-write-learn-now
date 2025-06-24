
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, SkipForward, SkipBack, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface ShadowingExercise {
  id: string;
  title: string;
  sentences: Array<{
    text: string;
    audio_url?: string;
  }>;
}

interface ShadowingPracticeModalProps {
  exercise: ShadowingExercise | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShadowingPracticeModal: React.FC<ShadowingPracticeModalProps> = ({
  exercise,
  isOpen,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { isPlaying, playText } = useAudioPlayer();
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sentences = exercise?.sentences || [];
  const currentSentence = sentences[currentSentenceIndex];

  useEffect(() => {
    if (exercise && sentences.length > 0) {
      const progressPercent = ((currentSentenceIndex + 1) / sentences.length) * 100;
      setProgress(progressPercent);
    }
  }, [currentSentenceIndex, sentences.length, exercise]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentSentenceIndex(0);
      setIsRecording(false);
      setProgress(0);
    }
  }, [isOpen]);

  const handlePlayAudio = async () => {
    if (!currentSentence) return;

    try {
      await playText(currentSentence.text, exercise?.language || 'en');
    } catch (error) {
      console.log('Audio playback failed, continuing without audio');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await saveRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async (audioBlob: Blob) => {
    if (!user || !exercise) return;

    try {
      // For now, we'll just save a placeholder URL
      // In a full implementation, you'd upload the audio blob to storage
      const { error } = await supabase
        .from('shadowing_recordings')
        .insert({
          user_id: user.id,
          shadowing_exercise_id: exercise.id,
          sentence_index: currentSentenceIndex,
          recording_url: 'placeholder_url', // Would be actual uploaded file URL
        });

      if (error) throw error;

      // Update progress
      await supabase
        .rpc('update_shadowing_progress', {
          exercise_id_param: exercise.id,
          user_id_param: user.id,
          sentence_index_param: currentSentenceIndex + 1,
          total_sentences_param: sentences.length,
        });

      toast.success('Recording saved!');
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Failed to save recording');
    }
  };

  const goToNext = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
    }
  };

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
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{currentSentenceIndex + 1} / {sentences.length}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Current Sentence */}
          {currentSentence && (
            <Card>
              <CardContent className="p-6">
                <p className="text-lg text-center mb-4">
                  {currentSentence.text}
                </p>
                
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayAudio}
                    disabled={isPlaying}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    Listen
                  </Button>

                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isRecording ? 'Stop' : 'Record'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentSentenceIndex === 0}
            >
              <SkipBack className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Sentence {currentSentenceIndex + 1} of {sentences.length}
            </div>

            <Button
              variant="outline"
              onClick={goToNext}
              disabled={currentSentenceIndex === sentences.length - 1}
            >
              Next
              <SkipForward className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground text-center">
            <p>1. Listen to the sentence</p>
            <p>2. Record yourself repeating it</p>
            <p>3. Move to the next sentence</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShadowingPracticeModal;
