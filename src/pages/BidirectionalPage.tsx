import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Brain, BookOpen, Trophy, Lock, ArrowDown, CheckCircle2, Crown } from 'lucide-react';
import { FlagIcon } from 'react-flag-kit';
import { BidirectionalExerciseCard } from '@/components/bidirectional/BidirectionalExerciseCard';
import { BidirectionalPracticeModal } from '@/components/bidirectional/BidirectionalPracticeModal';
import { BidirectionalReviewModal } from '@/components/bidirectional/BidirectionalReviewModal';
import { LanguageSelectWithFlag } from '@/components/bidirectional/LanguageSelectWithFlag';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { useToast } from '@/hooks/use-toast';
import { getLanguageFlagCode } from '@/utils/languageUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { BidirectionalReviewStack } from '@/components/bidirectional/BidirectionalReviewStack';

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
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // State for exercise creation
  const [originalSentence, setOriginalSentence] = useState('');
  // Target language now comes from user settings and cannot be changed
  const targetLanguage = settings.selectedLanguage;
  const [supportLanguage, setSupportLanguage] = useState('english');
  const [isCreating, setIsCreating] = useState(false);

  // State for exercise limits
  const [exerciseLimit, setExerciseLimit] = useState({ canCreate: true, currentCount: 0, limit: 3 });

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
      checkExerciseLimit();
    }
  }, [user, targetLanguage, subscription.isSubscribed]);

  const checkExerciseLimit = async () => {
    if (!user || !targetLanguage) return;

    try {
      const limitInfo = await BidirectionalService.canCreateExercise(
        user.id, 
        targetLanguage, 
        subscription.isSubscribed
      );
      setExerciseLimit(limitInfo);
    } catch (error) {
      console.error('Error checking exercise limit:', error);
    }
  };

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

      console.log('Loaded exercises:', {
        learning: learning.length,
        reviewing: reviewing.length,
        mastered: mastered.length,
        due: due.length
      });
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

    // Check exercise limit before creating
    if (!exerciseLimit.canCreate && !subscription.isSubscribed) {
      toast({
        title: "Exercise Limit Reached",
        description: `You've reached the limit of ${exerciseLimit.limit} exercises for ${getLanguageLabel(targetLanguage)}. Upgrade to premium for unlimited exercises.`,
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
      
      // Refresh exercises and check limit again
      await Promise.all([loadExercises(), checkExerciseLimit()]);
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
      // Refresh exercises and check limit again
      await Promise.all([loadExercises(), checkExerciseLimit()]);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Error",
        description: "Failed to delete exercise. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReviewFromStack = (exercise: BidirectionalExercise, reviewType: 'forward' | 'backward') => {
    setReviewExercise(exercise);
    setReviewType(reviewType);
  };

  const handleAllReviewsComplete = () => {
    // Reload exercises to refresh the state and show updated spaced repetition status
    loadExercises();
    
    toast({
      title: "Reviews Complete!",
      description: "All due reviews have been completed. Check back later for more reviews based on your spaced repetition schedule."
    });
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bidirectional Method</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Practice translation in both directions with spaced repetition for{' '}
          <span className="inline-flex items-center gap-1 font-medium">
            <FlagIcon code={getLanguageFlagCode(targetLanguage)} size={16} />
            {getLanguageLabel(targetLanguage)}
          </span>
        </p>
      </div>

      {/* Enhanced Due Reviews Section with Card Stack */}
      <Card className={`mb-6 sm:mb-8 ${
        dueReviews.length > 0 
          ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800' 
          : 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 text-lg ${
            dueReviews.length > 0 
              ? 'text-yellow-800 dark:text-yellow-200' 
              : 'text-green-800 dark:text-green-200'
          }`}>
            {dueReviews.length > 0 ? (
              <>
                <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                Reviews Due ({dueReviews.length})
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                Reviews Status
              </>
            )}
          </CardTitle>
          <CardDescription className="text-sm">
            {dueReviews.length > 0 
              ? `Complete these spaced repetition reviews to maintain your learning progress for ${getLanguageLabel(targetLanguage)}`
              : `No reviews due right now for ${getLanguageLabel(targetLanguage)}. The spaced repetition system will schedule reviews at optimal intervals: 30s → 10m → 1h → 1d → 3d → 7d → mastered.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dueReviews.length > 0 ? (
            <BidirectionalReviewStack
              dueReviews={dueReviews}
              onReview={handleReviewFromStack}
              onAllComplete={handleAllReviewsComplete}
            />
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">
                Nothing to review right now
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                You're all caught up! The spaced repetition system will remind you when it's time to review.
              </p>
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                <p className="font-medium mb-1">Spaced Repetition Schedule:</p>
                <p>30 seconds → 10 minutes → 1 hour → 1 day → 3 days → 7 days → mastered</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Exercise Section */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            Create New Exercise for {getLanguageLabel(targetLanguage)}
            {!subscription.isSubscribed && (
              <span className="text-sm text-muted-foreground">
                ({exerciseLimit.currentCount}/{exerciseLimit.limit})
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-sm">
            Add a sentence to practice with the bidirectional method
            {!subscription.isSubscribed && !exerciseLimit.canCreate && (
              <span className="block mt-1 text-orange-600 dark:text-orange-400 font-medium">
                Exercise limit reached. Upgrade to premium for unlimited exercises.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!subscription.isSubscribed && !exerciseLimit.canCreate && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <h4 className="font-medium text-orange-800 dark:text-orange-200">
                  Exercise Limit Reached
                </h4>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                You've created {exerciseLimit.limit} exercises for {getLanguageLabel(targetLanguage)}. 
                Upgrade to premium to create unlimited exercises and unlock all features.
              </p>
              <Button variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Sentence to translate:
            </label>
            <Textarea
              value={originalSentence}
              onChange={(e) => setOriginalSentence(e.target.value)}
              placeholder={`Enter a sentence in ${getLanguageLabel(targetLanguage)}...`}
              rows={2}
              className="text-sm sm:text-base"
              disabled={!subscription.isSubscribed && !exerciseLimit.canCreate}
            />
          </div>
          
          <div className="space-y-4">
            {/* Target Language - Mobile: Full width, Desktop: Half width */}
            <div className={isMobile ? 'w-full' : 'grid grid-cols-2 gap-4'}>
              <div className={isMobile ? 'mb-4' : ''}>
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
                          <span className="text-sm">{getLanguageLabel(targetLanguage)}</span>
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
              
              {/* Mobile: Add visual separator */}
              {isMobile && (
                <div className="flex items-center justify-center my-3">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Support Language (translation language):
                </label>
                <LanguageSelectWithFlag
                  value={supportLanguage}
                  onValueChange={setSupportLanguage}
                  options={SUPPORTED_LANGUAGES}
                  placeholder="Select support language"
                  disabled={!subscription.isSubscribed && !exerciseLimit.canCreate}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateExercise}
            disabled={isCreating || !originalSentence.trim() || (!subscription.isSubscribed && !exerciseLimit.canCreate)}
            className="w-full"
            size={isMobile ? "default" : "lg"}
          >
            {isCreating ? 'Creating...' : 'Create Exercise'}
          </Button>
        </CardContent>
      </Card>

      {/* Exercises Tabs */}
      <Tabs defaultValue="learning" className="space-y-4 sm:space-y-6">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1 h-auto p-1' : 'grid-cols-3'}`}>
          <TabsTrigger 
            value="learning" 
            className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start px-4 py-3 mb-1' : ''}`}
          >
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-sm">Learning ({learningExercises.length})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reviewing" 
            className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start px-4 py-3 mb-1' : ''}`}
          >
            <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-sm">Reviewing ({reviewingExercises.length})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="mastered" 
            className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start px-4 py-3' : ''}`}
          >
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-sm">Mastered ({masteredExercises.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learning">
          {isLoading ? (
            <div className="text-center py-8">Loading exercises...</div>
          ) : learningExercises.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
            <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
              No learning exercises yet for {getLanguageLabel(targetLanguage)}. Create your first exercise above!
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewing">
          {isLoading ? (
            <div className="text-center py-8">Loading exercises...</div>
          ) : reviewingExercises.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
            <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
              No exercises in review phase yet for {getLanguageLabel(targetLanguage)}. Complete some learning exercises first!
            </div>
          )}
        </TabsContent>

        <TabsContent value="mastered">
          {isLoading ? (
            <div className="text-center py-8">Loading exercises...</div>
          ) : masteredExercises.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
            <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
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
