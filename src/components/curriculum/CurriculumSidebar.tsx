
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

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
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="h-4 w-4 mr-2" />
            Dictation Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2.5 text-muted-foreground">
          <p><span className="inline-block mr-1.5">🎧</span> Play the audio and listen to just 2–5 words.</p>
          
          <p><span className="inline-block mr-1.5">⏸️</span> Pause immediately! Write after listening — never while the audio is playing.</p>
          
          <p><span className="inline-block mr-1.5">📝</span> No need to transcribe the full text.</p>
          
          <p>If it feels like too much, just start with 3 sentences!</p>
          
          <p><span className="inline-block mr-1.5">⏪</span> Don't rewind. Missed a word? Just leave a blank.</p>
          
          <p><span className="inline-block mr-1.5">✅</span> When finished, listen again to:</p>
          <ul className="list-disc pl-6 mt-1 space-y-0.5">
            <li>Fill in gaps</li>
            <li>Fix obvious mistakes</li>
          </ul>
          
          <p><span className="inline-block mr-1.5">🔍</span> Click COMPARE and check your errors.</p>
          
          <p>Less than 15 mistakes? Awesome! Try writing a bit more next time!</p>
          
          <p><span className="inline-block mr-1.5">🔁</span> Listen one more time and read along your own writing.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurriculumSidebar;
