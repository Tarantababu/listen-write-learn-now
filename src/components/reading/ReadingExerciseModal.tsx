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
import { AlertTriangle, Info, TrendingUp, Brain, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { clientAnalyzeCustomText } from '@/utils/clientAnalyzeCustomText';
import { supabase } from '@/integrations/supabase/client';

interface ReadingExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  language?: string;
}

interface EnhancedGenerationProgress {
  progress: number;
  status: 'generating' | 'completed' | 'error';
  message: string;
  estimatedTime?: number;
  qualityMetrics?: {
    vocabularyDiversity?: number;
    coherenceScore?: number;
    generationStrategy?: string;
    recoveryUsed?: boolean;
  };
}

// List of supported languages for exercises (expand as needed)
const SUPPORTED_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Dutch', 'Turkish', 'Swedish', 'Norwegian'
];

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
  const [progress, setProgress] = useState<EnhancedGenerationProgress>({
    progress: 0,
    status: 'generating',
    message: 'Initializing...'
  });
  const { toast } = useToast();

  // Define isLanguageSupported for use in the form/UI logic
  const isLanguageSupported = SUPPORTED_LANGUAGES
    .map(l => l.toLowerCase())
    .includes(language.trim().toLowerCase());

  // Enhanced length options with strategy indicators
  const lengthOptions = [
    { value: 300, label: '300 words (~2 min)', recommended: 'Quick practice', strategy: 'Direct' },
    { value: 500, label: '500 words (~3 min)', recommended: 'Most popular', strategy: 'Direct' },
    { value: 700, label: '700 words (~4 min)', recommended: 'Good balance', strategy: 'Direct' },
    { value: 1000, label: '1000 words (~5 min)', recommended: 'Comprehensive', strategy: 'Smart Chunking' },
    { value: 1500, label: '1500 words (~7 min)', recommended: 'Extended practice', strategy: 'Smart Chunking' },
    { value: 2000, label: '2000 words (~10 min)', recommended: 'Advanced', strategy: 'Adaptive' },
    { value: 3000, label: '3000 words (~15 min)', recommended: 'Maximum length', strategy: 'Adaptive' }
  ];

  // NEW: Helper to handle the complete creation with custom text
  const handleCustomTextCreation = async () => {
    setIsCreating(true);
    setShowProgress(true);

    setProgress({
      progress: 15,
      status: 'generating',
      message: 'Analyzing custom text instantly...',
      estimatedTime: 1
    });
    try {
      // 1. Analyze on client
      const customTextAnalysis = clientAnalyzeCustomText(customText.trim());

      // 2. Save immediately to database (simulate as if server generated)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      setProgress({
        progress: 50,
        status: 'generating',
        message: 'Saving your custom exercise...',
        estimatedTime: 1
      });

      // The reading_exercises table structure may require adaptation, but for now we'll save to it
      const { data, error } = await supabase
        .from('reading_exercises')
        .insert({
          user_id: user.id,
          title: title.trim(),
          language,
          difficulty_level: difficultyLevel,
          target_length: targetLength,
          grammar_focus: grammarFocus.join(', ') || undefined,
          topic: 'Custom Content',
          content: customTextAnalysis as any, // <--- FIX HERE
          audio_generation_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setProgress({
        progress: 100,
        status: 'completed',
        message: 'Custom exercise created instantly!',
        estimatedTime: 0
      });

      if (onSuccess) onSuccess();

      setTimeout(() => {
        handleClose();
      }, 700);
    } catch (error: any) {
      setProgress({
        progress: 0,
        status: 'error',
        message: 'Failed to save custom exercise: ' + (error?.message || error),
      });
      toast({
        title: "Error",
        description: error?.message || "Failed to save custom exercise.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLanguageSupported) {
      toast({
        title: "Language Not Supported",
        description: `The selected language (${language}) is not supported for reading exercise creation.`,
        variant: "destructive"
      });
      return;
    }

    if (
      !title.trim() ||
      (contentSource === 'ai' && !topic.trim()) ||
      (contentSource === 'custom' && !customText.trim())
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!language || !language.trim()) {
      toast({
        title: "Language Required",
        description: "Please select a language before creating an exercise.",
        variant: "destructive"
      });
      return;
    }

    if (contentSource === 'custom') {
      // Use new lightning fast custom text path!
      await handleCustomTextCreation();
      return;
    }

    console.log('[ENHANCED MODAL] Starting enhanced exercise creation');
    setIsCreating(true);
    setShowProgress(true);

    try {
      const exercise = await optimizedReadingService.createReadingExercise({
        title: title.trim(),
        language,
        difficulty_level: difficultyLevel,
        target_length: targetLength,
        grammar_focus: grammarFocus.join(', ') || undefined,
        topic: topic.trim(),
        customText: undefined
      }, (progressUpdate) => {
        setProgress(progressUpdate);
      });

      if (onSuccess) {
        onSuccess();
      }
      
      // Enhanced success handling with quality assessment
      const isEnhancedContent = exercise.content?.analysis?.enhancedGeneration;
      const qualityLevel = exercise.content?.analysis?.qualityMetrics?.coherenceScore || 0;
      const usedRecovery = exercise.content?.analysis?.fallbackInfo?.isUsable;
      
      const getSuccessMessage = () => {
        if (usedRecovery) {
          return "Exercise created with smart recovery! Our enhanced system ensured successful creation.";
        } else if (isEnhancedContent) {
          return `Enhanced exercise created successfully! Quality score: ${Math.round(qualityLevel * 100)}%`;
        } else {
          return `Your ${targetLength}-word reading exercise has been created successfully.`;
        }
      };
      
      toast({
        title: isEnhancedContent ? "Enhanced Exercise Created" : "Exercise Created Successfully",
        description: getSuccessMessage(),
        variant: "default"
      });
      
      console.log('[ENHANCED MODAL] Exercise creation completed with enhanced features');
      
      // Auto-close after success with quality summary
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('[ENHANCED MODAL] Exercise creation failed:', error);
      
      setProgress({
        progress: 0,
        status: 'error',
        message: 'Failed to create exercise. Our enhanced system tried multiple recovery methods.'
      });
      
      toast({
        title: "Creation Error",
        description: "There was an issue creating your exercise. Our enhanced system attempted multiple recovery methods. Please try again.",
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
  const getGenerationStrategy = () => {
    if (targetLength <= 800) return 'Enhanced Direct';
    if (targetLength <= 1500) return 'Smart Chunking';
    return 'Adaptive Chunking';
  };

  if (showProgress) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Creating Your Enhanced Reading Exercise
            </DialogTitle>
          </DialogHeader>
          
          <SimpleCreationProgress
            progress={progress.progress}
            status={progress.status}
            message={progress.message}
            estimatedTime={progress.estimatedTime}
            onCancel={handleClose}
            showOptimizations={true}
            qualityMetrics={progress.qualityMetrics}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // --- Make sure setContentSource only accepts 'ai' | 'custom' ---
  // If ContentSourceSelector ever returns a `string`, cast/narrow it.
  // If needed, you can also wrap in a type guard:
  const handleSourceSelect = (source: unknown) => {
    if (source === 'ai' || source === 'custom') {
      setContentSource(source);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Enhanced Reading Exercise</DialogTitle>
        </DialogHeader>
        {!isLanguageSupported && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>
              <strong>Sorry!</strong> The selected language <span className="font-semibold">{language}</span> is not currently supported for creating new reading exercises.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Exercise Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter exercise title..."
              required
              disabled={!isLanguageSupported}
            />
          </div>

          <ContentSourceSelector
            selectedSource={contentSource}
            onSourceSelect={handleSourceSelect}
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
                            <div className="flex items-center gap-2">
                              <span>{option.label}</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                                {option.strategy}
                              </span>
                            </div>
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

              {/* Enhanced Strategy Information */}
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Generation Strategy:</strong> {getGenerationStrategy()} - This strategy is optimized for {targetLength} words to ensure quality and coherence.
                  {isLongContent && " Advanced adaptive chunking will be used for optimal results."}
                </AlertDescription>
              </Alert>

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
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Enhanced Generation:</strong> Our optimized system uses intelligent strategies, quality metrics, and smart recovery to ensure successful creation. Audio generation happens automatically in the background.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !isLanguageSupported}>
              {isCreating ? 'Creating...' : 'Create Enhanced Exercise'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
