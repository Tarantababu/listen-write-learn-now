
"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { FlagIcon } from "react-flag-kit";
import type { BidirectionalExercise } from "@/types/bidirectional";
import { getLanguageFlagCode } from "@/utils/languageUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BidirectionalService } from "@/services/bidirectionalService";

type ReviewCard = {
  id: string;
  exercise: BidirectionalExercise;
  review_type: 'forward' | 'backward';
  nextReviewDate?: Date;
  isDue: boolean;
};

interface BidirectionalReviewStackProps {
  dueReviews: { exercise: BidirectionalExercise; review_type: 'forward' | 'backward' }[];
  onReview: (exercise: BidirectionalExercise, reviewType: 'forward' | 'backward') => void;
  onAllComplete: () => void;
  refreshKey?: number; // Add refreshKey to trigger re-initialization
}

export const BidirectionalReviewStack: React.FC<BidirectionalReviewStackProps> = ({
  dueReviews,
  onReview,
  onAllComplete,
  refreshKey = 0
}) => {
  const isMobile = useIsMobile();
  
  // Memoize constants to prevent recalculation
  const { CARD_OFFSET, SCALE_FACTOR } = useMemo(() => ({
    CARD_OFFSET: isMobile ? 6 : 10,
    SCALE_FACTOR: isMobile ? 0.02 : 0.04
  }), [isMobile]);

  const [cards, setCards] = useState<ReviewCard[]>([]);

  // Initialize cards with due status checking
  useEffect(() => {
    const initializeCards = async () => {
      console.log('Initializing cards with due reviews:', dueReviews.length);
      const initialCards: ReviewCard[] = [];
      
      for (const review of dueReviews) {
        const nextReviewDate = await BidirectionalService.getNextReviewDate(
          review.exercise.id, 
          review.review_type
        );
        
        const isDue = nextReviewDate ? nextReviewDate <= new Date() : true;
        
        initialCards.push({
          id: `${review.exercise.id}-${review.review_type}`,
          exercise: review.exercise,
          review_type: review.review_type,
          nextReviewDate: nextReviewDate || undefined,
          isDue
        });
      }
      
      // Sort by due status (due first) and then by next review date
      initialCards.sort((a, b) => {
        if (a.isDue && !b.isDue) return -1;
        if (!a.isDue && b.isDue) return 1;
        if (a.nextReviewDate && b.nextReviewDate) {
          return a.nextReviewDate.getTime() - b.nextReviewDate.getTime();
        }
        return 0;
      });
      
      console.log('Initialized cards:', initialCards.length);
      setCards(initialCards);
    };

    initializeCards();
  }, [dueReviews, refreshKey]); // Add refreshKey as dependency

  const handleReviewNow = useCallback((card: ReviewCard) => {
    console.log('Starting review for card:', card.id);
    onReview(card.exercise, card.review_type);
    
    // Remove the current card after review
    setCards(prev => {
      const newCards = prev.filter(c => c.id !== card.id);
      console.log('Cards remaining after review:', newCards.length);
      if (newCards.length === 0) {
        console.log('All reviews complete, calling onAllComplete');
        setTimeout(onAllComplete, 500); // Small delay for smooth transition
      }
      return newCards;
    });
  }, [onReview, onAllComplete]);

  // Memoize the empty state to prevent re-renders
  const emptyState = useMemo(() => (
    <div className="text-center py-6 sm:py-8">
      <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
        <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-green-800 dark:text-green-200 mb-2">
        All reviews complete!
      </h3>
      <p className="text-sm text-green-700 dark:text-green-300 mb-4">
        You're all caught up! The spaced repetition system will remind you when it's time to review.
      </p>
      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-1">Spaced Repetition Schedule:</p>
        <p>Again (30s) → 1 day → 3 days → 7 days → mastered</p>
      </div>
    </div>
  ), []);

  if (cards.length === 0) {
    return emptyState;
  }

  const formatTimeRemaining = (nextReviewDate: Date): string => {
    return BidirectionalService.formatTimeRemaining(nextReviewDate);
  };

  return (
    <div className="flex justify-center py-4 sm:py-8">
      <div className={`relative ${
        isMobile 
          ? 'h-56 w-72' 
          : 'h-64 w-80 md:h-72 md:w-96'
      }`}>
        {cards.map((card, index) => {
          const isTop = index === 0;
          const timeRemaining = card.nextReviewDate ? formatTimeRemaining(card.nextReviewDate) : 'Due now';
          
          return (
            <motion.div
              key={card.id}
              className={`absolute border rounded-2xl shadow-lg flex flex-col justify-between overflow-hidden ${
                isMobile 
                  ? 'h-56 w-72 p-4' 
                  : 'h-64 w-80 md:h-72 md:w-96 p-6'
              } ${
                card.isDue 
                  ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' 
                  : 'bg-card border-border'
              }`}
              style={{
                transformOrigin: "top center",
              }}
              animate={{
                top: index * -CARD_OFFSET,
                scale: 1 - index * SCALE_FACTOR,
                zIndex: cards.length - index,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut"
              }}
            >
              <div className="space-y-3 sm:space-y-4 flex-1 min-h-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {card.isDue ? (
                      <AlertTriangle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-red-500`} />
                    ) : (
                      <Brain className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
                    )}
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${
                      card.isDue ? 'text-red-700 dark:text-red-300' : ''
                    }`}>
                      {card.review_type === 'forward' ? 'Forward' : 'Backward'} Review
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FlagIcon 
                      code={getLanguageFlagCode(card.exercise.target_language)} 
                      size={isMobile ? 14 : 16} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3 flex-1 min-h-0">
                  <div className="overflow-hidden">
                    <p className={`font-medium leading-relaxed break-words line-clamp-3 ${
                      isMobile ? 'text-base' : 'text-lg'
                    }`}>
                      {card.exercise.original_sentence}
                    </p>
                  </div>
                  
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {card.review_type === 'forward' 
                      ? `Translate to ${card.exercise.support_language}`
                      : `Translate back to ${card.exercise.target_language}`
                    }
                  </div>

                  {/* Review timing info */}
                  <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'} ${
                    card.isDue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                  }`}>
                    <Clock className="h-3 w-3" />
                    <span>{timeRemaining}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 flex-shrink-0">
                {cards.length > 1 && (
                  <div className="text-xs text-muted-foreground text-center">
                    {cards.length - index} review{cards.length - index !== 1 ? 's' : ''} remaining
                  </div>
                )}
                
                <Button
                  onClick={() => handleReviewNow(card)}
                  className={`w-full ${
                    card.isDue 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : ''
                  }`}
                  size={isMobile ? "default" : "lg"}
                  disabled={!isTop}
                >
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {card.isDue ? 'Review Now!' : 'Review'}
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
