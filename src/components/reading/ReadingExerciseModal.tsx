
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const formId = "reading-exercise-form";

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
        <DialogContent className={isMobile ? "w-full h-full max-w-full max-h-full m-0 rounded-none flex flex-col" : "max-w-3xl max-h-[90vh] overflow-hidden"}>
          <DialogHeader className="flex-shrink-0">
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
      <DialogContent className={isMobile ? 
        "w-screen h-screen max-w-full max-h-full m-0 rounded-none flex flex-col" : 
        "max-w-5xl max-h-[95vh] p-0 overflow-hidden flex flex-col"
      }>
        {/* Header */}
        <DialogHeader className={isMobile ? "p-4 border-b flex-shrink-0" : "px-8 pt-6 pb-4 border-b flex-shrink-0"}>
          <DialogTitle className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            Create Enhanced Reading Exercise
          </DialogTitle>
        </DialogHeader>

        {/* Main Content */}
        <div className={`flex-1 overflow-hidden ${isMobile ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-0'}`}>
          {/* Primary Form Section */}
          <div className={`${isMobile ? 'flex-1 overflow-y-auto' : 'lg:col-span-2 overflow-y-auto border-r'}`}>
            <div className={isMobile ? 'p-4' : 'p-8'}>
              {!isLanguageSupported && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertDescription>
                    <strong>Sorry!</strong> The selected language <span className="font-semibold">{language}</span> is not currently supported for creating new reading exercises.
                  </AlertDescription>
                </Alert>
              )}

              <form id={formId} onSubmit={handleSubmit} className="space-y-8">
                {/* Exercise Title */}
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-base font-medium">Exercise Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your exercise..."
                    required
                    disabled={!isLanguageSupported}
                    className="h-12 text-base"
                  />
                </div>

                {/* Content Source Selection */}
                <div>
                  <ContentSourceSelector
                    selectedSource={contentSource}
                    onSourceSelect={handleSourceSelect}
                  />
                </div>

                {/* AI Content Configuration */}
                {contentSource === 'ai' && (
                  <div className="space-y-8">
                    {/* Topic Selection */}
                    <TopicMandalaSelector
                      selectedTopic={topic}
                      onTopicSelect={setTopic}
                      language={language}
                    />

                    {/* Exercise Parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="difficulty" className="text-base font-medium">Difficulty Level</Label>
                        <Select value={difficultyLevel} onValueChange={(value: any) => setDifficultyLevel(value)}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">
                              <div className="flex flex-col">
                                <span className="font-medium">Beginner</span>
                                <span className="text-xs text-muted-foreground">Simple vocabulary and grammar</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="intermediate">
                              <div className="flex flex-col">
                                <span className="font-medium">Intermediate</span>
                                <span className="text-xs text-muted-foreground">Moderate complexity</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="advanced">
                              <div className="flex flex-col">
                                <span className="font-medium">Advanced</span>
                                <span className="text-xs text-muted-foreground">Complex structures and vocabulary</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="length" className="text-base font-medium">Target Length</Label>
                        <Select value={targetLength.toString()} onValueChange={(value) => setTargetLength(Number(value))}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {lengthOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{option.label}</span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
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

                    {/* Grammar Focus */}
                    <GrammarFocusSelector
                      selectedGrammar={grammarFocus}
                      onGrammarToggle={handleGrammarToggle}
                      maxSelections={3}
                    />
                  </div>
                )}

                {/* Custom Text Input */}
                {contentSource === 'custom' && (
                  <CustomTextInput
                    value={customText}
                    onChange={setCustomText}
                    maxLength={4000}
                  />
                )}
              </form>
            </div>
          </div>

          {/* Sidebar - Desktop/Tablet Only */}
          {!isMobile && (
            <div className="lg:col-span-1 bg-muted/30 p-8 space-y-6">
              {/* Generation Strategy Info */}
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Generation Strategy</div>
                    <div className="text-sm">{getGenerationStrategy()}</div>
                    <div className="text-xs text-muted-foreground">
                      Optimized for {targetLength} words to ensure quality and coherence.
                      {isLongContent && " Advanced adaptive chunking will be used for optimal results."}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Enhanced Features Info */}
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Enhanced Generation</div>
                    <div className="text-sm space-y-1">
                      <div>• Intelligent quality metrics</div>
                      <div>• Smart recovery mechanisms</div>
                      <div>• Automatic audio generation</div>
                      <div>• Advanced chunking strategies</div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Quick Tips */}
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Quick Tips
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• Choose topics you're genuinely interested in</div>
                  <div>• Start with shorter exercises to build confidence</div>
                  <div>• Select 1-3 grammar focuses for best results</div>
                  <div>• Custom text provides instant exercise creation</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex justify-end gap-3 flex-shrink-0 border-t bg-background ${isMobile ? 'p-4' : 'px-8 py-6'}`}>
          <Button type="button" variant="outline" onClick={handleClose} className="min-w-24">
            Cancel
          </Button>
          <Button 
            type="submit" 
            form={formId} 
            disabled={isCreating || !isLanguageSupported}
            className="min-w-32"
          >
            {isCreating ? 'Creating...' : 'Create Exercise'}
          </Button>
        </div>

        {/* Mobile-only enhancement info */}
        {isMobile && (
          <div className="p-4 border-t bg-muted/30">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Enhanced Generation:</strong> Our optimized system uses intelligent strategies, quality metrics, and smart recovery to ensure successful creation.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
