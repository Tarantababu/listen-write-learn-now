
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FlagIcon } from 'react-flag-kit';

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
        <div className="mt-4 flex justify-center gap-2">
          <FlagIcon code="US" size={24} />
          <FlagIcon code="DE" size={24} />
          <FlagIcon code="ES" size={24} />
        </div>
      </CardContent>
    </Card>
  );
};

export default RoadmapSelection;
