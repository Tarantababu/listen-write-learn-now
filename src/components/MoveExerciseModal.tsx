
import React, { useState, useEffect } from 'react';
import { useDirectoryContext } from '@/contexts/DirectoryContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { Exercise } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface MoveExerciseModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MoveExerciseModal: React.FC<MoveExerciseModalProps> = ({
  exercise,
  isOpen,
  onOpenChange,
  onSuccess
}) => {
  const { directories, getRootDirectories, getChildDirectories } = useDirectoryContext();
  const { moveExerciseToDirectory } = useExerciseContext();
  
  const [browsePath, setBrowsePath] = useState<string[]>([]);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBrowsePath([]);
      setSelectedDirectoryId(null);
    }
  }, [isOpen]);
  
  // Early return if no exercise
  if (!exercise) {
    return null;
  }
  
  // Get current directory based on browsePath
  let currentDirectories = getRootDirectories();
  let currentPath = "Root";
  let parentId: string | null = null;
  
  if (browsePath.length > 0) {
    const lastDirId = browsePath[browsePath.length - 1];
    currentDirectories = getChildDirectories(lastDirId);
    
    // Build path string
    const pathDirs = browsePath.map(id => directories.find(d => d.id === id)?.name || "Unknown");
    currentPath = `Root / ${pathDirs.join(" / ")}`;
    
    // Get parent ID for up navigation
    parentId = browsePath.length > 1 ? browsePath[browsePath.length - 2] : null;
  }
  
  const navigateToDirectory = (dirId: string) => {
    setBrowsePath([...browsePath, dirId]);
  };
  
  const navigateUp = () => {
    setBrowsePath(browsePath.slice(0, -1));
  };
  
  const handleSelectDirectory = (dirId: string | null) => {
    setSelectedDirectoryId(dirId);
  };
  
  const handleMove = async () => {
    if (isMoving || !exercise) return; // Prevent double submission
    
    try {
      setIsMoving(true);
      await moveExerciseToDirectory(exercise.id, selectedDirectoryId);
      
      toast.success(`Exercise moved to ${selectedDirectoryId ? directories.find(d => d.id === selectedDirectoryId)?.name : 'Root'}`);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the modal
      onOpenChange(false);
      setIsMoving(false);
      
    } catch (error) {
      console.error('Error moving exercise:', error);
      toast.error('Failed to move exercise');
      setIsMoving(false);
    }
  };
  
  const handleCancel = () => {
    if (!isMoving) {
      onOpenChange(false);
    }
  };
  
  const isCurrentDirectory = exercise.directoryId === selectedDirectoryId;
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only allow closing if we're not in the middle of moving
        if (!isMoving) {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Exercise</DialogTitle>
          <DialogDescription>
            Select a folder to move "{exercise.title}" to
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted/30 p-2 rounded-md mb-4 text-sm flex items-center">
            <span className="truncate">{currentPath}</span>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            {/* Root option */}
            <div
              className={`flex items-center p-2 cursor-pointer hover:bg-accent ${selectedDirectoryId === null ? 'bg-accent' : ''}`}
              onClick={() => handleSelectDirectory(null)}
            >
              <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Root</span>
              {selectedDirectoryId === null && (
                <span className="ml-auto text-xs text-muted-foreground">Selected</span>
              )}
            </div>
            
            {/* Back button */}
            {browsePath.length > 0 && (
              <div
                className="flex items-center p-2 cursor-pointer hover:bg-accent border-t"
                onClick={navigateUp}
              >
                <ArrowRight className="h-4 w-4 mr-2 transform rotate-180 text-muted-foreground" />
                <span>Back</span>
              </div>
            )}
            
            {/* Directory list */}
            {currentDirectories.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No folders found
              </div>
            ) : (
              currentDirectories.map(dir => (
                <div
                  key={dir.id}
                  className={`flex items-center p-2 border-t cursor-pointer hover:bg-accent
                    ${selectedDirectoryId === dir.id ? 'bg-accent' : ''}`}
                  onClick={() => handleSelectDirectory(dir.id)}
                  onDoubleClick={() => navigateToDirectory(dir.id)}
                >
                  <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{dir.name}</span>
                  {selectedDirectoryId === dir.id && (
                    <span className="ml-auto text-xs text-muted-foreground">Selected</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMove}
            disabled={isCurrentDirectory || isMoving}
          >
            {isMoving ? 'Moving...' : 'Move Here'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveExerciseModal;
