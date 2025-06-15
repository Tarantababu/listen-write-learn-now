
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
import { AlertTriangle, Info, TrendingUp, Brain, Zap, Sparkles, BookOpen, Target, Clock, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [skipAIAnalysis, setSkipAIAnalysis] = useState(false); // New state for skipping AI
  const [isCreating, setIsCreating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState<EnhancedGenerationProgress>({
    progress: 0,
    status: 'generating',
    message: 'Initializing...'
  });
  const { toast } = useToast();
  const isMobile = useIsMobile();

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

    console.log('[MODAL] Starting exercise creation with skipAIAnalysis:', skipAIAnalysis);
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
        customText: contentSource === 'custom' ? customText.trim() : undefined,
        skipAIAnalysis: contentSource === 'custom' && skipAIAnalysis // Only skip AI for custom text when requested
      }, (progressUpdate) => {
        setProgress(progressUpdate);
      });

      if (onSuccess) {
        onSuccess();
      }
      
      // Enhanced success handling
      const processingMethod = exercise.content?.analysis?.generationStrategy;
      const isLocalProcessing = processingMethod === 'local_processing';
      
      const getSuccessMessage = () => {
        if (isLocalProcessing) {
          return "Exercise created with local processing! Your custom text has been structured for reading practice.";
        } else if (contentSource === 'custom') {
          return "Custom text exercise created with AI analysis! Enhanced with vocabulary and grammar insights.";
        } else {
          return `Your ${targetLength}-word reading exercise has been created successfully.`;
        }
      };
      
      toast({
        title: isLocalProcessing ? "Local Processing Complete" : "Exercise Created Successfully",
        description: getSuccessMessage(),
        variant: "default"
      });
      
      console.log('[MODAL] Exercise creation completed with method:', processingMethod);
      
      setTimeout(() => {
        handleClose();
      }, 2000);
      
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
      setSkipAIAnalysis(false);
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
    if (contentSource === 'custom' && skipAIAnalysis) return 'Local Processing';
    if (targetLength <= 800) return 'Enhanced Direct';
    if (targetLength <= 1500) return 'Smart Chunking';
    return 'Adaptive Chunking';
  };

  if (showProgress) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className={`${
          isMobile 
            ? 'w-full h-full max-w-full max-h-full m-0 rounded-none p-3' 
            : 'max-w-3xl max-h-[90vh]'
        } overflow-y-auto border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10`}>
          <DialogHeader className={`text-center space-y-3 pb-4 border-b border-gradient-to-r from-blue-200/50 via-purple-200/50 to-pink-200/50`}>
            <DialogTitle className={`flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              <div className="relative">
                <Brain className={`${isMobile ? 'h-5 w-5' : 'h-7 w-7'} text-blue-600`} />
                <Sparkles className={`${isMobile ? 'h-2 w-2' : 'h-4 w-4'} text-purple-500 absolute -top-1 -right-1 animate-pulse`} />
              </div>
              {skipAIAnalysis ? 'Processing Your Text Locally' : 'Creating Your Enhanced Reading Exercise'}
            </DialogTitle>
          </DialogHeader>
          
          <SimpleCreationProgress
            progress={progress.progress}
            status={progress.status}
            message={progress.message}
            estimatedTime={progress.estimatedTime}
            onCancel={handleClose}
            showOptimizations={!skipAIAnalysis}
            qualityMetrics={progress.qualityMetrics}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${
        isMobile 
          ? 'w-full h-full max-w-full max-h-full m-0 rounded-none p-3' 
          : 'max-w-4xl max-h-[90vh]'
      } overflow-y-auto border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10`}>
        <DialogHeader className={`text-center space-y-3 pb-4 border-b border-gradient-to-r from-blue-200/50 via-purple-200/50 to-pink-200/50`}>
          <DialogTitle className={`flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ${isMobile ? 'text-lg flex-col gap-1' : 'text-2xl'}`}>
            <div className="relative">
              <BookOpen className={`${isMobile ? 'h-5 w-5' : 'h-7 w-7'} text-blue-600`} />
              <Sparkles className={`${isMobile ? 'h-2 w-2' : 'h-4 w-4'} text-purple-500 absolute -top-1 -right-1 animate-pulse`} />
            </div>
            Create Enhanced Reading Exercise
          </DialogTitle>
          <p className={`text-muted-foreground mx-auto leading-relaxed ${isMobile ? 'text-xs max-w-full px-2' : 'max-w-md'}`}>
            Generate personalized reading content with AI-powered enhancements and quality optimization
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'p-0' : 'p-6'}`}>
          {/* Title Section */}
          <div className="space-y-2">
            <Label htmlFor="title" className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
              <Target className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-blue-500`} />
              Exercise Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your exercise..."
              required
              className={`border-2 border-blue-100 focus:border-blue-400 transition-all duration-200 rounded-xl shadow-sm ${isMobile ? 'h-11 text-sm' : 'h-12 text-lg'}`}
            />
          </div>

          {/* Content Source */}
          <div className="space-y-3">
            <h3 className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-lg'}`}>
              <Brain className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-purple-500`} />
              Content Source
            </h3>
            <ContentSourceSelector
              selectedSource={contentSource}
              onSourceSelect={setContentSource}
            />
          </div>

          {contentSource === 'ai' ? (
            <div className="space-y-4">
              {/* Topic Selection */}
              <div className={`bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 ${isMobile ? 'p-3' : 'p-6'} rounded-2xl border border-blue-200 dark:border-blue-800`}>
                <TopicMandalaSelector
                  selectedTopic={topic}
                  onTopicSelect={setTopic}
                  language={language}
                />
              </div>

              {/* Settings Grid */}
              <div className="grid gap-4 grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    <TrendingUp className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-green-500`} />
                    Difficulty Level
                  </Label>
                  <Select value={difficultyLevel} onValueChange={(value: any) => setDifficultyLevel(value)}>
                    <SelectTrigger className={`border-2 border-green-100 focus:border-green-400 rounded-xl ${isMobile ? 'h-11 text-sm' : 'h-12'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner" className={isMobile ? 'py-2' : 'py-3'}>
                        <div className="flex items-center gap-2">
                          <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-green-400`}></div>
                          <span>Beginner</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="intermediate" className={isMobile ? 'py-2' : 'py-3'}>
                        <div className="flex items-center gap-2">
                          <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-yellow-400`}></div>
                          <span>Intermediate</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="advanced" className={isMobile ? 'py-2' : 'py-3'}>
                        <div className="flex items-center gap-2">
                          <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-red-400`}></div>
                          <span>Advanced</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length" className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    <Clock className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-orange-500`} />
                    Target Length
                  </Label>
                  <Select value={targetLength.toString()} onValueChange={(value) => setTargetLength(Number(value))}>
                    <SelectTrigger className={`border-2 border-orange-100 focus:border-orange-400 rounded-xl ${isMobile ? 'h-11 text-sm' : 'h-12'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lengthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()} className={isMobile ? 'py-2' : 'py-3'}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{option.label}</span>
                              <span className={`bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full text-xs`}>
                                {option.strategy}
                              </span>
                            </div>
                            {option.recommended && (
                              <span className={`text-muted-foreground text-xs`}>{option.recommended}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Strategy Information */}
              <Alert className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600`} />
                <AlertDescription className={`text-blue-800 dark:text-blue-200 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <strong className="text-blue-900 dark:text-blue-100">Generation Strategy:</strong> {getGenerationStrategy()} - This strategy is optimized for {targetLength} words to ensure quality and coherence.
                  {isLongContent && " Advanced adaptive chunking will be used for optimal results."}
                </AlertDescription>
              </Alert>

              {/* Grammar Focus */}
              <div className={`bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 ${isMobile ? 'p-3' : 'p-6'} rounded-2xl border border-purple-200 dark:border-purple-800`}>
                <GrammarFocusSelector
                  selectedGrammar={grammarFocus}
                  onGrammarToggle={handleGrammarToggle}
                  maxSelections={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Custom Text Input */}
              <div className={`bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 ${isMobile ? 'p-3' : 'p-6'} rounded-2xl border border-gray-200 dark:border-gray-800`}>
                <CustomTextInput
                  value={customText}
                  onChange={setCustomText}
                  maxLength={4000}
                />
              </div>

              {/* Processing Option for Custom Text */}
              <Alert className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
                <FileText className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-yellow-600`} />
                <AlertDescription className="space-y-3">
                  <div className={`text-yellow-800 dark:text-yellow-200 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    <strong className="text-yellow-900 dark:text-yellow-100">Processing Options:</strong>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="skipAI"
                      checked={skipAIAnalysis}
                      onChange={(e) => setSkipAIAnalysis(e.target.checked)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="skipAI" className={`text-yellow-900 dark:text-yellow-100 font-medium cursor-pointer ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        Use Local Processing (Skip AI Analysis)
                      </Label>
                      <p className={`text-yellow-700 dark:text-yellow-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {skipAIAnalysis 
                          ? 'Your text will be processed locally without AI analysis. Faster but with basic vocabulary support.'
                          : 'Your text will be enhanced with AI-powered vocabulary analysis, translations, and grammar insights.'
                        }
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Feature Highlight */}
          <Alert className="border-2 border-gradient-to-r from-yellow-200 to-orange-200 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-950/30 dark:via-orange-950/30 dark:to-red-950/30">
            <Zap className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-yellow-600`} />
            <AlertDescription className={`text-yellow-800 dark:text-yellow-200 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <strong className="text-yellow-900 dark:text-yellow-100">
                {contentSource === 'custom' && skipAIAnalysis ? 'Local Processing:' : 'Enhanced Generation:'}
              </strong> {contentSource === 'custom' && skipAIAnalysis 
                ? 'Your text will be processed locally for immediate use. Audio generation will still happen automatically in the background.'
                : 'Our optimized system uses intelligent strategies, quality metrics, and smart recovery to ensure successful creation. Audio generation happens automatically in the background.'
              }
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className={`flex gap-3 pt-4 border-t border-gradient-to-r from-blue-200/50 via-purple-200/50 to-pink-200/50 ${isMobile ? 'flex-col' : 'justify-end'}`}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className={`rounded-xl border-2 hover:bg-gray-50 transition-all duration-200 ${isMobile ? 'h-11 text-sm' : 'px-8 py-3 h-12'}`}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
              className={`rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${isMobile ? 'h-11 text-sm' : 'px-8 py-3 h-12'}`}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
                  {contentSource === 'custom' && skipAIAnalysis ? 'Processing...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {contentSource === 'custom' && skipAIAnalysis ? (
                    <FileText className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  ) : (
                    <Sparkles className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  )}
                  {contentSource === 'custom' && skipAIAnalysis ? 'Process Text Locally' : 'Create Enhanced Exercise'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
