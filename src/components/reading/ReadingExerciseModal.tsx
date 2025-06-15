
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContentSourceSelector } from './ContentSourceSelector';
import { TopicMandalaSelector } from './TopicMandalaSelector';
import { GrammarFocusSelector } from './GrammarFocusSelector';
import { CustomTextInput } from './CustomTextInput';
import { ReadingExerciseCreationProgress } from './ReadingExerciseCreationProgress';
import { optimizedReadingService } from '@/services/optimizedReadingService';
import { useReadingExerciseLimits } from '@/hooks/use-reading-exercise-limits';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import type { CreateReadingExerciseRequest } from '@/types/reading';

interface ReadingExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: string;
}

export const ReadingExerciseModal: React.FC<ReadingExerciseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language
}) => {
  const { subscription } = useSubscription();
  const exerciseLimit = useReadingExerciseLimits(language);
  const isMobile = useIsMobile();
  
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    target_length: 500,
    grammar_focus: '',
    customText: ''
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState({
    progress: 0,
    status: 'generating' as 'generating' | 'completed' | 'error',
    message: '',
    estimatedTime: 0
  });
  const [contentSource, setContentSource] = useState<'ai' | 'custom'>('ai');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check exercise limit before creating
    if (!exerciseLimit.canCreate) {
      toast.error(`You've reached the limit of ${exerciseLimit.limit} reading exercises. Upgrade to create more!`);
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title for your exercise');
      return;
    }

    if (contentSource === 'ai' && !formData.topic.trim()) {
      toast.error('Please enter a topic for AI generation');
      return;
    }

    if (contentSource === 'custom' && !formData.customText.trim()) {
      toast.error('Please enter your custom text');
      return;
    }

    setIsCreating(true);
    setCreationProgress({
      progress: 0,
      status: 'generating',
      message: 'Starting exercise creation...',
      estimatedTime: 30
    });

    try {
      const request: CreateReadingExerciseRequest = {
        title: formData.title,
        language,
        difficulty_level: formData.difficulty_level,
        target_length: contentSource === 'custom' ? formData.customText.split(' ').length : formData.target_length,
        topic: contentSource === 'custom' ? 'Custom Text' : formData.topic,
        grammar_focus: formData.grammar_focus || undefined,
        customText: contentSource === 'custom' ? formData.customText : undefined
      };

      await optimizedReadingService.createReadingExercise(request, (progress) => {
        setCreationProgress(progress);
      });

      toast.success('Reading exercise created successfully!');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating reading exercise:', error);
      toast.error('Failed to create reading exercise. Please try again.');
      setCreationProgress(prev => ({
        ...prev,
        status: 'error',
        message: 'Failed to create exercise'
      }));
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      topic: '',
      difficulty_level: 'beginner',
      target_length: 500,
      grammar_focus: '',
      customText: ''
    });
    setContentSource('ai');
    setCreationProgress({
      progress: 0,
      status: 'generating',
      message: '',
      estimatedTime: 0
    });
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isMobile ? 'w-[95vw] max-w-[95vw]' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create Reading Exercise
            {!subscription.isSubscribed && !exerciseLimit.isLoading && (
              <span className="text-sm text-muted-foreground font-normal">
                ({exerciseLimit.currentCount}/{exerciseLimit.limit})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Exercise Limit Warning */}
        {!subscription.isSubscribed && !exerciseLimit.canCreate && (
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You've reached your limit of {exerciseLimit.limit} reading exercises. 
              Upgrade to create unlimited exercises!
            </AlertDescription>
          </Alert>
        )}

        {isCreating ? (
          <ReadingExerciseCreationProgress
            progress={creationProgress.progress}
            status={creationProgress.status}
            message={creationProgress.message}
            estimatedTime={creationProgress.estimatedTime}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Exercise Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a title for your reading exercise"
                  required
                />
              </div>

              <ContentSourceSelector
                value={contentSource}
                onChange={setContentSource}
              />

              {contentSource === 'ai' ? (
                <>
                  <TopicMandalaSelector
                    value={formData.topic}
                    onChange={(topic) => setFormData(prev => ({ ...prev, topic }))}
                    language={language}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select
                        value={formData.difficulty_level}
                        onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                          setFormData(prev => ({ ...prev, difficulty_level: value }))
                        }
                      >
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

                    <div>
                      <Label htmlFor="length">Target Length (words)</Label>
                      <Select
                        value={formData.target_length.toString()}
                        onValueChange={(value) =>
                          setFormData(prev => ({ ...prev, target_length: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">300 words (~2 min)</SelectItem>
                          <SelectItem value="500">500 words (~3 min)</SelectItem>
                          <SelectItem value="800">800 words (~4 min)</SelectItem>
                          <SelectItem value="1200">1200 words (~6 min)</SelectItem>
                          <SelectItem value="1500">1500 words (~8 min)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <GrammarFocusSelector
                    value={formData.grammar_focus}
                    onChange={(focus) => setFormData(prev => ({ ...prev, grammar_focus: focus }))}
                    language={language}
                    difficultyLevel={formData.difficulty_level}
                  />
                </>
              ) : (
                <CustomTextInput
                  value={formData.customText}
                  onChange={(text) => setFormData(prev => ({ ...prev, customText: text }))}
                  language={language}
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || exerciseLimit.isLoading || !exerciseLimit.canCreate}
              >
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {!exerciseLimit.canCreate ? 'Limit Reached' : 'Create Exercise'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
