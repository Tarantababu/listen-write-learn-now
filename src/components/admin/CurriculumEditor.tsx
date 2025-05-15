
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RoadmapEditor from './RoadmapEditor';

/**
 * CurriculumEditor component for managing curriculum paths and nodes in the admin dashboard
 */
export const CurriculumEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roadmaps');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Curriculum Management</CardTitle>
          <CardDescription>
            Create and manage language learning curriculum paths and their content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="roadmaps" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="roadmaps">Roadmaps</TabsTrigger>
            </TabsList>
            
            <TabsContent value="roadmaps">
              <RoadmapEditor />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurriculumEditor;
