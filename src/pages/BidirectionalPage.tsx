
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Brain, BookOpen, Trophy, Lock } from 'lucide-react';
import { FlagIcon } from 'react-flag-kit';
import { BidirectionalExerciseCard } from '@/components/bidirectional/BidirectionalExerciseCard';
import { BidirectionalPracticeModal } from '@/components/bidirectional/BidirectionalPracticeModal';
import { BidirectionalReviewModal } from '@/components/bidirectional/BidirectionalReviewModal';
import { LanguageSelectWithFlag } from '@/components/bidirectional/LanguageSelectWithFlag';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { useToast } from '@/hooks/use-toast';
import { getLanguageFlagCode } from '@/utils/languageUtils';

const SUPPORTED_LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'mandarin chinese', label: 'Mandarin Chinese' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'german', label: 'German' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'russian', label: 'Russian' },
  { value: 'italian', label: 'Italian' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'korean', label: 'Korean' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'turkish', label: 'Turkish' },
  { value: 'dutch', label: 'Dutch' },
  { value: 'greek', label: 'Greek' },
  { value: 'polish', label: 'Polish' },
  { value: 'swedish', label: 'Swedish' },
  { value: 'norwegian', label: 'Norwegian' },
  { value: 'czech', label: 'Czech' },
  { value: 'danish', label: 'Danish' },
  { value: 'hungarian', label: 'Hungarian' },
  { value: 'finnish', label: 'Finnish' },
  { value: 'ukrainian', label: 'Ukrainian' },
  { value: 'romanian', label: 'Romanian' },
  { value: 'hebrew', label: 'Hebrew' }
];

const BidirectionalPage: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const { toast } = useToast();

  // State for exercise creation
  const [originalSentence, setOriginalSentence] = useState('');
  // Target language now comes from user settings and cannot be changed
  const targetLanguage = settings.selectedLanguage;
  const [supportLanguage, setSupportLanguage] = useState('english');
  const [isCreating, setIsCreating] = useState(false);

  // State for exercises - now filtered by target language
  const [learningExercises, setLearningExercises] = useState<BidirectionalExercise[]>([]);
  const [reviewingExercises, setReviewingExercises] = useState<BidirectionalExercise[]>([]);
  const [masteredExercises, setMasteredExercises] = useState<BidirectionalExercise[]>([]);
  const [dueReviews, setDueReviews] = useState<{ exercise: BidirectionalExercise; review_type: 'forward' | 'backward' }[]>([]);

  // State for modals
  const [practiceExercise, setPracticeExercise] = useState<BidirectionalExercise | null>(null);
  const [reviewExercise, setReviewExercise] = useState<BidirectionalExercise | null>(null);
  const [reviewType, setReviewType] = useState<'forward' | 'backward'>('forward');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && targetLanguage) {
      loadExercises();
    }
  }, [user, targetLanguage]);

  const loadExercises = async () => {
    if (!user || !targetLanguage) return;

    try {
      setIsLoading(true);
      
      // Load exercises filtered by the user's selected target language
      const [learning, reviewing, mastered, due] = await Promise.all([
        BidirectionalService.getUserExercises(user.id, targetLanguage, 'learning'),
        BidirectionalService.getUserExercises(user.id, targetLanguage, 'reviewing'),
        BidirectionalService.getUserExercises(user.id, targetLanguage, 'mastered'),
        BidirectionalService.getExercisesDueForReview(user.id, targetLanguage)
      ]);

      setLearningExercises(learning);
      setReviewingExercises(reviewing);
      setMasteredExercises(mastered);
      setDueReviews(due);
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast({
        title: "Error",
        description: "Failed to load exercises. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExercise = async () => {
    if (!originalSentence.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence to translate.",
        variant: "destructive"
      });
      return;
    }

    if (!targetLanguage) {
      toast({
        title: "Error",
        description: "Please select a target language in your account settings.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      await BidirectionalService.createExercise({
        original_sentence: originalSentence,
        target_language: targetLanguage,
        support_language: supportLanguage
      });

      setOriginalSentence('');
      toast({
        title: "Success",
        description: "Exercise created successfully!"
      });
      
      loadExercises();
    } catch (error) {
      console.error('Error creating exercise:', error);
      toast({
        title: "Error",
        description: "Failed to create exercise. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePractice = (exercise: BidirectionalExercise) => {
    setPracticeExercise(exercise);
  };

  const handleReview = (exercise: BidirectionalExercise, type: 'forward' | 'backward' = 'forward') => {
    setReviewExercise(exercise);
    setReviewType(type);
  };

  const handleDelete = async (exerciseId: string) => {
    try {
      await BidirectionalService.deleteExercise(exerciseId);
      toast({
        title: "Success",
        description: "Exercise deleted successfully."
      });
      loadExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Error",
        description: "Failed to delete exercise. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReviewFromDue = (dueReview: { exercise: BidirectionalExercise; review_type: 'forward' | 'backward' }) => {
    setReviewExercise(dueReview.exercise);
    setReviewType(dueReview.review_type);
  };

  // Get the display label for the current target language
  const getLanguageLabel = (languageValue: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.value === languageValue);
    return lang ? lang.label : languageValue;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Please log in to access the Bidirectional Method.</p>
      </div>
    );
  }

  if (!targetLanguage) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card>
          <CardHeader>
            <CardTitle>No Target Language Selected</CardTitle>
            <CardDescription>
              Please select a target language in your account settings to use the Bidirectional Method.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bidirectional Method</h1>
        <p className="text-muted-foreground">
          Practice translation in both directions with spaced repetition for{' '}
          <span className="inline-flex items-center gap-1 font-medium">
            <FlagIcon code={getLanguageFlagCode(targetLanguage)} size={16} />
            {getLanguageLabel(targetLanguage)}
          </span>
        </p>
      </div>

      {/* Due Reviews Section */}
      {dueReviews.length > 0 && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Brain className="h-5 w-5" />
              Reviews Due ({dueReviews.length})
            </CardTitle>
            <CardDescription>
              Complete these reviews to maintain your learning progress for {getLanguageLabel(targetLanguage)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dueReviews.map((dueReview, index) => (
                <div key={`${dueReview.exercise.id}-${dueReview.review_type}`} className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <p className="font-medium mb-2">{dueReview.exercise.original_sentence}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {dueReview.review_type === 'forward' ? 'Forward' : 'Backward'} translation
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleReviewFromDue(dueReview)}
                    className="w-full"
                  >
                    Review Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Exercise Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Exercise for {getLanguageLabel(targetLanguage)}
          </CardTitle>
          <CardDescription>
            Add a sentence to practice with the bidirectional method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Sentence to translate:
            </label>
            <Textarea
              value={originalSentence}
              onChange={(e) => setOriginalSentence(e.target.value)}
              placeholder={`Enter a sentence in ${getLanguageLabel(targetLanguage)}...`}
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Language (sentence language):
              </label>
              <div className="relative">
                <Select value={targetLanguage} disabled>
                  <SelectTrigger className="bg-muted cursor-not-allowed opacity-60">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <FlagIcon 
                          code={getLanguageFlagCode(targetLanguage)} 
                          size={16} 
                        />
                        <span>{getLanguageLabel(targetLanguage)}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={targetLanguage}>
                      <div className="flex items-center gap-2">
                        <FlagIcon 
                          code={getLanguageFlagCode(targetLanguage)} 
                          size={16} 
                        />
                        <span>{getLanguageLabel(targetLanguage)}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Language is set from your account settings
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Support Language (translation language):
              </label>
              <LanguageSelectWithFlag
                value={supportLanguage}
                onValueChange={setSupportLanguage}
                options={SUPPORTED_LANGUAGES}
                placeholder="Select support language"
              />
            </div>
          </div>

          <Button
            onClick={handleCreateExercise}
            disabled={isCreating || !originalSentence.trim()}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create Exercise'}
          </Button>
        </CardContent>
      </Card>

      {/* Exercises Tabs */}
      <Tabs defaultValue="learning" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Learning ({learningExercises.length})
          </TabsTrigger>
          <TabsTrigger value="reviewing" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Reviewing ({reviewingExercises.length})
          </TabsTrigger>
          <TabsTrigger value="mastered" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Mastered ({masteredExercises.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learning">
          {isLoading ? (
            <div className="text-center py-8">Loading exercises...</div>
          ) : learningExercises.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {learningExercises.map(exercise => (
                <BidirectionalExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onPractice={handlePractice}
                  onReview={() => handleReview(exercise)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No learning exercises yet for {getLanguageLabel(targetLanguage)}. Create your first exercise above!
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewing">
          {isLoading ? (
            <div className="text-center py-8">Loading exercises...</div>
          ) : reviewingExercises.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviewingExercises.map(exercise => (
                <BidirectionalExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onPractice={handlePractice}
                  onReview={() => handleReview(exercise)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No exercises in review phase yet for {getLanguageLabel(targetLanguage)}. Complete some learning exercises first!
            </div>
          )}
        </TabsContent>

        <TabsContent value="mastered">
          {isLoading ? (
            <div className="text-center py-8">Loading exercises...</div>
          ) : masteredExercises.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {masteredExercises.map(exercise => (
                <BidirectionalExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onPractice={handlePractice}
                  onReview={() => handleReview(exercise)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No mastered exercises yet for {getLanguageLabel(targetLanguage)}. Keep practicing!
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BidirectionalPracticeModal
        exercise={practiceExercise}
        isOpen={!!practiceExercise}
        onClose={() => setPracticeExercise(null)}
        onExerciseUpdated={loadExercises}
      />

      <BidirectionalReviewModal
        exercise={reviewExercise}
        reviewType={reviewType}
        isOpen={!!reviewExercise}
        onClose={() => setReviewExercise(null)}
        onReviewComplete={loadExercises}
      />
    </div>
  );
};

export default BidirectionalPage;
