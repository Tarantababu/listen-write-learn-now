import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DictationPractice from '@/components/DictationPractice';
import { Exercise } from '@/types';
import { Loader2, BookOpen } from 'lucide-react';
interface SampleDictationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedded?: boolean;
}
enum PracticeStage {
  PROMPT,
  DICTATION,
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
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.PROMPT);

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
  const handleStartDictation = () => {
    setPracticeStage(PracticeStage.DICTATION);
  };

  // Reset completed state when modal closes
  const handleOpenChange = (newOpenState: boolean) => {
    if (!newOpenState) {
      setCompleted(false);
      setPracticeStage(PracticeStage.PROMPT);
    }
    onOpenChange(newOpenState);
  };

  // For embedded mode, render directly in a div instead of a modal
  if (embedded) {
    return;
  }

  // Regular modal view
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden rounded-lg shadow-lg border-primary/10 bg-gradient-to-b from-background to-background/95 backdrop-blur-sm">
        {practiceStage === PracticeStage.PROMPT && <>
            <DialogHeader className="bg-primary/5 p-6 rounded-t-lg">
              <DialogTitle className="text-2xl font-bold">Try Dictation Practice</DialogTitle>
              <DialogDescription className="text-base opacity-90">
                Learn languages by listening and typing what you hear. Experience our core learning method.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Button onClick={handleStartDictation} className="h-auto py-6 px-4 hover-glow hover:bg-primary/90">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <BookOpen className="h-6 w-6 mb-2" />
                    <div className="font-semibold text-base">Start Dictation Practice</div>
                    
                  </div>
                </Button>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg border border-muted hover:border-primary/20 transition-colors">
                <h3 className="font-medium mb-2">What is dictation practice?</h3>
                <p className="text-sm">
                  Dictation practice helps you improve your listening comprehension, spelling, and
                  grammar all at once. You'll listen to audio spoken by a native speaker and try
                  to accurately type what you hear.
                </p>
              </div>
            </div>
            
            <div className="mt-auto flex justify-between items-center p-4 border-t bg-background/50 rounded-b-lg">
              <div className="text-sm text-muted-foreground">
                <span>Sign up to access all features including vocabulary tools and progress tracking.</span>
              </div>
              
              <Button asChild className="hover-scale">
                <Link to="/signup">Sign Up Now</Link>
              </Button>
            </div>
          </>}
        
        {practiceStage === PracticeStage.DICTATION && <>
            <div className="flex-1 overflow-auto">
              {loading ? <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">Loading audio sample...</p>
                </div> : <DictationPractice exercise={sampleExercise} onComplete={handleComplete} showResults={completed} onTryAgain={handleTryAgain} hideVocabularyTab={true} />}
            </div>
            
            <div className="mt-auto flex justify-between items-center p-4 border-t bg-background/50 rounded-b-lg">
              <div className="text-sm text-muted-foreground">
                {completed ? <span>Like what you see? Sign up for full access.</span> : <span>Press <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Shift</span> + <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</span> to play/pause</span>}
              </div>
              
              {completed && <Button asChild className="hover-scale">
                  <Link to="/signup">Sign Up Now</Link>
                </Button>}
            </div>
          </>}
      </DialogContent>
    </Dialog>;
}