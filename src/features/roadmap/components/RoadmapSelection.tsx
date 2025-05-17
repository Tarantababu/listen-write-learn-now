
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * Placeholder component for RoadmapSelection
 * This feature has been deprecated
 */
const RoadmapSelection: React.FC = () => {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Roadmap Selection</CardTitle>
        <CardDescription>This feature has been deprecated from the application.</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p>Roadmap functionality is no longer available.</p>
      </CardContent>
    </Card>
  );
};

export default RoadmapSelection;
