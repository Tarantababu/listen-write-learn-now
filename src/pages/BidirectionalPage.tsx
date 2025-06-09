
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Brain, BookOpen, Trophy } from 'lucide-react';
import { BidirectionalExerciseCard } from '@/components/bidirectional/BidirectionalExerciseCard';
import { BidirectionalPracticeModal } from '@/components/bidirectional/BidirectionalPracticeModal';
import { BidirectionalReviewModal } from '@/components/bidirectional/BidirectionalReviewModal';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { useToast } from '@/hooks/use-toast';

const SUPPORTED_LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'italian', label: 'Italian' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'russian', label: 'Russian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' }
];

const BidirectionalPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State for exercise creation
  const [originalSentence, setOriginalSentence] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('spanish');
  const [supportLanguage, setSupportLanguage] = useState('english');
  const [isCreating, setIsCreating] = useState(false);

  // State for exercises
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
    if (user) {
      loadExercises();
    }
  }, [user]);

  const loadExercises = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const [learning, reviewing, mastered, due] = await Promise.all([
        BidirectionalService.getUserExercises(user.id, 'learning'),
        BidirectionalService.getUserExercises(user.id, 'reviewing'),
        BidirectionalService.getUserExercises(user.id, 'mastered'),
        BidirectionalService.getExercisesDueForReview(user.id)
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Please log in to access the Bidirectional Method.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bidirectional Method</h1>
        <p className="text-muted-foreground">
          Practice translation in both directions with spaced repetition
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
              Complete these reviews to maintain your learning progress
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
            Create New Exercise
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
              placeholder="Enter a sentence in your target language..."
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Language (sentence language):
              </label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Support Language (translation language):
              </label>
              <Select value={supportLanguage} onValueChange={setSupportLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              No learning exercises yet. Create your first exercise above!
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
              No exercises in review phase yet. Complete some learning exercises first!
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
              No mastered exercises yet. Keep practicing!
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
