
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lightbulb, Book } from 'lucide-react';

interface CurriculumSidebarProps {
  totalLessons: number;
  completedLessons: number;
  language: string;
}

const CurriculumSidebar: React.FC<CurriculumSidebarProps> = ({
  totalLessons,
  completedLessons,
  language
}) => {
  const completion = Math.round((completedLessons / totalLessons) * 100);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lessons completed</span>
              <span className="font-medium">{completedLessons}/{totalLessons}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Course completion</span>
              <span className="font-medium">{completion}%</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="outline">
            Find your level
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="h-4 w-4 mr-2" />
            Learning Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete each lesson with at least 95% accuracy three times to master it fully.
            Review completed lessons regularly to maintain your skills.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Book className="h-4 w-4 mr-2" />
            More Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Explore more {language} learning materials with our extensive course catalog.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="default">
            <span>Explore more courses</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CurriculumSidebar;
