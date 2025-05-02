
import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) return null;
  
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

export default PaginationControls;
