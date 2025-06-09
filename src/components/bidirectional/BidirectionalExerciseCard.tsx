
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, BookOpen, Brain, Trash2, Clock } from 'lucide-react';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { useIsMobile } from '@/hooks/use-mobile';

interface BidirectionalExerciseCardProps {
  exercise: BidirectionalExercise;
  onPractice: (exercise: BidirectionalExercise) => void;
  onReview: (exercise: BidirectionalExercise) => void;
  onDelete?: (exerciseId: string) => void;
}

export const BidirectionalExerciseCard: React.FC<BidirectionalExerciseCardProps> = ({
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

  useEffect(() => {
    if (exercise.status === 'reviewing') {
      loadReviewTimes();
    }
  }, [exercise.id, exercise.status]);

  const loadReviewTimes = async () => {
    try {
      const [forwardDate, backwardDate] = await Promise.all([
        BidirectionalService.getNextReviewDate(exercise.id, 'forward'),
        BidirectionalService.getNextReviewDate(exercise.id, 'backward')
      ]);

      const times: { forward?: string; backward?: string } = {};
      
      if (forwardDate) {
        times.forward = BidirectionalService.formatTimeRemaining(forwardDate);
      }
      
      if (backwardDate) {
        times.backward = BidirectionalService.formatTimeRemaining(backwardDate);
      }

      setReviewTimes(times);
    } catch (error) {
      console.error('Error loading review times:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'learning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'mastered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getLanguageLabel = (language: string) => {
    const languageMap: { [key: string]: string } = {
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
    };
    return languageMap[language] || language;
  };

  return (
    <Card className="w-full">
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
          <Badge className={`${getStatusColor(exercise.status)} ${
            isMobile ? 'text-xs ml-2 flex-shrink-0' : 'ml-2'
          }`}>
            {exercise.status}
          </Badge>
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
        {exercise.status === 'reviewing' && (reviewTimes.forward || reviewTimes.backward) && (
          <div className={`p-2 bg-muted rounded-md ${isMobile ? 'mb-2' : 'mb-3'}`}>
            <p className={`text-muted-foreground mb-1 flex items-center gap-1 ${
              isMobile ? 'text-xs' : 'text-xs'
            }`}>
              <Clock className="h-3 w-3" />
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
        )}

        <div className={`flex flex-wrap gap-2 ${isMobile ? 'mt-3' : 'mt-4'}`}>
          {exercise.status === 'learning' && (
            <Button
              size="sm"
              onClick={() => onPractice(exercise)}
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
              onClick={() => onReview(exercise)}
              className={`flex items-center gap-1 ${
                isMobile ? 'flex-1 min-w-0 justify-center' : ''
              }`}
            >
              <Brain className="h-3 w-3" />
              <span className={isMobile ? 'text-xs' : ''}>Review</span>
            </Button>
          )}

          {exercise.original_audio_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const audio = new Audio(exercise.original_audio_url);
                audio.play();
              }}
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
              onClick={() => onDelete(exercise.id)}
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
};
