
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurriculumProvider } from '@/contexts/CurriculumContext';
import CurriculumVisualization from '@/components/curriculum/CurriculumVisualization';
import CurriculumSelection from '@/components/curriculum/CurriculumSelection';
import CurriculumProgressDashboard from '@/components/curriculum/CurriculumProgressDashboard';
import { useCurriculum } from '@/hooks/use-curriculum';

const CurriculumPageContent: React.FC = () => {
  const { userCurriculumPaths, currentCurriculumPath } = useCurriculum();
  const [activeTab, setActiveTab] = useState('learning-path');

  // Set active tab based on whether user has curricula
  useEffect(() => {
    if (userCurriculumPaths.length === 0) {
      setActiveTab('enroll');
    }
  }, [userCurriculumPaths]);

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Curriculum</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="learning-path" disabled={userCurriculumPaths.length === 0}>
            Current Path
          </TabsTrigger>
          <TabsTrigger value="progress">
            My Progress
          </TabsTrigger>
          <TabsTrigger value="enroll">
            Enroll
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="learning-path">
          {currentCurriculumPath ? (
            <CurriculumVisualization />
          ) : (
            <div className="text-center py-8">
              <p>Please select a curriculum from the Progress tab or enroll in a new one.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="progress">
          <CurriculumProgressDashboard />
        </TabsContent>
        
        <TabsContent value="enroll">
          <CurriculumSelection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const CurriculumPage: React.FC = () => {
  return (
    <CurriculumProvider>
      <CurriculumPageContent />
    </CurriculumProvider>
  );
};

export default CurriculumPage;
