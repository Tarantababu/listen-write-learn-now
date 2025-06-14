
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { readingExerciseService } from '@/services/readingExerciseService';
import { ContentSourceSelector } from './ContentSourceSelector';
import { CustomTextInput } from './CustomTextInput';
import { GrammarFocusSelector } from './GrammarFocusSelector';
import { TopicMandalaSelector } from './TopicMandalaSelector';
import { ReadingExerciseCreationProgress } from './ReadingExerciseCreationProgress';
import { AlertTriangle, Info, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReadingExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  language?: string;
}

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  estimatedTime?: number;
}

export const ReadingExerciseModal: React.FC<ReadingExerciseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language = 'English'
}) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [targetLength, setTargetLength] = useState(500);
  const [grammarFocus, setGrammarFocus] = useState<string[]>([]);
  const [contentSource, setContentSource] = useState<'ai' | 'custom'>('ai');
  const [customText, setCustomText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>();
  const [apiSuccess, setApiSuccess] = useState(false);
  const { toast } = useToast();

  // Enhanced length options with cap at 3000 words
  const lengthOptions = [
    { value: 300, label: '300 words (~2 min read)', time: '15s' },
    { value: 500, label: '500 words (~3 min read)', time: '20s' },
    { value: 700, label: '700 words (~4 min read)', time: '25s' },
    { value: 1000, label: '1000 words (~5 min read)', time: '35s' },
    { value: 1500, label: '1500 words (~7 min read)', time: '45s' },
    { value: 2000, label: '2000 words (~10 min read)', time: '55s' },
    { value: 3000, label: '3000 words (~15 min read) - Max Length', time: '60s' }
  ];

  const initializeProgressSteps = (isCustom: boolean, targetWords: number) => {
    const baseSteps: ProgressStep[] = [];
    
    if (isCustom) {
      baseSteps.push({
        id: 'text-processing',
        label: 'Processing Custom Text',
        description: 'Analyzing and structuring your custom content with enhanced protection',
        status: 'pending',
        estimatedTime: 15
      });
    } else if (targetWords <= 1200) {
      baseSteps.push({
        id: 'content-generation',
        label: 'Generating Content',
        description: 'Creating your reading exercise with smart timeout protection',
        status: 'pending',
        estimatedTime: 25
      });
    } else {
      baseSteps.push({
        id: 'optimized-generation',
        label: 'Enhanced Content Generation',
        description: 'Using intelligent chunking strategy with error recovery',
        status: 'pending',
        estimatedTime: Math.min(45, Math.ceil(targetWords / 50))
      });
      
      baseSteps.push({
        id: 'chunked-generation',
        label: 'Smart Content Assembly',
        description: 'Combining content sections with continuity protection',
        status: 'pending',
        estimatedTime: 10
      });
    }
    
    baseSteps.push({
      id: 'audio-generation',
      label: 'Audio Generation (Background)',
      description: 'Generating audio files for enhanced practice experience',
      status: 'pending',
      estimatedTime: 5
    });
    
    baseSteps.push({
      id: 'finalization',
      label: 'Finalizing Exercise',
      description: 'Completing setup and preparing your reading exercise',
      status: 'pending',
      estimatedTime: 3
    });

    return baseSteps;
  };

  const updateProgress = (stepIndex: number, status: 'active' | 'completed' | 'error', estimatedRemaining?: number) => {
    setSteps(prevSteps => 
      prevSteps.map((step, index) => ({
        ...step,
        status: index < stepIndex ? 'completed' : index === stepIndex ? status : 'pending'
      }))
    );
    
    setCurrentStep(stepIndex);
    setOverallProgress((stepIndex / steps.length) * 100);
    
    if (estimatedRemaining !== undefined) {
      setEstimatedTimeRemaining(estimatedRemaining);
    }
  };

  const simulateProgressSteps = async (totalSteps: number) => {
    console.log('[PROGRESS SIM] Starting progress simulation for', totalSteps, 'steps');
    
    // Progress through steps with realistic timing
    for (let i = 0; i < totalSteps - 1; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Only update progress if API hasn't failed
      if (apiSuccess || isCreating) {
        updateProgress(i, 'completed');
        updateProgress(i + 1, 'active', Math.max(0, (totalSteps - i - 1) * 2));
        console.log('[PROGRESS SIM] Step', i, 'completed, moving to step', i + 1);
      } else {
        console.log('[PROGRESS SIM] Stopping simulation - API failed or creation cancelled');
        return;
      }
    }
    
    // Complete final step only if API succeeded
    if (apiSuccess && isCreating) {
      updateProgress(totalSteps - 1, 'completed', 0);
      setOverallProgress(100);
      console.log('[PROGRESS SIM] All steps completed successfully');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || (contentSource === 'ai' && !topic.trim()) || (contentSource === 'custom' && !customText.trim())) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    console.log('[MODAL] Starting exercise creation');
    setIsCreating(true);
    setShowProgress(true);
    setApiSuccess(false);
    
    const progressSteps = initializeProgressSteps(contentSource === 'custom', targetLength);
    setSteps(progressSteps);
    setCurrentStep(0);
    setOverallProgress(0);
    
    const totalEstimatedTime = progressSteps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);
    setEstimatedTimeRemaining(totalEstimatedTime);

    // Start the first step
    updateProgress(0, 'active', totalEstimatedTime - 5);

    try {
      console.log('[MODAL] Calling readingExerciseService.createReadingExercise');
      
      // Start progress simulation in background
      const progressPromise = simulateProgressSteps(progressSteps.length);
      
      // Make the actual API call
      const exercise = await readingExerciseService.createReadingExercise({
        title: title.trim(),
        language,
        difficulty_level: difficultyLevel,
        target_length: targetLength,
        grammar_focus: grammarFocus.join(', ') || undefined,
        topic: contentSource === 'ai' ? topic.trim() : 'Custom Content',
        customText: contentSource === 'custom' ? customText.trim() : undefined
      });

      console.log('[MODAL] API call succeeded, exercise created:', exercise.id);
      setApiSuccess(true);
      
      // Wait for progress simulation to complete
      await progressPromise;
      
      // Additional delay for completion effect
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onSuccess) {
        onSuccess();
      }
      
      // Check if exercise was created with fallback content
      const isFallbackContent = exercise.content?.analysis?.fallbackInfo?.isUsable;
      
      toast({
        title: isFallbackContent ? "Exercise Created with Enhanced Protection" : "Exercise Created Successfully",
        description: isFallbackContent 
          ? "Your exercise is ready! Enhanced protection ensured successful creation despite complexity."
          : `Your ${targetLength}-word reading exercise has been created successfully.`,
        variant: "default"
      });
      
      console.log('[MODAL] Exercise creation completed successfully');
      handleClose();
      
    } catch (error) {
      console.error('[MODAL] Exercise creation failed:', error);
      
      // Mark API as failed to stop progress simulation
      setApiSuccess(false);
      
      // Update current step to error state
      updateProgress(currentStep, 'error');
      
      toast({
        title: "Creation Error",
        description: "There was an issue creating your exercise. Please try again with a shorter length or different topic.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setTitle('');
      setTopic('');
      setDifficultyLevel('beginner');
      setTargetLength(500);
      setGrammarFocus([]);
      setContentSource('ai');
      setCustomText('');
      setShowProgress(false);
      setSteps([]);
      setCurrentStep(0);
      setOverallProgress(0);
      setEstimatedTimeRemaining(undefined);
      setApiSuccess(false);
      onClose();
    }
  };

  const handleGrammarToggle = (grammarId: string) => {
    setGrammarFocus(prev => 
      prev.includes(grammarId) 
        ? prev.filter(id => id !== grammarId)
        : [...prev, grammarId]
    );
  };

  const selectedLengthOption = lengthOptions.find(opt => opt.value === targetLength);
  const isLongContent = targetLength >= 2000;

  if (showProgress) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Creating Your Protected Reading Exercise
            </DialogTitle>
          </DialogHeader>
          
          <ReadingExerciseCreationProgress
            steps={steps}
            currentStep={currentStep}
            overallProgress={overallProgress}
            onCancel={handleClose}
            estimatedTimeRemaining={estimatedTimeRemaining}
            hasOptimizations={true}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Reading Exercise</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Exercise Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter exercise title..."
              required
            />
          </div>

          <ContentSourceSelector
            selectedSource={contentSource}
            onSourceSelect={setContentSource}
          />

          {contentSource === 'ai' ? (
            <>
              <TopicMandalaSelector
                selectedTopic={topic}
                onTopicSelect={setTopic}
                language={language}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={difficultyLevel} onValueChange={(value: any) => setDifficultyLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Target Length</Label>
                  <Select value={targetLength.toString()} onValueChange={(value) => setTargetLength(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lengthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLongContent && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Long Content Notice:</strong> Generating {targetLength} words may take up to {selectedLengthOption?.time}. 
                    Enhanced protection will ensure successful creation with intelligent fallbacks if needed.
                  </AlertDescription>
                </Alert>
              )}

              <GrammarFocusSelector
                selectedGrammar={grammarFocus}
                onGrammarToggle={handleGrammarToggle}
                maxSelections={3}
              />
            </>
          ) : (
            <CustomTextInput
              value={customText}
              onChange={setCustomText}
              maxLength={4000}
            />
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Enhanced Protection Active:</strong> This exercise uses advanced error recovery 
              to ensure successful creation. Audio will be generated in the background after creation.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Exercise'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
