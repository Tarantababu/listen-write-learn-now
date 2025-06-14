import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Target, 
  GraduationCap,
  Zap,
  ChevronRight,
  ArrowLeft,
  FileText,
  Book
} from 'lucide-react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { readingExerciseService } from '@/services/readingExerciseService';
import { TopicMandalaSelector } from './TopicMandalaSelector';
import { GrammarFocusSelector } from './GrammarFocusSelector';
import { ReadingExerciseCreationProgress } from './ReadingExerciseCreationProgress';
import { ContentSourceSelector } from './ContentSourceSelector';
import { CustomTextInput } from './CustomTextInput';
import { toast } from 'sonner';

interface ReadingExerciseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  estimatedTime: number;
}

const DIFFICULTY_OPTIONS = [
  {
    value: 'beginner',
    label: 'Beginner',
    subtitle: 'A1-A2 Level',
    description: 'Simple vocabulary, basic grammar, short sentences',
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    subtitle: 'B1-B2 Level',
    description: 'Varied vocabulary, complex sentences, cultural references',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  },
  {
    value: 'advanced',
    label: 'Advanced',
    subtitle: 'C1-C2 Level',
    description: 'Sophisticated language, nuanced expressions, abstract concepts',
    color: 'bg-red-100 text-red-700 border-red-200'
  }
];

const LENGTH_OPTIONS = [
  {
    value: 300,
    label: 'Short Read',
    subtitle: '~300 words',
    description: 'Quick daily practice session (2-3 min)',
    icon: Zap
  },
  {
    value: 700,
    label: 'Medium Read',
    subtitle: '~700 words',
    description: 'Standard focused learning (4-5 min)',
    icon: Target
  },
  {
    value: 1200,
    label: 'Extended Read',
    subtitle: '~1,200 words',
    description: 'Deep dive into topics (7-8 min)',
    icon: BookOpen
  },
  {
    value: 2000,
    label: 'Long Read',
    subtitle: '~2,000 words',
    description: 'Comprehensive exploration (10-12 min)',
    icon: Book
  },
  {
    value: 3000,
    label: 'Article Length',
    subtitle: '~3,000 words',
    description: 'Full article experience (15-18 min)',
    icon: FileText
  },
  {
    value: 4000,
    label: 'Essay Length',
    subtitle: '~4,000 words',
    description: 'Complete story or essay (20-25 min)',
    icon: GraduationCap
  }
];

const AI_CREATION_STEPS: ProgressStep[] = [
  {
    id: 'content-generation',
    label: 'Content Planning',
    description: 'AI is analyzing your requirements and planning the content',
    status: 'pending',
    estimatedTime: 3
  },
  {
    id: 'chunked-generation',
    label: 'Smart Generation',
    description: 'Using advanced chunking for optimal content creation',
    status: 'pending',
    estimatedTime: 12
  },
  {
    id: 'text-processing',
    label: 'Content Assembly',
    description: 'Combining and optimizing the generated content',
    status: 'pending',
    estimatedTime: 3
  },
  {
    id: 'audio-generation',
    label: 'Audio Creation',
    description: 'Generating high-quality pronunciation audio in background',
    status: 'pending',
    estimatedTime: 5
  },
  {
    id: 'finalization',
    label: 'Finalizing',
    description: 'Preparing your exercise for immediate use',
    status: 'pending',
    estimatedTime: 2
  }
];

const CUSTOM_CREATION_STEPS: ProgressStep[] = [
  {
    id: 'text-processing',
    label: 'Text Analysis',
    description: 'Processing your text and analyzing vocabulary',
    status: 'pending',
    estimatedTime: 4
  },
  {
    id: 'audio-generation',
    label: 'Audio Creation',
    description: 'Generating high-quality pronunciation audio',
    status: 'pending',
    estimatedTime: 8
  },
  {
    id: 'finalization',
    label: 'Finalizing',
    description: 'Preparing your exercise for practice',
    status: 'pending',
    estimatedTime: 2
  }
];

export const ReadingExerciseModal: React.FC<ReadingExerciseModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess
}) => {
  const { settings } = useUserSettingsContext();
  const [currentTab, setCurrentTab] = useState('setup');
  const [isCreating, setIsCreating] = useState(false);
  const [creationSteps, setCreationSteps] = useState<ProgressStep[]>(AI_CREATION_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(25);

  const [formData, setFormData] = useState({
    contentSource: 'ai' as 'ai' | 'custom',
    title: '',
    selectedTopic: '',
    customText: '',
    difficulty_level: 'beginner' as const,
    target_length: 700,
    selectedGrammar: [] as string[]
  });

  // Update validation logic based on content source
  const canProceed = formData.contentSource === 'ai' 
    ? formData.selectedTopic && formData.title.trim()
    : formData.customText.trim() && formData.customText.length <= 4000 && formData.title.trim();

  // Calculate total estimated time based on content source
  const currentCreationSteps = formData.contentSource === 'ai' ? AI_CREATION_STEPS : CUSTOM_CREATION_STEPS;
  const totalEstimatedTime = currentCreationSteps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);

  const handleContentSourceSelect = (source: 'ai' | 'custom') => {
    setFormData(prev => ({ 
      ...prev, 
      contentSource: source,
      // Reset relevant fields when switching
      title: source === 'custom' ? 'My Custom Reading' : prev.title,
      selectedTopic: source === 'custom' ? '' : prev.selectedTopic,
      customText: source === 'ai' ? '' : prev.customText
    }));
  };

  const handleTopicSelect = (topicId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedTopic: topicId,
      title: prev.title || getTopicDisplayName(topicId)
    }));
  };

  const getTopicDisplayName = (topicId: string) => {
    const topicMap: Record<string, string> = {
      'daily-routines': 'Daily Life Adventures',
      'travel-culture': 'Travel Stories',
      'food-cooking': 'Culinary Journey',
      'technology': 'Tech Insights',
      'environment': 'Nature Chronicles',
      'health-fitness': 'Wellness Guide',
      'education': 'Learning Experience',
      'business': 'Professional Life'
    };
    return topicMap[topicId] || 'Reading Exercise';
  };

  const handleGrammarToggle = (grammarId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGrammar: prev.selectedGrammar.includes(grammarId)
        ? prev.selectedGrammar.filter(id => id !== grammarId)
        : prev.selectedGrammar.length < 3
          ? [...prev.selectedGrammar, grammarId]
          : prev.selectedGrammar
    }));
  };

  const simulateCreationProgress = async () => {
    const steps = [...currentCreationSteps];
    let stepIndex = 0;
    
    for (const step of steps) {
      setCurrentStep(stepIndex);
      setCreationSteps(prev => prev.map((s, i) => 
        i === stepIndex ? { ...s, status: 'active' } : s
      ));
      
      // Adaptive timing based on content length
      let stepDuration = step.estimatedTime || 2;
      if (step.id === 'chunked-generation' && formData.target_length > 2000) {
        stepDuration = Math.min(20, Math.floor(formData.target_length / 200));
      }
      
      for (let i = 0; i <= stepDuration; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const stepProgress = (i / stepDuration) * 100;
        const overallProgressValue = ((stepIndex + (i / stepDuration)) / steps.length) * 100;
        setOverallProgress(overallProgressValue);
        
        const remaining = Math.max(0, totalEstimatedTime - Math.floor((overallProgressValue / 100) * totalEstimatedTime));
        setEstimatedTimeRemaining(remaining);
      }
      
      setCreationSteps(prev => prev.map((s, i) => 
        i === stepIndex ? { ...s, status: 'completed' } : s
      ));
      
      stepIndex++;
    }
  };

  const handleCreateExercise = async () => {
    setIsCreating(true);
    setCurrentTab('progress');
    
    const stepsToUse = formData.contentSource === 'ai' ? AI_CREATION_STEPS : CUSTOM_CREATION_STEPS;
    setCreationSteps(stepsToUse);
    setEstimatedTimeRemaining(stepsToUse.reduce((sum, step) => sum + step.estimatedTime, 0));
    
    try {
      // Start progress simulation
      simulateCreationProgress();
      
      // Create the actual exercise
      if (formData.contentSource === 'ai') {
        await readingExerciseService.createReadingExercise({
          title: formData.title,
          topic: getTopicDisplayName(formData.selectedTopic),
          difficulty_level: formData.difficulty_level,
          target_length: formData.target_length,
          grammar_focus: formData.selectedGrammar.join(', '),
          language: settings.selectedLanguage
        });
      } else {
        await readingExerciseService.createReadingExercise({
          title: formData.title,
          topic: 'Custom Content',
          difficulty_level: formData.difficulty_level,
          target_length: formData.customText.length,
          grammar_focus: formData.selectedGrammar.join(', '),
          language: settings.selectedLanguage,
          customText: formData.customText
        });
      }
      
      toast.success('Reading exercise created successfully! Audio generation continues in background.');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating reading exercise:', error);
      toast.error('Failed to create reading exercise. Please try again.');
      setIsCreating(false);
      setCurrentTab('setup');
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    
    onOpenChange(false);
    setTimeout(() => {
      setCurrentTab('setup');
      setIsCreating(false);
      setCreationSteps(AI_CREATION_STEPS);
      setCurrentStep(0);
      setOverallProgress(0);
      setEstimatedTimeRemaining(25);
      setFormData({
        contentSource: 'ai',
        title: '',
        selectedTopic: '',
        customText: '',
        difficulty_level: 'beginner',
        target_length: 700,
        selectedGrammar: []
      });
    }, 300);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setCurrentTab('setup');
    setCreationSteps(AI_CREATION_STEPS);
    setCurrentStep(0);
    setOverallProgress(0);
    toast.info('Exercise creation cancelled');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span>AI-Powered Reading Exercise</span>
              <p className="text-sm font-normal text-muted-foreground mt-1">
                Create personalized content with pre-generated audio
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="setup" disabled={isCreating}>
                <BookOpen className="h-4 w-4 mr-2" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="progress" disabled={!isCreating}>
                <Loader2 className={`h-4 w-4 mr-2 ${isCreating ? 'animate-spin' : ''}`} />
                Creating
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              {/* Content Source Selection */}
              <div className="space-y-4">
                <ContentSourceSelector
                  selectedSource={formData.contentSource}
                  onSourceSelect={handleContentSourceSelect}
                />
              </div>

              <Separator />

              {/* Conditional Content Based on Source */}
              {formData.contentSource === 'ai' ? (
                <div className="space-y-6">
                  {/* Topic Selection for AI */}
                  <div className="space-y-4">
                    <TopicMandalaSelector
                      selectedTopic={formData.selectedTopic}
                      onTopicSelect={handleTopicSelect}
                    />
                  </div>

                  <Separator />

                  {/* Exercise Details for AI */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Exercise Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., A Day in Tokyo"
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Difficulty Level</Label>
                        <div className="grid gap-2">
                          {DIFFICULTY_OPTIONS.map((option) => (
                            <Card
                              key={option.value}
                              className={`
                                cursor-pointer transition-all
                                ${formData.difficulty_level === option.value 
                                  ? 'ring-2 ring-primary shadow-md' 
                                  : 'hover:shadow-sm'
                                }
                              `}
                              onClick={() => setFormData(prev => ({ 
                                ...prev, 
                                difficulty_level: option.value as any 
                              }))}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{option.label}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        {option.subtitle}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {option.description}
                                    </p>
                                  </div>
                                  <div className={`
                                    w-4 h-4 rounded-full border-2 transition-all
                                    ${formData.difficulty_level === option.value
                                      ? 'bg-primary border-primary'
                                      : 'border-muted-foreground/30'
                                    }
                                  `} />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label>Reading Length</Label>
                        <div className="grid gap-2">
                          {LENGTH_OPTIONS.map((option) => {
                            const IconComponent = option.icon;
                            return (
                              <Card
                                key={option.value}
                                className={`
                                  cursor-pointer transition-all
                                  ${formData.target_length === option.value 
                                    ? 'ring-2 ring-primary shadow-md' 
                                    : 'hover:shadow-sm'
                                  }
                                `}
                                onClick={() => setFormData(prev => ({ 
                                  ...prev, 
                                  target_length: option.value 
                                }))}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium">{option.label}</h4>
                                          <Badge variant="outline" className="text-xs">
                                            {option.subtitle}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {option.description}
                                        </p>
                                      </div>
                                    </div>
                                    <div className={`
                                      w-4 h-4 rounded-full border-2 transition-all
                                      ${formData.target_length === option.value
                                        ? 'bg-primary border-primary'
                                        : 'border-muted-foreground/30'
                                      }
                                    `} />
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Custom Text Input */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Exercise Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., My Custom Reading"
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Difficulty Level</Label>
                        <div className="grid gap-2">
                          {DIFFICULTY_OPTIONS.map((option) => (
                            <Card
                              key={option.value}
                              className={`
                                cursor-pointer transition-all
                                ${formData.difficulty_level === option.value 
                                  ? 'ring-2 ring-primary shadow-md' 
                                  : 'hover:shadow-sm'
                                }
                              `}
                              onClick={() => setFormData(prev => ({ 
                                ...prev, 
                                difficulty_level: option.value as any 
                              }))}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{option.label}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        {option.subtitle}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {option.description}
                                    </p>
                                  </div>
                                  <div className={`
                                    w-4 h-4 rounded-full border-2 transition-all
                                    ${formData.difficulty_level === option.value
                                      ? 'bg-primary border-primary'
                                      : 'border-muted-foreground/30'
                                    }
                                  `} />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <CustomTextInput
                        value={formData.customText}
                        onChange={(value) => setFormData(prev => ({ ...prev, customText: value }))}
                        maxLength={4000}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Grammar Focus (shown for both modes) */}
              <GrammarFocusSelector
                selectedGrammar={formData.selectedGrammar}
                onGrammarToggle={handleGrammarToggle}
              />

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {canProceed && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Estimated creation time: ~{totalEstimatedTime}s (includes audio)
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateExercise} 
                    disabled={!canProceed}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Create Exercise
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="h-full">
              <ReadingExerciseCreationProgress
                steps={creationSteps}
                currentStep={currentStep}
                overallProgress={overallProgress}
                onCancel={handleCancel}
                estimatedTimeRemaining={estimatedTimeRemaining}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
