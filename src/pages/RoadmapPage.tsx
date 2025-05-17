
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Placeholder page for Roadmap functionality that has been deprecated
 */
const RoadmapPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <CardHeader>
        <CardTitle className="text-2xl">Language Learning Roadmap</CardTitle>
        <CardDescription>Track your language learning journey</CardDescription>
      </CardHeader>

      <div className="mt-6">
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feature not available</AlertTitle>
          <AlertDescription>
            The Roadmap feature has been deprecated from this application.
            Please use the Curriculum section instead for structured learning.
          </AlertDescription>
        </Alert>
      </div>
      
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Structured Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <p>For a guided learning experience, please check out our Curriculum section where you can find structured lessons.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Practice Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Continue to improve your skills with our practice exercises available in the Exercises section.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoadmapPage;
