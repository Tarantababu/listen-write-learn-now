import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DictationPractice from '@/components/DictationPractice';
import { Exercise } from '@/types';
import { Loader2 } from 'lucide-react';
interface SampleDictationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedded?: boolean;
}

// Pre-defined audio URL for all visitors
const staticAudioUrl = "https://kmpghammoxblhacndimq.supabase.co/storage/v1/object/public/audio//exercise_1746223427671.mp3";
export function SampleDictationModal({
  open,
  onOpenChange,
  embedded = false
}: SampleDictationModalProps) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sample exercise data with more comprehensive text
  const sampleText = "This app helps you improve your language skills through dictation. You listen to a sentence spoken by a native speaker and type what you hear. It trains your listening, spelling, and grammar all at once. Each exercise is based on the most common words in the language, so you build practical vocabulary while improving accuracy. You get instant feedback on your typing, and you can repeat each sentence as many times as you need. It's a simple but powerful way to make fast, real progress.";

  // For embedded version, use a shorter text sample
  const embeddedSampleText = "Listen carefully and type what you hear. This simple exercise improves your listening comprehension and spelling at the same time.";
  const sampleExercise: Exercise = {
    id: 'sample-exercise',
    title: 'Try Dictation Practice',
    text: embedded ? embeddedSampleText : sampleText,
    audioUrl: staticAudioUrl,
    language: 'english',
    tags: ['sample', 'beginner'],
    completionCount: 0,
    isCompleted: false,
    createdAt: new Date(),
    directoryId: null
  };
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

  // For embedded mode, render directly in a div instead of a modal
  if (embedded) {
    return;
  }

  // Regular modal view
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Try Dictation Practice</DialogTitle>
          <DialogDescription>
            Listen to the audio and type what you hear. Submit to see your accuracy.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {loading ? <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading audio sample...</p>
            </div> : <DictationPractice exercise={sampleExercise} onComplete={handleComplete} showResults={completed} onTryAgain={handleTryAgain} hideVocabularyTab={true} />}
        </div>
        
        <div className="mt-4 flex justify-between items-center p-3 border-t">
          <div className="text-sm text-muted-foreground">
            {completed ? <span>Like what you see? Sign up for full access.</span> : <span>Press <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Shift</span> + <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</span> to play/pause</span>}
          </div>
          
          {completed && <Button asChild>
              <Link to="/signup">Sign Up Now</Link>
            </Button>}
        </div>
      </DialogContent>
    </Dialog>;
}