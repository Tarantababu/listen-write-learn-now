
import React from 'react';
import { useCurriculum } from '@/hooks/use-curriculum';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, AlertCircle, Clock, ArrowRightCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import LevelBadge from '@/components/LevelBadge';
import { LanguageLevel } from '@/types';

export const CurriculumProgressDashboard: React.FC = () => {
  const { 
    userCurriculumPaths, 
    selectCurriculumPath,
    isLoading
  } = useCurriculum();
  const { toast } = useToast();

  const handleSelectCurriculum = async (id: string) => {
    try {
      await selectCurriculumPath(id);
    } catch (error) {
      console.error('Error selecting curriculum:', error);
      toast({
        title: 'Error',
        description: 'Failed to select curriculum',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-8">
          <p className="text-muted-foreground">Loading your curricula...</p>
        </CardContent>
      </Card>
    );
  }

  if (userCurriculumPaths.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-8">
          <p className="text-muted-foreground">You haven't enrolled in any curricula yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Your Learning Progress</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userCurriculumPaths.map((path) => {
          const curriculum = path.curriculum;
          if (!curriculum) return null;
          
          const lastActivity = path.last_activity_date 
            ? formatDistanceToNow(new Date(path.last_activity_date), { addSuffix: true })
            : 'Never';

          return (
            <Card key={path.id} className="overflow-hidden">
              <div 
                className="h-1.5 bg-gray-200 w-full"
                style={{
                  background: `linear-gradient(to right, 
                    var(--primary) ${path.completion_percentage}%, 
                    var(--muted) ${path.completion_percentage}%)`
                }}
              ></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {curriculum.name}
                  </CardTitle>
                  <div className="flex space-x-1 items-center">
                    <LevelBadge level={curriculum.level as LanguageLevel} />
                    <span className="capitalize text-xs text-muted-foreground">
                      {curriculum.language}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      {path.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : path.status === 'abandoned' ? (
                        <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-500 mr-2" />
                      )}
                      <span className="capitalize">
                        {path.status === 'completed' 
                          ? 'Completed' 
                          : path.status === 'abandoned'
                          ? 'Abandoned'
                          : `In progress (${path.completion_percentage}%)`}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      Last activity: {lastActivity}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleSelectCurriculum(path.id)}
                    variant={path.status === 'completed' ? 'outline' : 'default'}
                    className="w-full"
                  >
                    {path.status === 'completed' ? 'Review' : 'Continue Learning'}
                    <ArrowRightCircle className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CurriculumProgressDashboard;
