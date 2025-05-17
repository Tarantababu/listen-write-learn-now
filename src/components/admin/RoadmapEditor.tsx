
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Placeholder component for RoadmapEditor 
 * This feature has been deprecated from the application
 */
const RoadmapEditor: React.FC = () => {
  return (
    <Card className="p-6">
      <CardContent className="pt-6 text-center">
        <p>Roadmap functionality has been deprecated.</p>
      </CardContent>
    </Card>
  );
};

export default RoadmapEditor;
