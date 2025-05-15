
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/use-admin';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { AdminStats } from '@/components/admin/AdminStats';
import DefaultExercisesList from '@/components/admin/DefaultExercisesList';
import DefaultExerciseForm from '@/components/admin/DefaultExerciseForm';
import { UserStats } from '@/components/admin/UserStats';
import UserRoleManagement from '@/components/admin/UserRoleManagement';
import AdminMessagesList from '@/components/admin/AdminMessagesList';
import AdminMessagesForm from '@/components/admin/AdminMessagesForm';
import FeedbackList from '@/components/admin/FeedbackList';
import CurriculumEditor from '@/components/admin/CurriculumEditor';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AdminPage - User:', user);
    console.log('AdminPage - Admin status:', isAdmin);
    console.log('AdminPage - Loading state:', loading);
    
    // Wait for admin check to complete
    if (loading) return;
    
    // Set loading state to false when admin check is done
    setIsLoading(false);
    
    // If user is not admin, show error and redirect
    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [user, isAdmin, loading, navigate]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage the application settings and content</p>
      </div>
      
      <Tabs defaultValue="stats">
        <TabsList className="mb-6">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="exercises">Default Exercises</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="messages">User Messages</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats">
          <AdminStats />
        </TabsContent>
        
        <TabsContent value="exercises">
          <div className="space-y-6">
            <DefaultExercisesList />
            <DefaultExerciseForm />
          </div>
        </TabsContent>
        
        <TabsContent value="curriculum">
          <CurriculumEditor />
        </TabsContent>
        
        <TabsContent value="users">
          <div className="space-y-8">
            <UserStats />
            <UserRoleManagement />
          </div>
        </TabsContent>
        
        <TabsContent value="messages">
          <div className="space-y-8">
            <AdminMessagesList />
            <AdminMessagesForm />
          </div>
        </TabsContent>
        
        <TabsContent value="feedback">
          <FeedbackList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
