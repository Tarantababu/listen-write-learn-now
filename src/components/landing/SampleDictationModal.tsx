
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DictationPractice from '@/components/DictationPractice';
import { Exercise } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SampleDictationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SampleDictationModal({ open, onOpenChange }: SampleDictationModalProps) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Sample exercise data with more comprehensive text
  const sampleText = "This app helps you improve your language skills through dictation. You listen to a sentence spoken by a native speaker and type what you hear. It trains your listening, spelling, and grammar all at once. Each exercise is based on the most common words in the language, so you build practical vocabulary while improving accuracy. You get instant feedback on your typing, and you can repeat each sentence as many times as you need. It's a simple but powerful way to make fast, real progress.";
  
  const sampleExercise: Exercise = {
    id: 'sample-exercise',
    title: 'Try Dictation Practice',
    text: sampleText,
    audioUrl: audioUrl || '',
    language: 'english',
    tags: ['sample', 'beginner'],
    completionCount: 0,
    isCompleted: false,
    createdAt: new Date(),
    directoryId: null
  };

  // Generate audio from text using the edge function
  useEffect(() => {
    const generateAudio = async () => {
      try {
        setLoading(true);
        
        // Call the text-to-speech edge function
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: {
            text: sampleText,
            language: 'english'
          }
        });
        
        if (error) {
          console.error('Error generating audio:', error);
          return;
        }
        
        // Convert base64 audio to blob URL
        if (data && data.audioContent) {
          const binaryString = atob(data.audioContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/mp3' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        }
      } catch (error) {
        console.error('Error in audio generation:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && !audioUrl) {
      generateAudio();
    }
  }, [open, sampleText]);

  const handleComplete = (accuracy: number) => {
    setCompleted(true);
  };

  const handleTryAgain = () => {
    setCompleted(false);
  };
  
  // Reset completed state when modal closes
  const handleOpenChange = (newOpenState: boolean) => {
    if (!newOpenState) {
      setCompleted(false);
    }
    onOpenChange(newOpenState);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Try Dictation Practice</DialogTitle>
          <DialogDescription>
            Listen to the audio and type what you hear. Submit to see your accuracy.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Generating audio sample...</p>
            </div>
          ) : (
            <DictationPractice 
              exercise={sampleExercise} 
              onComplete={handleComplete} 
              showResults={completed}
              onTryAgain={handleTryAgain}
            />
          )}
        </div>
        
        <div className="mt-4 flex justify-between items-center p-3 border-t">
          <div className="text-sm text-muted-foreground">
            {completed ? (
              <span>Like what you see? Sign up for full access.</span>
            ) : (
              <span>Press <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Shift</span> + <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</span> to play/pause</span>
            )}
          </div>
          
          {completed && (
            <Button asChild>
              <Link to="/signup">Sign Up Now</Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
