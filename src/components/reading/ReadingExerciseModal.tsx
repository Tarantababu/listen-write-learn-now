
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
  ArrowLeft
} from 'lucide-react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { readingExerciseService } from '@/services/readingExerciseService';
import { TopicMandalaSelector } from './TopicMandalaSelector';
import { GrammarFocusSelector } from './GrammarFocusSelector';
import { ReadingExerciseCreationProgress } from './ReadingExerciseCreationProgress';
import { toast } from 'sonner';

interface ReadingExerciseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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
    value: 80,
    label: 'Quick Read',
    subtitle: '~30 seconds',
    description: 'Perfect for daily practice sessions',
    icon: Zap
  },
  {
    value: 120,
    label: 'Standard',
    subtitle: '~45 seconds',
    description: 'Balanced length for focused learning',
    icon: Target
  },
  {
    value: 200,
    label: 'Extended',
    subtitle: '~1 minute',
    description: 'Deep dive into interesting topics',
    icon: BookOpen
  },
  {
    value: 300,
    label: 'Comprehensive',
    subtitle: '~1.5 minutes',
    description: 'Full story experience with rich content',
    icon: GraduationCap
  }
];

const CREATION_STEPS = [
  {
    id: 'content-generation',
    label: 'Content Generation',
    description: 'AI is writing your personalized reading passage',
    status: 'pending' as const,
    estimatedTime: 8
  },
  {
    id: 'text-processing',
    label: 'Text Analysis',
    description: 'Processing vocabulary and grammar analysis',
    status: 'pending' as const,
    estimatedTime: 3
  },
  {
    id: 'audio-generation',
    label: 'Audio Creation',
    description: 'Generating high-quality pronunciation audio',
    status: 'pending' as const,
    estimatedTime: 5
  },
  {
    id: 'finalization',
    label: 'Finalizing',
    description: 'Preparing your exercise for practice',
    status: 'pending' as const,
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
  const [creationSteps, setCreationSteps] = useState(CREATION_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(18);

  const [formData, setFormData] = useState({
    title: '',
    selectedTopic: '',
    difficulty_level: 'beginner' as const,
    target_length: 120,
    selectedGrammar: [] as string[]
  });

  const canProceed = formData.selectedTopic && formData.title.trim();
  const totalEstimatedTime = CREATION_STEPS.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);

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
    const steps = [...CREATION_STEPS];
    let stepIndex = 0;
    
    for (const step of steps) {
      setCurrentStep(stepIndex);
      setCreationSteps(prev => prev.map((s, i) => 
        i === stepIndex ? { ...s, status: 'active' } : s
      ));
      
      // Simulate step duration
      const stepDuration = step.estimatedTime || 2;
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
    
    try {
      // Start progress simulation
      simulateCreationProgress();
      
      // Create the actual exercise
      await readingExerciseService.createReadingExercise({
        title: formData.title,
        topic: getTopicDisplayName(formData.selectedTopic),
        difficulty_level: formData.difficulty_level,
        target_length: formData.target_length,
        grammar_focus: formData.selectedGrammar.join(', '),
        language: settings.selectedLanguage
      });
      
      toast.success('Reading exercise created successfully!');
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
      setCreationSteps(CREATION_STEPS);
      setCurrentStep(0);
      setOverallProgress(0);
      setEstimatedTimeRemaining(18);
      setFormData({
        title: '',
        selectedTopic: '',
        difficulty_level: 'beginner',
        target_length: 120,
        selectedGrammar: []
      });
    }, 300);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setCurrentTab('setup');
    setCreationSteps(CREATION_STEPS);
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
                Create personalized content with enhanced learning features
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
              {/* Topic Selection */}
              <div className="space-y-4">
                <TopicMandalaSelector
                  selectedTopic={formData.selectedTopic}
                  onTopicSelect={handleTopicSelect}
                />
              </div>

              <Separator />

              {/* Exercise Details */}
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

              <Separator />

              {/* Grammar Focus */}
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
                      Estimated creation time: ~{totalEstimatedTime}s
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
