
import React, { useState } from 'react';
import { useDirectoryContext } from '@/contexts/DirectoryContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { Folder, FolderPlus, File, ChevronRight, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Directory } from '@/types';
import { cn } from '@/lib/utils';

interface DirectoryBrowserProps {
  onSelectExercise?: (exerciseId: string) => void;
  selectedExerciseId?: string;
  className?: string;
}

const DirectoryBrowser: React.FC<DirectoryBrowserProps> = ({ 
  onSelectExercise, 
  selectedExerciseId,
  className
}) => {
  const { 
    directories, 
    currentDirectoryId, 
    setCurrentDirectoryId,
    getRootDirectories,
    getChildDirectories,
    getDirectoryPath,
    addDirectory,
    updateDirectory,
    deleteDirectory,
    loading
  } = useDirectoryContext();
  
  const { exercises, moveExerciseToDirectory } = useExerciseContext();
  
  const [isAddDirModalOpen, setIsAddDirModalOpen] = useState(false);
  const [isRenameDirModalOpen, setIsRenameDirModalOpen] = useState(false);
  const [directoryName, setDirectoryName] = useState('');
  const [directoryToRename, setDirectoryToRename] = useState<Directory | null>(null);
  
  const handleNavigateToDirectory = (directoryId: string | null) => {
    setCurrentDirectoryId(directoryId);
  };
  
  const handleAddDirectory = async () => {
    if (!directoryName.trim()) return;
    
    try {
      await addDirectory(directoryName, currentDirectoryId);
      setDirectoryName('');
      setIsAddDirModalOpen(false);
    } catch (error) {
      console.error('Error adding directory:', error);
    }
  };
  
  const handleRenameDirectory = async () => {
    if (!directoryToRename || !directoryName.trim()) return;
    
    try {
      await updateDirectory(directoryToRename.id, directoryName);
      setDirectoryName('');
      setDirectoryToRename(null);
      setIsRenameDirModalOpen(false);
    } catch (error) {
      console.error('Error renaming directory:', error);
    }
  };
  
  const handleDeleteDirectory = async (directoryId: string) => {
    try {
      // Move all exercises from this directory to its parent
      const dir = directories.find(d => d.id === directoryId);
      if (dir) {
        const exercisesInDir = exercises.filter(ex => ex.directoryId === directoryId);
        for (const ex of exercisesInDir) {
          await moveExerciseToDirectory(ex.id, dir.parentId || null);
        }
      }
      
      await deleteDirectory(directoryId);
      
      // If we deleted the current directory, navigate to its parent
      if (currentDirectoryId === directoryId) {
        const parentId = dir?.parentId || null;
        setCurrentDirectoryId(parentId);
      }
    } catch (error) {
      console.error('Error deleting directory:', error);
    }
  };
  
  const openRenameDialog = (directory: Directory) => {
    setDirectoryToRename(directory);
    setDirectoryName(directory.name);
    setIsRenameDirModalOpen(true);
  };
  
  // Get current path and build breadcrumbs
  const directoryPath = currentDirectoryId 
    ? getDirectoryPath(currentDirectoryId) 
    : [];
  
  // Get current directories and exercises
  const currentDirectories = currentDirectoryId 
    ? getChildDirectories(currentDirectoryId)
    : getRootDirectories();
  
  const currentExercises = exercises.filter(ex => ex.directoryId === currentDirectoryId);
  
  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleNavigateToDirectory(null)}
            className="h-auto p-1"
          >
            Root
          </Button>
          
          {directoryPath.map((dir, index) => (
            <React.Fragment key={dir.id}>
              <ChevronRight className="h-4 w-4 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigateToDirectory(dir.id)}
                className="h-auto p-1"
              >
                {dir.name}
              </Button>
            </React.Fragment>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddDirModalOpen(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" /> New Folder
          </Button>
        </div>
        
        {/* Directory and Exercise List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading folders...
            </div>
          ) : (
            <>
              {currentDirectories.length === 0 && currentExercises.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  This folder is empty
                </div>
              )}
              
              {/* Directories */}
              {currentDirectories.map(directory => (
                <div 
                  key={directory.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent group"
                >
                  <div 
                    className="flex items-center flex-1 cursor-pointer"
                    onClick={() => handleNavigateToDirectory(directory.id)}
                  >
                    <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{directory.name}</span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openRenameDialog(directory)}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteDirectory(directory.id)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              
              {/* Exercises */}
              {currentExercises.map(exercise => (
                <div 
                  key={exercise.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md hover:bg-accent group",
                    selectedExerciseId === exercise.id && "bg-accent"
                  )}
                  onClick={() => onSelectExercise && onSelectExercise(exercise.id)}
                >
                  <div className="flex items-center flex-1 cursor-pointer">
                    <File className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{exercise.title}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* Add Directory Modal */}
      <Dialog open={isAddDirModalOpen} onOpenChange={setIsAddDirModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={directoryName}
              onChange={(e) => setDirectoryName(e.target.value)}
              placeholder="Folder name"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDirModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDirectory}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Rename Directory Modal */}
      <Dialog open={isRenameDirModalOpen} onOpenChange={setIsRenameDirModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for this folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={directoryName}
              onChange={(e) => setDirectoryName(e.target.value)}
              placeholder="Folder name"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRenameDirModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameDirectory}>
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DirectoryBrowser;
