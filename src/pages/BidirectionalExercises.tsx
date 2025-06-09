
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Brain, BookOpen, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BidirectionalService } from '@/services/bidirectionalService';
import { BidirectionalCreateModal } from '@/components/bidirectional/BidirectionalCreateModal';
import { BidirectionalPracticeModal } from '@/components/bidirectional/BidirectionalPracticeModal';
import { BidirectionalReviewModal } from '@/components/bidirectional/BidirectionalReviewModal';
import { BidirectionalReviewStack } from '@/components/bidirectional/BidirectionalReviewStack';
import { BidirectionalExerciseCard } from '@/components/bidirectional/BidirectionalExerciseCard';
import { MobileBidirectionalReviewDrawer } from '@/components/bidirectional/MobileBidirectionalReviewDrawer';
import CreateExerciseCard from '@/components/exercises/CreateExerciseCard';
import EmptyStateMessage from '@/components/exercises/EmptyStateMessage';
import PaginationControls from '@/components/exercises/PaginationControls';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBidirectionalReviews } from '@/hooks/use-bidirectional-reviews';

const EXERCISES_PER_PAGE = 12;

const BidirectionalExercises: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { dueReviewsCount, refreshDueReviews } = useBidirectionalReviews();

  // State management
  const [exercises, setExercises] = useState<BidirectionalExercise[]>([]);
  const [dueReviews, setDueReviews] = useState<{ exercise: BidirectionalExercise; review_type: 'forward' | 'backward' }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for review stack

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<BidirectionalExercise | null>(null);
  const [reviewType, setReviewType] = useState<'forward' | 'backward'>('forward');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // User recall states for mobile drawer
  const [userRecall, setUserRecall] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [currentReviewRound, setCurrentReviewRound] = useState(1);

  // Load exercises
  const loadExercises = useCallback(async () => {
    if (!user || !settings.selectedLanguage) return;

    try {
      setLoading(true);
      const allExercises = await BidirectionalService.getUserExercises(
        user.id, 
        settings.selectedLanguage
      );
      setExercises(allExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast({
        title: "Error",
        description: "Failed to load exercises. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, settings.selectedLanguage, toast]);

  // Load due reviews
  const loadDueReviews = useCallback(async () => {
    if (!user || !settings.selectedLanguage) return;

    try {
      const reviews = await BidirectionalService.getExercisesDueForReview(
        user.id, 
        settings.selectedLanguage
      );
      console.log('Loaded due reviews:', reviews.length);
      setDueReviews(reviews);
    } catch (error) {
      console.error('Error loading due reviews:', error);
    }
  }, [user, settings.selectedLanguage]);

  // Initial load
  useEffect(() => {
    loadExercises();
    loadDueReviews();
  }, [loadExercises, loadDueReviews]);

  // Handle exercise creation
  const handleExerciseCreated = useCallback(() => {
    loadExercises();
    setIsCreateModalOpen(false);
    toast({
      title: "Success",
      description: "Exercise created successfully!"
    });
  }, [loadExercises, toast]);

  // Handle exercise updated (after practice)
  const handleExerciseUpdated = useCallback(() => {
    loadExercises();
    loadDueReviews();
    refreshDueReviews();
  }, [loadExercises, loadDueReviews, refreshDueReviews]);

  // Handle review completion with proper refresh
  const handleReviewComplete = useCallback(async () => {
    console.log('Review completed, refreshing data...');
    
    // Increment refresh key to force review stack re-initialization
    setRefreshKey(prev => prev + 1);
    
    // Reload data
    await Promise.all([
      loadExercises(),
      loadDueReviews()
    ]);
    
    // Refresh the due reviews count in the hook
    refreshDueReviews();
    
    console.log('Data refresh completed');
  }, [loadExercises, loadDueReviews, refreshDueReviews]);

  // Handle practice modal
  const handlePractice = useCallback((exercise: BidirectionalExercise) => {
    setSelectedExercise(exercise);
    setIsPracticeModalOpen(true);
  }, []);

  // Handle review modal
  const handleReview = useCallback(async (exercise: BidirectionalExercise, type: 'forward' | 'backward') => {
    setSelectedExercise(exercise);
    setReviewType(type);
    
    // Load current review round
    try {
      const { data: previousReviews } = await BidirectionalService.getPreviousReviews(exercise.id, type);
      setCurrentReviewRound((previousReviews?.length || 0) + 1);
    } catch (error) {
      console.error('Error loading review round:', error);
      setCurrentReviewRound(1);
    }
    
    // Reset states
    setUserRecall('');
    setShowAnswer(false);
    setIsReviewLoading(false);
    
    if (isMobile) {
      setIsReviewModalOpen(true);
    } else {
      setIsReviewModalOpen(true);
    }
  }, [isMobile]);

  // Handle delete
  const handleDelete = useCallback(async (exerciseId: string) => {
    try {
      await BidirectionalService.deleteExercise(exerciseId);
      loadExercises();
      toast({
        title: "Success",
        description: "Exercise deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Error",
        description: "Failed to delete exercise. Please try again.",
        variant: "destructive"
      });
    }
  }, [loadExercises, toast]);

  // Handle all reviews complete
  const handleAllReviewsComplete = useCallback(() => {
    console.log('All reviews completed, refreshing...');
    handleReviewComplete();
  }, [handleReviewComplete]);

  // Filter exercises by status
  const filteredExercises = exercises.filter(exercise => {
    if (statusFilter === 'all') return true;
    return exercise.status === statusFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredExercises.length / EXERCISES_PER_PAGE);
  const startIndex = (currentPage - 1) * EXERCISES_PER_PAGE;
  const paginatedExercises = filteredExercises.slice(startIndex, startIndex + EXERCISES_PER_PAGE);

  // Stats
  const stats = {
    total: exercises.length,
    learning: exercises.filter(e => e.status === 'learning').length,
    reviewing: exercises.filter(e => e.status === 'reviewing').length,
    mastered: exercises.filter(e => e.status === 'mastered').length
  };

  // Mobile review handlers
  const handleShowAnswer = () => setShowAnswer(true);
  
  const handleMarkResult = async (isCorrect: boolean) => {
    if (!selectedExercise || !userRecall.trim()) return;

    setIsReviewLoading(true);
    try {
      await BidirectionalService.recordReview({
        exercise_id: selectedExercise.id,
        review_type: reviewType,
        user_recall_attempt: userRecall,
        is_correct: isCorrect,
        feedback: isCorrect ? "Correct!" : "Needs more practice"
      });

      toast({
        title: "Review Complete",
        description: isCorrect ? "Great job!" : "Keep practicing!",
        variant: isCorrect ? "default" : "destructive"
      });

      setIsReviewModalOpen(false);
      
      // Trigger review completion refresh
      setTimeout(() => {
        handleReviewComplete();
      }, 100);
    } catch (error) {
      console.error('Error recording review:', error);
      toast({
        title: "Error",
        description: "Failed to record review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsReviewLoading(false);
    }
  };

  // Helper functions for mobile drawer
  const getPromptText = () => {
    if (!selectedExercise) return '';
    if (reviewType === 'forward') {
      return `Translate this ${selectedExercise.target_language} sentence to ${selectedExercise.support_language}:`;
    } else {
      return `Translate this ${selectedExercise.support_language} sentence back to ${selectedExercise.target_language}:`;
    }
  };

  const getSourceText = () => {
    if (!selectedExercise) return '';
    if (reviewType === 'forward') {
      return selectedExercise.original_sentence;
    } else {
      return selectedExercise.user_forward_translation || selectedExercise.normal_translation || '';
    }
  };

  const getExpectedAnswer = () => {
    if (!selectedExercise) return '';
    if (reviewType === 'forward') {
      return selectedExercise.user_forward_translation || selectedExercise.normal_translation || '';
    } else {
      return selectedExercise.original_sentence;
    }
  };

  const handlePlayAudio = () => {
    if (selectedExercise?.original_audio_url) {
      const audio = new Audio(selectedExercise.original_audio_url);
      audio.play().catch(console.error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bidirectional Exercises</h1>
          <p className="text-muted-foreground">
            Master translation through forward and backward practice
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Exercise
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Learning</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.learning}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reviewing</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.reviewing}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mastered</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.mastered}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="exercises" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            All Exercises
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Reviews
            {dueReviews.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {dueReviews.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          {dueReviews.length > 0 ? (
            <BidirectionalReviewStack
              dueReviews={dueReviews}
              onReview={handleReview}
              onAllComplete={handleAllReviewsComplete}
              refreshKey={refreshKey} // Pass refresh key to force re-initialization
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No reviews due</h3>
                <p className="text-muted-foreground">
                  All caught up! Check back later for more reviews.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises" className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={statusFilter === 'learning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('learning')}
            >
              Learning ({stats.learning})
            </Button>
            <Button
              variant={statusFilter === 'reviewing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('reviewing')}
            >
              Reviewing ({stats.reviewing})
            </Button>
            <Button
              variant={statusFilter === 'mastered' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('mastered')}
            >
              Mastered ({stats.mastered})
            </Button>
          </div>

          {/* Exercises Grid */}
          {filteredExercises.length === 0 ? (
            <EmptyStateMessage onCreateExercise={() => setIsCreateModalOpen(true)} />
          ) : (
            <>
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <CreateExerciseCard onClick={() => setIsCreateModalOpen(true)} />
                {paginatedExercises.map((exercise) => (
                  <BidirectionalExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onPractice={handlePractice}
                    onReview={(ex) => handleReview(ex, 'forward')}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BidirectionalCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onExerciseCreated={handleExerciseCreated}
      />

      <BidirectionalPracticeModal
        exercise={selectedExercise}
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        onExerciseUpdated={handleExerciseUpdated}
      />

      {!isMobile ? (
        <BidirectionalReviewModal
          exercise={selectedExercise}
          reviewType={reviewType}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onReviewComplete={handleReviewComplete}
        />
      ) : (
        <MobileBidirectionalReviewDrawer
          exercise={selectedExercise}
          reviewType={reviewType}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          userRecall={userRecall}
          setUserRecall={setUserRecall}
          showAnswer={showAnswer}
          onShowAnswer={handleShowAnswer}
          onMarkResult={handleMarkResult}
          isLoading={isReviewLoading}
          currentReviewRound={currentReviewRound}
          getPromptText={getPromptText}
          getSourceText={getSourceText}
          getExpectedAnswer={getExpectedAnswer}
          handlePlayAudio={handlePlayAudio}
        />
      )}
    </div>
  );
};

export default BidirectionalExercises;
