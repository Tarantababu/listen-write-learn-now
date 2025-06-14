import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Brain, BookOpen, Trophy, CheckCircle2 } from 'lucide-react';
import { FlagIcon } from 'react-flag-kit';
import { BidirectionalExerciseCard } from '@/components/bidirectional/BidirectionalExerciseCard';
import { BidirectionalPracticeModal } from '@/components/bidirectional/BidirectionalPracticeModal';
import { BidirectionalReviewModal } from '@/components/bidirectional/BidirectionalReviewModal';
import { BidirectionalCreateDialog } from '@/components/bidirectional/BidirectionalCreateDialog';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { useToast } from '@/hooks/use-toast';
import { getLanguageFlagCode } from '@/utils/languageUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { BidirectionalReviewStack } from '@/components/bidirectional/BidirectionalReviewStack';
import { SUPPORTED_LANGUAGES, getLanguageLabel } from '@/constants/languages';

const BidirectionalPage: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    settings
  } = useUserSettingsContext();
  const {
    subscription
  } = useSubscription();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();

  // Target language now comes from user settings and cannot be changed
  const targetLanguage = settings.selectedLanguage;

  // State for exercise limits
  const [exerciseLimit, setExerciseLimit] = useState({
    canCreate: true,
    currentCount: 0,
    limit: 3
  });

  // State for exercises - now filtered by target language
  const [learningExercises, setLearningExercises] = useState<BidirectionalExercise[]>([]);
  const [reviewingExercises, setReviewingExercises] = useState<BidirectionalExercise[]>([]);
  const [masteredExercises, setMasteredExercises] = useState<BidirectionalExercise[]>([]);
  const [dueReviews, setDueReviews] = useState<{
    exercise: BidirectionalExercise;
    review_type: 'forward' | 'backward';
  }[]>([]);

  // State for modals
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [practiceExercise, setPracticeExercise] = useState<BidirectionalExercise | null>(null);
  const [reviewExercise, setReviewExercise] = useState<BidirectionalExercise | null>(null);
  const [reviewType, setReviewType] = useState<'forward' | 'backward'>('forward');
  const [isLoading, setIsLoading] = useState(true);

  // Add refresh key for review stack re-initialization
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user && targetLanguage) {
      loadExercises();
      checkExerciseLimit();
    }
  }, [user, targetLanguage, subscription.isSubscribed]);

  const checkExerciseLimit = async () => {
    if (!user || !targetLanguage) return;
    try {
      const limitInfo = await BidirectionalService.canCreateExercise(user.id, targetLanguage, subscription.isSubscribed);
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

  const handleExerciseCreated = async () => {
    // Refresh exercises and check limit again
    await Promise.all([loadExercises(), checkExerciseLimit()]);
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
    // Increment refresh key to trigger review stack re-initialization
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Reviews Complete!",
      description: "All due reviews have been completed. Check back later for more reviews based on your spaced repetition schedule."
    });
  };

  // Enhanced review complete handler to update refresh key
  const handleReviewComplete = () => {
    loadExercises();
    setRefreshKey(prev => prev + 1);
  };

  // Get the display label for the current target language
  const getLanguageLabelLocal = (languageValue: string) => {
    return getLanguageLabel(languageValue);
  };

  if (!user) {
    return <div className="container mx-auto px-4 py-8 text-center">
        <p>Please log in to access the Bidirectional Method.</p>
      </div>;
  }
  if (!targetLanguage) {
    return <div className="container mx-auto px-4 py-8 text-center">
        <Card>
          <CardHeader>
            <CardTitle>No Target Language Selected</CardTitle>
            <CardDescription>
              Please select a target language in your account settings to use the Bidirectional Method.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bidirectional Method</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Practice translation in both directions with spaced repetition for{' '}
          <span className="inline-flex items-center gap-1 font-medium">
            <FlagIcon code={getLanguageFlagCode(targetLanguage)} size={16} />
            {getLanguageLabelLocal(targetLanguage)}
          </span>
        </p>
      </div>

      {/* Enhanced Due Reviews Section with Card Stack */}
      <Card className={`mb-6 sm:mb-8 ${dueReviews.length > 0 ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800' : 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 text-lg ${dueReviews.length > 0 ? 'text-yellow-800 dark:text-yellow-200' : 'text-green-800 dark:text-green-200'}`}>
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
        </CardHeader>
        <CardContent>
          {dueReviews.length > 0 ? (
            <BidirectionalReviewStack 
              dueReviews={dueReviews} 
              onReview={handleReviewFromStack} 
              onAllComplete={handleAllReviewsComplete}
              refreshKey={refreshKey}
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
                <p>Again (30s) → 1 day → 3 days → 7 days → mastered</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Exercise Section - Now uses enhanced dialog */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            Create New Exercise for {getLanguageLabelLocal(targetLanguage)}
            {!subscription.isSubscribed && <span className="text-sm text-muted-foreground">
                ({exerciseLimit.currentCount}/{exerciseLimit.limit})
              </span>}
          </CardTitle>
          <CardDescription className="text-sm">
            Add a sentence to practice with the bidirectional method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full" 
            size={isMobile ? "default" : "lg"}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Exercise
          </Button>
        </CardContent>
      </Card>

      {/* Exercises Tabs */}
      <Tabs defaultValue="learning" className="space-y-4 sm:space-y-6">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1 h-auto p-1' : 'grid-cols-3'}`}>
          <TabsTrigger value="learning" className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start px-4 py-3 mb-1' : ''}`}>
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-sm">Learning ({learningExercises.length})</span>
          </TabsTrigger>
          <TabsTrigger value="reviewing" className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start px-4 py-3 mb-1' : ''}`}>
            <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-sm">Reviewing ({reviewingExercises.length})</span>
          </TabsTrigger>
          <TabsTrigger value="mastered" className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start px-4 py-3' : ''}`}>
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-sm">Mastered ({masteredExercises.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learning">
          {isLoading ? <div className="text-center py-8">Loading exercises...</div> : learningExercises.length > 0 ? <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {learningExercises.map(exercise => <BidirectionalExerciseCard key={exercise.id} exercise={exercise} onPractice={handlePractice} onReview={() => handleReview(exercise)} onDelete={handleDelete} />)}
            </div> : <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
              No learning exercises yet for {getLanguageLabelLocal(targetLanguage)}. Create your first exercise above!
            </div>}
        </TabsContent>

        <TabsContent value="reviewing">
          {isLoading ? <div className="text-center py-8">Loading exercises...</div> : reviewingExercises.length > 0 ? <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {reviewingExercises.map(exercise => <BidirectionalExerciseCard key={exercise.id} exercise={exercise} onPractice={handlePractice} onReview={() => handleReview(exercise)} onDelete={handleDelete} />)}
            </div> : <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
              No exercises in review phase yet for {getLanguageLabelLocal(targetLanguage)}. Complete some learning exercises first!
            </div>}
        </TabsContent>

        <TabsContent value="mastered">
          {isLoading ? <div className="text-center py-8">Loading exercises...</div> : masteredExercises.length > 0 ? <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {masteredExercises.map(exercise => <BidirectionalExerciseCard key={exercise.id} exercise={exercise} onPractice={handlePractice} onReview={() => handleReview(exercise)} />)}
            </div> : <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
              No mastered exercises yet for {getLanguageLabelLocal(targetLanguage)}. Keep practicing!
            </div>}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BidirectionalCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onExerciseCreated={handleExerciseCreated}
        exerciseLimit={exerciseLimit}
        targetLanguage={targetLanguage}
        supportedLanguages={SUPPORTED_LANGUAGES}
      />

      <BidirectionalPracticeModal exercise={practiceExercise} isOpen={!!practiceExercise} onClose={() => setPracticeExercise(null)} onExerciseUpdated={loadExercises} />

      <BidirectionalReviewModal exercise={reviewExercise} reviewType={reviewType} isOpen={!!reviewExercise} onClose={() => setReviewExercise(null)} onReviewComplete={handleReviewComplete} />
    </div>
  );
};

export default BidirectionalPage;
