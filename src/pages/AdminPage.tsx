import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminStatsDashboard from '@/components/admin/AdminStatsDashboard';
import DefaultExercisesList from '@/components/admin/DefaultExercisesList';
import FeedbackList from '@/components/admin/FeedbackList';
import UserRoleManagement from '@/components/admin/UserRoleManagement';
import AdminMessagesList from '@/components/admin/AdminMessagesList';
import AdminMessagesForm from '@/components/admin/AdminMessagesForm';
import { OnboardingStepsAdmin } from '@/components/admin/OnboardingStepsAdmin';

const AdminPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      {/* Admin Tabs */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="mb-4 flex overflow-x-auto pb-1">
          <TabsTrigger value="stats">User Statistics</TabsTrigger>
          <TabsTrigger value="default-exercises">Default Exercises</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="user-roles">User Roles</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats">
          <AdminStatsDashboard />
        </TabsContent>
        
        <TabsContent value="default-exercises">
          <DefaultExercisesList />
        </TabsContent>
        
        <TabsContent value="feedback">
          <FeedbackList />
        </TabsContent>
        
        <TabsContent value="user-roles">
          <UserRoleManagement />
        </TabsContent>

        <TabsContent value="messages">
          <div className="grid gap-4">
            <AdminMessagesList />
            <AdminMessagesForm />
          </div>
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingStepsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
