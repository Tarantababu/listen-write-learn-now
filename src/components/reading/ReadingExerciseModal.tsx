
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { optimizedReadingService } from '@/services/optimizedReadingService';
import { ContentSourceSelector } from './ContentSourceSelector';
import { CustomTextInput } from './CustomTextInput';
import { GrammarFocusSelector } from './GrammarFocusSelector';
import { TopicMandalaSelector } from './TopicMandalaSelector';
import { SimpleCreationProgress } from './SimpleCreationProgress';
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReadingExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  language?: string;
}

interface GenerationProgress {
  progress: number;
  status: 'generating' | 'completed' | 'error';
  message: string;
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
  const [progress, setProgress] = useState<GenerationProgress>({
    progress: 0,
    status: 'generating',
    message: 'Initializing...'
  });
  const { toast } = useToast();

  // Simplified length options with better UX
  const lengthOptions = [
    { value: 300, label: '300 words (~2 min read)', recommended: 'Quick practice' },
    { value: 500, label: '500 words (~3 min read)', recommended: 'Most popular' },
    { value: 700, label: '700 words (~4 min read)', recommended: 'Good balance' },
    { value: 1000, label: '1000 words (~5 min read)', recommended: 'Comprehensive' },
    { value: 1500, label: '1500 words (~7 min read)', recommended: 'Extended practice' },
    { value: 2000, label: '2000 words (~10 min read)', recommended: 'Advanced' },
    { value: 3000, label: '3000 words (~15 min read)', recommended: 'Maximum length' }
  ];

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

    console.log('[MODAL] Starting optimized exercise creation');
    setIsCreating(true);
    setShowProgress(true);

    try {
      const exercise = await optimizedReadingService.createReadingExercise({
        title: title.trim(),
        language,
        difficulty_level: difficultyLevel,
        target_length: targetLength,
        grammar_focus: grammarFocus.join(', ') || undefined,
        topic: contentSource === 'ai' ? topic.trim() : 'Custom Content',
        customText: contentSource === 'custom' ? customText.trim() : undefined
      }, (progressUpdate) => {
        setProgress(progressUpdate);
      });

      if (onSuccess) {
        onSuccess();
      }
      
      // Check if exercise was created with fallback content
      const isFallbackContent = exercise.content?.analysis?.fallbackInfo?.isUsable;
      
      toast({
        title: isFallbackContent ? "Exercise Created with Smart Recovery" : "Exercise Created Successfully",
        description: isFallbackContent 
          ? "Your exercise is ready! Smart recovery ensured successful creation."
          : `Your ${targetLength}-word reading exercise has been created successfully.`,
        variant: "default"
      });
      
      console.log('[MODAL] Exercise creation completed successfully');
      
      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (error) {
      console.error('[MODAL] Exercise creation failed:', error);
      
      setProgress({
        progress: 0,
        status: 'error',
        message: 'Failed to create exercise. Please try again.'
      });
      
      toast({
        title: "Creation Error",
        description: "There was an issue creating your exercise. Please try again.",
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
      setProgress({ progress: 0, status: 'generating', message: 'Initializing...' });
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
              Creating Your Reading Exercise
            </DialogTitle>
          </DialogHeader>
          
          <SimpleCreationProgress
            progress={progress.progress}
            status={progress.status}
            message={progress.message}
            estimatedTime={progress.estimatedTime}
            onCancel={handleClose}
            showOptimizations={true}
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
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            {option.recommended && (
                              <span className="text-xs text-muted-foreground">{option.recommended}</span>
                            )}
                          </div>
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
                    <strong>Extended Content:</strong> Generating {targetLength} words will use our advanced creation system for optimal results.
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
              <strong>Smart Generation:</strong> Our optimized system automatically selects the best approach for your content length and complexity. Audio will be generated in the background.
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
