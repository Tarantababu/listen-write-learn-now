
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, CheckCircle2 } from "lucide-react";
import { FlagIcon } from "react-flag-kit";
import type { BidirectionalExercise } from "@/types/bidirectional";
import { getLanguageFlagCode } from "@/utils/languageUtils";
import { useIsMobile } from "@/hooks/use-mobile";

type ReviewCard = {
  id: string;
  exercise: BidirectionalExercise;
  review_type: 'forward' | 'backward';
};

interface BidirectionalReviewStackProps {
  dueReviews: { exercise: BidirectionalExercise; review_type: 'forward' | 'backward' }[];
  onReview: (exercise: BidirectionalExercise, reviewType: 'forward' | 'backward') => void;
  onAllComplete: () => void;
}

export const BidirectionalReviewStack: React.FC<BidirectionalReviewStackProps> = ({
  dueReviews,
  onReview,
  onAllComplete
}) => {
  const isMobile = useIsMobile();
  const CARD_OFFSET = isMobile ? 6 : 10;
  const SCALE_FACTOR = isMobile ? 0.02 : 0.04;
  const [cards, setCards] = useState<ReviewCard[]>(
    dueReviews.map((review, index) => ({
      id: `${review.exercise.id}-${review.review_type}`,
      exercise: review.exercise,
      review_type: review.review_type
    }))
  );

  const handleReviewNow = (card: ReviewCard) => {
    onReview(card.exercise, card.review_type);
    
    // Remove the current card after review
    setCards(prev => {
      const newCards = prev.filter(c => c.id !== card.id);
      if (newCards.length === 0) {
        setTimeout(onAllComplete, 500); // Small delay for smooth transition
      }
      return newCards;
    });
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8">
        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
          <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-base sm:text-lg font-medium text-green-800 dark:text-green-200 mb-2">
          All reviews complete!
        </h3>
        <p className="text-sm text-green-700 dark:text-green-300">
          Redirecting to the main menu...
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-4 sm:py-8">
      <div className={`relative ${
        isMobile 
          ? 'h-56 w-72' 
          : 'h-64 w-80 md:h-72 md:w-96'
      }`}>
        {cards.map((card, index) => {
          const isTop = index === 0;
          
          return (
            <motion.div
              key={card.id}
              className={`absolute bg-card border rounded-2xl shadow-lg flex flex-col justify-between overflow-hidden ${
                isMobile 
                  ? 'h-56 w-72 p-4' 
                  : 'h-64 w-80 md:h-72 md:w-96 p-6'
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
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">
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
                  
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {card.review_type === 'forward' 
                      ? `Translate to ${card.exercise.support_language}`
                      : `Translate back to ${card.exercise.target_language}`
                    }
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
                  className="w-full"
                  size={isMobile ? "default" : "lg"}
                  disabled={!isTop}
                >
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Review Now
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
