import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, BookOpen, Volume2, Brain, Sparkles } from 'lucide-react';
import { ReadingExerciseModal } from './ReadingExerciseModal';
import { ReadingPracticeModal } from './ReadingPracticeModal';
import { ReadingExerciseCard } from './ReadingExerciseCard';
import { readingExerciseService } from '@/services/readingExerciseService';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { ReadingExercise } from '@/types/reading';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

export const ReadingExercisesSection: React.FC = () => {
  const { settings } = useUserSettingsContext();
  const isMobile = useIsMobile();
  const [exercises, setExercises] = useState<ReadingExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [practiceExercise, setPracticeExercise] = useState<ReadingExercise | null>(null);

  useEffect(() => {
    loadExercises();
  }, [settings.selectedLanguage]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const data = await readingExerciseService.getReadingExercises(settings.selectedLanguage);
      setExercises(data);
    } catch (error) {
      console.error('Error loading reading exercises:', error);
      toast.error('Failed to load reading exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (exercise: ReadingExercise) => {
    try {
      await readingExerciseService.deleteReadingExercise(exercise.id);
      setExercises(prev => prev.filter(e => e.id !== exercise.id));
      toast.success('Reading exercise deleted');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Failed to delete exercise');
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty_level === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className={`flex items-center justify-center gap-2 font-semibold ${isMobile ? 'text-lg' : 'text-lg'}`}>
          <BookOpen className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          Reading & Listening Exercises
        </div>
        <p className={`text-muted-foreground max-w-2xl mx-auto ${isMobile ? 'text-sm px-4' : ''}`}>
          Improve your comprehension with AI-generated reading passages featuring audio support, 
          word analysis, and grammar explanations tailored to your level.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className={`grid gap-4 mb-8 ${isMobile ? 'grid-cols-1 px-4' : 'md:grid-cols-3'}`}>
        <Card className={`text-center ${isMobile ? 'p-3' : 'p-4'}`}>
          <CardHeader className={`p-0 ${isMobile ? 'pb-2' : 'pb-3'}`}>
            <div className="flex justify-center">
              <Sparkles className={`text-blue-500 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            </div>
            <CardTitle className={isMobile ? 'text-sm' : 'text-base'}>AI-Generated Content</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CardDescription className={isMobile ? 'text-xs' : 'text-sm'}>
              Custom reading passages created for your interests and level
            </CardDescription>
          </CardContent>
        </Card>

        <Card className={`text-center ${isMobile ? 'p-3' : 'p-4'}`}>
          <CardHeader className={`p-0 ${isMobile ? 'pb-2' : 'pb-3'}`}>
            <div className="flex justify-center">
              <Volume2 className={`text-green-500 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            </div>
            <CardTitle className={isMobile ? 'text-sm' : 'text-base'}>Audio Support</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CardDescription className={isMobile ? 'text-xs' : 'text-sm'}>
              Listen to native pronunciation for every sentence
            </CardDescription>
          </CardContent>
        </Card>

        <Card className={`text-center ${isMobile ? 'p-3' : 'p-4'}`}>
          <CardHeader className={`p-0 ${isMobile ? 'pb-2' : 'pb-3'}`}>
            <div className="flex justify-center">
              <Brain className={`text-purple-500 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            </div>
            <CardTitle className={isMobile ? 'text-sm' : 'text-base'}>Deep Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CardDescription className={isMobile ? 'text-xs' : 'text-sm'}>
              Word definitions, grammar explanations, and translations
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className={`flex gap-4 ${isMobile ? 'flex-col px-4' : 'flex-col md:flex-row'}`}>
        <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-1'}`}>
          <div className={`relative ${isMobile ? 'w-full' : 'flex-1'}`}>
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <Input
              placeholder="Search exercises by title or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isMobile ? 'text-base py-3' : ''}`}
            />
          </div>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className={isMobile ? 'w-full text-base py-3' : 'w-48'}>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className={isMobile ? 'w-full py-3' : ''}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Exercise
        </Button>
      </div>

      {/* Exercises Grid */}
      {filteredExercises.length === 0 ? (
        <Card className={`text-center ${isMobile ? 'py-8 mx-4' : 'py-12'}`}>
          <CardContent>
            <BookOpen className={`mx-auto text-muted-foreground mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
            <h3 className={`font-semibold mb-2 ${isMobile ? 'text-base' : ''}`}>No Reading Exercises Yet</h3>
            <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
              {exercises.length === 0
                ? 'Create your first reading exercise to get started!'
                : 'No exercises match your current search filters.'}
            </p>
            {exercises.length === 0 && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className={isMobile ? 'w-full py-3' : ''}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Exercise
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1 px-4' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {filteredExercises.map((exercise) => (
            <ReadingExerciseCard
              key={exercise.id}
              exercise={exercise}
              onPractice={setPracticeExercise}
              onDelete={handleDeleteExercise}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ReadingExerciseModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={loadExercises}
      />

      <ReadingPracticeModal
        exercise={practiceExercise}
        isOpen={!!practiceExercise}
        onOpenChange={(open) => !open && setPracticeExercise(null)}
      />
    </div>
  );
};
