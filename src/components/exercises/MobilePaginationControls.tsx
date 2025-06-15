import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobilePaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const MobilePaginationControls: React.FC<MobilePaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const isMobile = useIsMobile();

  if (totalPages <= 1) return null;

  if (isMobile) {
    return (
      <div className="flex justify-between items-center gap-4 mt-6 px-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="flex-1 h-12"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2 px-4">
          <span className="text-sm font-medium">
            {currentPage} of {totalPages}
          </span>
        </div>
        
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="flex-1 h-12"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }
  
  // Desktop version - keep existing functionality
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      
      <div className="flex gap-1">
        {Array.from({ length: totalPages }).map((_, i) => (
          <Button
            key={i}
            variant={currentPage === i + 1 ? "default" : "outline"}
            size="sm"
            className="min-w-[40px]"
            onClick={() => onPageChange(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
};
