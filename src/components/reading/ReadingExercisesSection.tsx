import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, BookOpen, Volume2, Brain, Sparkles, Loader2, Zap } from 'lucide-react';
import { ReadingExerciseModal } from './ReadingExerciseModal';
import { ReadingFocusedModal } from './ReadingFocusedModal';
import { ReadingExerciseCard } from './ReadingExerciseCard';
import { BidirectionalCreateDialog } from '@/components/bidirectional/BidirectionalCreateDialog';
import { optimizedReadingService } from '@/services/optimizedReadingService';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ReadingExercise } from '@/types/reading';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { getReadingFeatureFlags } from '@/utils/featureFlags';
import { supabase } from '@/integrations/supabase/client';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
export const ReadingExercisesSection: React.FC = () => {
  const {
    settings
  } = useUserSettingsContext();
  const {
    addExercise
  } = useExerciseContext();
  const {
    subscription
  } = useSubscription();
  const isMobile = useIsMobile();
  const [exercises, setExercises] = useState<ReadingExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [creatingDictation, setCreatingDictation] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [practiceExercise, setPracticeExercise] = useState<ReadingExercise | null>(null);

  // Bidirectional dialog states
  const [isBidirectionalDialogOpen, setIsBidirectionalDialogOpen] = useState(false);
  const [selectedTextForBidirectional, setSelectedTextForBidirectional] = useState('');

  // Get feature flags for enhanced reading features
  const featureFlags = getReadingFeatureFlags();

  // Mock exercise limit for bidirectional exercises
  const exerciseLimit = {
    canCreate: subscription.isSubscribed || true,
    currentCount: 0,
    limit: subscription.isSubscribed ? Infinity : 10
  };
  useEffect(() => {
    loadExercises();
  }, [settings.selectedLanguage]);
  const loadExercises = async () => {
    try {
      setLoading(true);
      const data = await optimizedReadingService.getReadingExercises(settings.selectedLanguage);
      setExercises(data);
    } catch (error) {
      console.error('Error loading reading exercises:', error);
      toast.error('Failed to load reading exercises');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteExercise = async (exercise: ReadingExercise) => {
    try {
      await optimizedReadingService.deleteReadingExercise(exercise.id);
      setExercises(prev => prev.filter(e => e.id !== exercise.id));
      toast.success('Reading exercise deleted');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Failed to delete exercise');
    }
  };
  const generateAudioForText = async (text: string, language: string): Promise<string | undefined> => {
    try {
      console.log('Generating audio for dictation text:', text.substring(0, 50) + '...');
      const {
        data,
        error
      } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          language
        }
      });
      if (error) {
        console.error('Error invoking text-to-speech function:', error);
        throw error;
      }
      if (data?.audio_url || data?.audioUrl) {
        const audioUrl = data.audio_url || data.audioUrl;
        console.log('Audio generated successfully:', audioUrl);
        return audioUrl;
      } else {
        console.warn('No audio URL in response:', data);
        return undefined;
      }
    } catch (error) {
      console.error('Error generating audio for dictation:', error);
      throw error;
    }
  };
  const handleCreateDictation = async (selectedText: string) => {
    if (creatingDictation) return;
    setCreatingDictation(true);
    try {
      console.log('Creating dictation exercise with audio generation for text:', selectedText);
      let audioUrl: string | undefined;
      try {
        audioUrl = await generateAudioForText(selectedText, settings.selectedLanguage);
        if (audioUrl) {
          console.log('Audio generated successfully for dictation exercise');
        } else {
          console.warn('Audio generation returned no URL, creating exercise without audio');
        }
      } catch (audioError) {
        console.error('Audio generation failed, creating exercise without audio:', audioError);
        audioUrl = undefined;
      }
      const dictationExercise = {
        title: `Dictation: ${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}`,
        text: selectedText,
        language: settings.selectedLanguage as any,
        tags: ['dictation', 'from-reading'],
        directoryId: null,
        audioUrl: audioUrl || undefined
      };
      await addExercise(dictationExercise);
      if (audioUrl) {
        toast.success('Dictation exercise created with audio successfully!');
      } else {
        toast.success('Dictation exercise created successfully! (Audio generation failed, you can add audio later)');
      }
    } catch (error) {
      console.error('Error creating dictation exercise:', error);
      toast.error('Failed to create dictation exercise');
    } finally {
      setCreatingDictation(false);
    }
  };
  const handleCreateBidirectional = async (selectedText: string) => {
    console.log('Opening bidirectional dialog for text:', selectedText);
    setSelectedTextForBidirectional(selectedText);
    setIsBidirectionalDialogOpen(true);
  };
  const handleBidirectionalExerciseCreated = () => {
    console.log('Bidirectional exercise created successfully');
    setIsBidirectionalDialogOpen(false);
    setSelectedTextForBidirectional('');
  };
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) || exercise.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty_level === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });
  if (loading) {
    return <div className="space-y-6">
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {Array.from({
          length: 6
        }).map((_, i) => <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      

      {/* Enhanced Feature Highlights */}
      

      {/* Controls */}
      <div className={`flex gap-4 ${isMobile ? 'flex-col px-4' : 'flex-col md:flex-row'}`}>
        <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-1'}`}>
          <div className={`relative ${isMobile ? 'w-full' : 'flex-1'}`}>
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <Input placeholder="Search exercises by title or topic..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`pl-10 ${isMobile ? 'text-base py-3' : ''}`} />
          </div>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className={isMobile ? 'w-full text-base py-3' : 'w-48'}>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className={isMobile ? 'w-full py-3' : ''}>
          <Plus className="h-4 w-4 mr-2" />
          Create Exercise
        </Button>
      </div>

      {/* Show loading indicator when creating dictation */}
      {creatingDictation && <Card className={`border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20 ${isMobile ? 'mx-4' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Creating Dictation Exercise
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Generating audio and setting up the exercise...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Exercises Grid */}
      {filteredExercises.length === 0 ? <Card className={`text-center ${isMobile ? 'py-8 mx-4' : 'py-12'}`}>
          <CardContent>
            <BookOpen className={`mx-auto text-muted-foreground mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
            <h3 className={`font-semibold mb-2 ${isMobile ? 'text-base' : ''}`}>No Reading Exercises Yet</h3>
            <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
              {exercises.length === 0 ? 'Create your first reading exercise with our optimized system!' : 'No exercises match your current search filters.'}
            </p>
            {exercises.length === 0 && <Button onClick={() => setIsCreateModalOpen(true)} className={isMobile ? 'w-full py-3' : ''}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Exercise
              </Button>}
          </CardContent>
        </Card> : <div className={`grid gap-6 ${isMobile ? 'grid-cols-1 px-4' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {filteredExercises.map(exercise => <ReadingExerciseCard key={exercise.id} exercise={exercise} onPractice={setPracticeExercise} onDelete={handleDeleteExercise} />)}
        </div>}

      {/* Modals */}
      <ReadingExerciseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={loadExercises} language={settings.selectedLanguage} />

      {/* Enhanced Reading Modal with all feature flags */}
      <ReadingFocusedModal exercise={practiceExercise} isOpen={!!practiceExercise} onClose={() => setPracticeExercise(null)} onCreateDictation={handleCreateDictation} onCreateBidirectional={handleCreateBidirectional} enableTextSelection={featureFlags.enableTextSelection} enableVocabularyIntegration={featureFlags.enableVocabularyIntegration} enableEnhancedHighlighting={featureFlags.enableEnhancedHighlighting} enableFullTextAudio={featureFlags.enableAdvancedFeatures} enableWordSynchronization={featureFlags.enableWordSynchronization} enableContextMenu={featureFlags.enableContextMenu} enableSelectionFeedback={featureFlags.enableSelectionFeedback} enableSmartTextProcessing={featureFlags.enableSmartTextProcessing} />

      {/* Bidirectional Exercise Creation Dialog */}
      <BidirectionalCreateDialog isOpen={isBidirectionalDialogOpen} onClose={() => {
      setIsBidirectionalDialogOpen(false);
      setSelectedTextForBidirectional('');
    }} onExerciseCreated={handleBidirectionalExerciseCreated} exerciseLimit={exerciseLimit} targetLanguage={settings.selectedLanguage} supportedLanguages={SUPPORTED_LANGUAGES} prefilledText={selectedTextForBidirectional} />
    </div>;
};