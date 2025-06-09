import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, BookOpen, Brain, Trash2, Clock, AlertCircle } from 'lucide-react';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { useIsMobile } from '@/hooks/use-mobile';

interface BidirectionalExerciseCardProps {
  exercise: BidirectionalExercise;
  onPractice: (exercise: BidirectionalExercise) => void;
  onReview: (exercise: BidirectionalExercise) => void;
  onDelete?: (exerciseId: string) => void;
}

// Memoized component to prevent unnecessary re-renders
export const BidirectionalExerciseCard: React.FC<BidirectionalExerciseCardProps> = React.memo(({
  exercise,
  onPractice,
  onReview,
  onDelete
}) => {
  const isMobile = useIsMobile();
  const [reviewTimes, setReviewTimes] = useState<{
    forward?: string;
    backward?: string;
  }>({});
  const [isAnyDue, setIsAnyDue] = useState(false);

  // Memoize language mapping to prevent recreation on each render
  const languageMap = useMemo(() => ({
    'english': 'English',
    'spanish': 'Spanish',
    'french': 'French',
    'german': 'German',
    'italian': 'Italian',
    'portuguese': 'Portuguese',
    'russian': 'Russian',
    'chinese': 'Chinese',
    'japanese': 'Japanese',
    'korean': 'Korean'
  }), []);

  // Memoize status colors to prevent recreation
  const statusColors = useMemo(() => ({
    'learning': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'reviewing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'mastered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }), []);

  const loadReviewTimes = useCallback(async () => {
    try {
      const [forwardDate, backwardDate] = await Promise.all([
        BidirectionalService.getNextReviewDate(exercise.id, 'forward'),
        BidirectionalService.getNextReviewDate(exercise.id, 'backward')
      ]);

      const times: { forward?: string; backward?: string } = {};
      let anyDue = false;
      
      if (forwardDate) {
        const timeStr = BidirectionalService.formatTimeRemaining(forwardDate);
        times.forward = timeStr;
        if (timeStr === 'Due now') anyDue = true;
      }
      
      if (backwardDate) {
        const timeStr = BidirectionalService.formatTimeRemaining(backwardDate);
        times.backward = timeStr;
        if (timeStr === 'Due now') anyDue = true;
      }

      setReviewTimes(times);
      setIsAnyDue(anyDue);
    } catch (error) {
      console.error('Error loading review times:', error);
    }
  }, [exercise.id]);

  useEffect(() => {
    if (exercise.status === 'reviewing') {
      loadReviewTimes();
      // Update review times every 30 seconds to keep them current
      const interval = setInterval(loadReviewTimes, 30000);
      return () => clearInterval(interval);
    }
  }, [exercise.id, exercise.status, loadReviewTimes]);

  const getStatusColor = useCallback((status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.default;
  }, [statusColors]);

  const getLanguageLabel = useCallback((language: string) => {
    return languageMap[language as keyof typeof languageMap] || language;
  }, [languageMap]);

  // Memoize handlers to prevent recreation
  const handlePractice = useCallback(() => onPractice(exercise), [onPractice, exercise]);
  const handleReview = useCallback(() => onReview(exercise), [onReview, exercise]);
  const handleDelete = useCallback(() => onDelete?.(exercise.id), [onDelete, exercise.id]);
  const handlePlayAudio = useCallback(() => {
    if (exercise.original_audio_url) {
      const audio = new Audio(exercise.original_audio_url);
      audio.play();
    }
  }, [exercise.original_audio_url]);

  // Memoize the review times display to prevent unnecessary re-renders
  const reviewTimesDisplay = useMemo(() => {
    if (exercise.status !== 'reviewing' || (!reviewTimes.forward && !reviewTimes.backward)) {
      return null;
    }

    return (
      <div className={`p-2 bg-muted rounded-md ${isMobile ? 'mb-2' : 'mb-3'} ${
        isAnyDue ? 'border border-red-200 bg-red-50 dark:bg-red-950/20' : ''
      }`}>
        <p className={`text-muted-foreground mb-1 flex items-center gap-1 ${
          isMobile ? 'text-xs' : 'text-xs'
        }`}>
          {isAnyDue ? (
            <AlertCircle className="h-3 w-3 text-red-500" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          Next Reviews:
        </p>
        <div className="space-y-1">
          {reviewTimes.forward && (
            <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'}`}>
              <span>Forward:</span>
              <span className={reviewTimes.forward === 'Due now' ? 'text-red-600 font-medium' : ''}>
                {reviewTimes.forward}
              </span>
            </div>
          )}
          {reviewTimes.backward && (
            <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'}`}>
              <span>Backward:</span>
              <span className={reviewTimes.backward === 'Due now' ? 'text-red-600 font-medium' : ''}>
                {reviewTimes.backward}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }, [exercise.status, reviewTimes, isAnyDue, isMobile]);

  return (
    <Card className={`w-full ${isAnyDue ? 'border-red-200 shadow-red-100' : ''}`}>
      <CardHeader className={isMobile ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className={`mb-2 break-words ${
              isMobile ? 'text-base leading-snug' : 'text-lg'
            }`}>
              {exercise.original_sentence}
            </CardTitle>
            <CardDescription className={isMobile ? 'text-xs' : 'text-sm'}>
              {getLanguageLabel(exercise.target_language)} → {getLanguageLabel(exercise.support_language)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {isAnyDue && (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            <Badge className={`${getStatusColor(exercise.status)} ${
              isMobile ? 'text-xs flex-shrink-0' : ''
            }`}>
              {exercise.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {exercise.normal_translation && (
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`text-muted-foreground mb-1 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>Translation:</p>
            <p className={isMobile ? 'text-xs' : 'text-sm'}>{exercise.normal_translation}</p>
          </div>
        )}
        
        {exercise.user_forward_translation && (
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`text-muted-foreground mb-1 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>Your Translation:</p>
            <p className={isMobile ? 'text-xs' : 'text-sm'}>{exercise.user_forward_translation}</p>
          </div>
        )}

        {/* Review Times Display */}
        {reviewTimesDisplay}

        <div className={`flex flex-wrap gap-2 ${isMobile ? 'mt-3' : 'mt-4'}`}>
          {exercise.status === 'learning' && (
            <Button
              size="sm"
              onClick={handlePractice}
              className={`flex items-center gap-1 ${
                isMobile ? 'flex-1 min-w-0 justify-center' : ''
              }`}
            >
              <BookOpen className="h-3 w-3" />
              <span className={isMobile ? 'text-xs' : ''}>Practice</span>
            </Button>
          )}
          
          {exercise.status === 'reviewing' && (
            <Button
              size="sm"
              onClick={handleReview}
              variant={isAnyDue ? "default" : "outline"}
              className={`flex items-center gap-1 ${
                isMobile ? 'flex-1 min-w-0 justify-center' : ''
              } ${isAnyDue ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
            >
              <Brain className="h-3 w-3" />
              <span className={isMobile ? 'text-xs' : ''}>
                {isAnyDue ? 'Review Now!' : 'Review'}
              </span>
            </Button>
          )}

          {exercise.original_audio_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayAudio}
              className={`flex items-center gap-1 ${
                isMobile ? 'flex-1 min-w-0 justify-center' : ''
              }`}
            >
              <Play className="h-3 w-3" />
              <span className={isMobile ? 'text-xs' : ''}>Play</span>
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              className={`flex items-center gap-1 text-red-600 hover:text-red-700 ${
                isMobile ? 'flex-1 min-w-0 justify-center' : ''
              }`}
            >
              <Trash2 className="h-3 w-3" />
              <span className={isMobile ? 'text-xs' : ''}>Delete</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

BidirectionalExerciseCard.displayName = 'BidirectionalExerciseCard';
