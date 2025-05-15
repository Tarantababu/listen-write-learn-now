
import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurriculumProvider } from '@/contexts/CurriculumContext';
import CurriculumVisualization from '@/components/curriculum/CurriculumVisualization';
import CurriculumSelection from '@/components/curriculum/CurriculumSelection';
import CurriculumProgressDashboard from '@/components/curriculum/CurriculumProgressDashboard';
import { useCurriculum } from '@/hooks/use-curriculum';

const CurriculumPageContent: React.FC = () => {
  const { 
    userCurriculumPaths,
    currentCurriculumPath,
    isLoading,
    refreshData
  } = useCurriculum();
  
  const [activeTab, setActiveTab] = useState('learning-path');
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Set active tab based on whether user has curricula - only once after initial data load
  useEffect(() => {
    if (!isLoading && !initialDataLoaded) {
      setInitialDataLoaded(true);
      if (userCurriculumPaths.length === 0) {
        setActiveTab('enroll');
      }
    }
  }, [userCurriculumPaths.length, isLoading, initialDataLoaded]);

  // Refresh data handler
  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Curriculum</h1>
        {isLoading ? (
          <span className="text-sm text-muted-foreground">Loading...</span>
        ) : (
          <button 
            onClick={handleRefresh}
            className="text-sm text-primary hover:text-primary/80"
          >
            Refresh
          </button>
        )}
      </div>
      
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
