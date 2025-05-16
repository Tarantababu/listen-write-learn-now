
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ExerciseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        if (!id) return;
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        setExercise(data);
      } catch (error) {
        console.error('Error fetching exercise:', error);
        setError('Failed to load exercise details');
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [id]);

  const handleBack = () => {
    navigate('/dashboard/exercises');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Exercises
        </Button>
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-red-500">{error}</p>
              <Button onClick={handleBack} className="mt-4">
                Return to Exercises
              </Button>
            </CardContent>
          </Card>
        ) : exercise ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{exercise.title}</h1>
              <div className="flex flex-wrap gap-2">
                {exercise.tags?.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <p className="whitespace-pre-wrap">{exercise.text}</p>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p>Exercise not found</p>
              <Button onClick={handleBack} className="mt-4">
                Return to Exercises
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExerciseDetailPage;
