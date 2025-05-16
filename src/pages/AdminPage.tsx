
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DefaultExerciseForm from '@/components/admin/DefaultExerciseForm';
import DefaultExercisesList from '@/components/admin/DefaultExercisesList';
import UserManagement from '@/components/admin/UserManagement';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('exercises');
  
  return (
    <div className="container py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      
      <Tabs defaultValue="exercises" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="exercises">Default Exercises</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="exercises" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4">Add New Exercise</h2>
              <DefaultExerciseForm onSuccess={() => setActiveTab('exercises')} />
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Existing Exercises</h2>
              <DefaultExercisesList />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
